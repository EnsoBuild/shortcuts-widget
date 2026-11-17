import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  EnsoClient,
  type RouteParams,
  type RouteData,
  type BridgeStatusData,
} from "@ensofinance/sdk";
import { type Address, isAddress, isAddressEqual } from "viem";
import {
  compareCaseInsensitive,
  usePriorityChainId,
  useOutChainId,
  useTokenFromList,
} from "@/util/common";
import { useExtendedSendTransaction } from "@/util/wallet";
import {
  CHAINS_WITHOUT_NATIVE,
  ETH_ADDRESS,
  ONEINCH_ONLY_TOKENS,
  SupportedChainId,
  VITALIK_ADDRESS,
} from "@/constants";
import { formatNumber, normalizeValue } from ".";
import { useTxTracker } from "./useTracker";
import {
  activateFlowTrace,
  fetchTracedRoute,
  FLOW_TRACE_MAX_AGE_MS,
  newTraceId,
  rememberTxTrace,
  toTraceparent,
  traceIdForRequest,
} from "./trace";
import { SuccessDetails, Token } from "@/types";

let ensoClient: EnsoClient | null = null;

type CrosschainParams = RouteParams & {
  referralCode?: string;
  destinationChainId?: number;
};

const BRIDGE_STATUS_PROTOCOL: Record<string, string> = {
  stargate: "layerzero",
};

const getBridgeProtocol = (route?: RouteData["route"]): string | undefined => {
  const protocol = route?.find((hop) => hop.action === "bridge")?.protocol;
  return protocol ? (BRIDGE_STATUS_PROTOCOL[protocol] ?? protocol) : undefined;
};

export const checkBridgeStatus = (
  bridgeProtocol: string,
  chainId: number,
  txHash: string
): Promise<BridgeStatusData> =>
  ensoClient.getBridgeStatus({ bridgeProtocol, chainId, txHash });

export const initEnsoClient = (apiKey: string, baseUrl?: string) => {
  ensoClient = new EnsoClient({
    ...(baseUrl && { baseURL: baseUrl }),
    apiKey,
  });

  // Add custom headers to all requests
  // @ts-expect-error accessing private axios client
  ensoClient.client.interceptors.request.use((config) => {
    config.headers["x-enso-widget"] = "shortcuts";
    const traceId = traceIdForRequest(config.url, config.params);
    if (traceId) config.headers["traceparent"] = toTraceparent(traceId);
    return config;
  });
};

export const useEnsoApprove = (tokenAddress: Address, amount: string) => {
  const { address } = useAccount();
  const chainId = usePriorityChainId();
  const isNative =
    isAddress(tokenAddress) && isAddressEqual(tokenAddress, ETH_ADDRESS);

  return useQuery({
    queryKey: ["enso-approval", tokenAddress, chainId, address, amount],
    queryFn: () =>
      ensoClient.getApprovalData({
        fromAddress: address,
        tokenAddress,
        chainId,
        amount,
      }),
    enabled:
      !isNative && +amount > 0 && isAddress(address) && isAddress(tokenAddress),
  });
};

const involvesNativeOnNoNativeChain = (params: CrosschainParams) => {
  const tokenInChain = params.chainId;
  const tokenOutChain = params.destinationChainId ?? params.chainId;
  const tokenInNativeOnNoNative =
    params.tokenIn[0] === ETH_ADDRESS && CHAINS_WITHOUT_NATIVE.has(tokenInChain);
  const tokenOutNativeOnNoNative =
    params.tokenOut[0] === ETH_ADDRESS &&
    CHAINS_WITHOUT_NATIVE.has(tokenOutChain);
  return tokenInNativeOnNoNative || tokenOutNativeOnNoNative;
};

// One trace id per set of route inputs; it is kept through approval, submission and bridge
// status, and rotates when the inputs change or after FLOW_TRACE_MAX_AGE_MS on the same inputs.
const useFlowTraceId = (signature: string) => {
  const [flow, setFlow] = useState(() => ({
    signature,
    traceId: newTraceId(),
  }));
  const traceId = flow.signature === signature ? flow.traceId : newTraceId();
  if (flow.signature !== signature) setFlow({ signature, traceId });

  useEffect(() => {
    activateFlowTrace(traceId);
    const timer = setTimeout(
      () =>
        setFlow((current) =>
          current.traceId === traceId
            ? { signature: current.signature, traceId: newTraceId() }
            : current
        ),
      FLOW_TRACE_MAX_AGE_MS
    );
    return () => clearTimeout(timer);
  }, [traceId]);

  return traceId;
};

const useEnsoRouterData = (
  params: CrosschainParams,
  traceId: string,
  enabled = true
) =>
  useQuery({
    // every route input, so a quote always matches the inputs it was fetched for, and the
    // trace: a quote, its approval and its tx all belong to the flow on screen (a cached quote
    // from an earlier flow with the same inputs is refetched under the current one)
    queryKey: ["enso-router", params, traceId],
    // an idle flow rotating its trace refetches the same inputs: keep showing that quote meanwhile
    placeholderData: (previous, previousQuery) =>
      previousQuery &&
      JSON.stringify(previousQuery.queryKey[1]) === JSON.stringify(params)
        ? previous
        : undefined,
    queryFn: () =>
      fetchTracedRoute(params, traceId, (routeParams) =>
        ensoClient.getRouteData(routeParams)
      ),
    refetchInterval: 30 * 1000,
    enabled:
      enabled &&
      +params.amountIn[0] > 0 &&
      isAddress(params.fromAddress) &&
      isAddress(params.tokenIn[0]) &&
      isAddress(params.tokenOut[0]) &&
      !involvesNativeOnNoNativeChain(params) &&
      (params.tokenIn[0] !== params.tokenOut[0] ||
        (params.destinationChainId &&
          params.chainId !== params.destinationChainId)),
    retry: 2,
  });

export const useEnsoData = (
  amountIn: string,
  tokenIn: Address,
  tokenOut: Address,
  slippage: number,
  referralCode?: string,
  fee?: { fee: number; feeReceiver: Address },
  onSuccess?: (hash: string, details?: SuccessDetails) => void
) => {
  const { address = VITALIK_ADDRESS } = useAccount();
  const chainId = usePriorityChainId();
  const outChainId = useOutChainId();
  const routerParams: CrosschainParams = {
    referralCode,
    amountIn: [amountIn],
    tokenIn: [tokenIn],
    tokenOut: [tokenOut],
    slippage,
    fromAddress: address,
    receiver: address,
    spender: address,
    routingStrategy: "router",
    chainId,
    ...(fee && { fee: [fee.fee], feeReceiver: fee.feeReceiver }),
  };

  if (
    ONEINCH_ONLY_TOKENS.includes(tokenIn) ||
    ONEINCH_ONLY_TOKENS.includes(tokenOut)
  ) {
    // @ts-ignore
    routerParams.ignoreAggregators =
      "0x,paraswap,openocean,odos,kyberswap,native,barter";
  }
  let isCrosschain = outChainId !== chainId;

  if (isCrosschain) {
    routerParams.destinationChainId = outChainId;
  }

  const {
    tokens: [tokenToData],
  } = useEnsoToken({
    address: tokenOut,
    enabled: isAddress(tokenOut),
  });
  const {
    tokens: [tokenFromData],
  } = useEnsoToken({
    address: tokenIn,
    enabled: isAddress(tokenIn),
  });

  const swapTitle = `Purchase ${formatNumber(
    normalizeValue(amountIn, tokenFromData?.decimals)
  )} ${tokenFromData?.symbol} of ${tokenToData?.symbol}`;

  const traceId = useFlowTraceId(JSON.stringify(routerParams));
  const routeQuery = useEnsoRouterData(routerParams, traceId, true);
  const routerData = { ...routeQuery, data: routeQuery.data?.route };
  // the trace the quote on screen was fetched under, which may predate the current flow
  const quoteTraceId = routeQuery.data?.traceId;

  const { track } = useTxTracker();

  const successCallback = useCallback(
    (hash) => {
      rememberTxTrace(hash, quoteTraceId ?? traceId);
      track({
        hash,
        chainId,
        bridgeProtocol: getBridgeProtocol(routerData.data?.route),
        message: swapTitle,
        onConfirmed: () => {},
      });

      const details = {
        amountIn,
        tokenIn: tokenFromData,
        tokenOut: tokenToData,
        slippage,
        routerData: routerData.data,
      };
      onSuccess?.(hash, details);
    },
    [
      swapTitle,
      chainId,
      traceId,
      quoteTraceId,
      routerData.data,
      tokenToData?.address,
      tokenFromData?.address,
    ]
  );

  const sendTransaction = useExtendedSendTransaction({
    args: routerData.data?.tx,
    onSuccess: successCallback,
  });

  return {
    ...routerData,
    sendTransaction,
  };
};

const projectProp = "projectId";

export const useEnsoBalances = (priorityChainId?: SupportedChainId) => {
  const { address } = useAccount();
  const chainId = usePriorityChainId(priorityChainId);

  return useQuery({
    queryKey: ["enso-balances", chainId, address],
    queryFn: () =>
      ensoClient.getBalances({ useEoa: true, chainId, eoaAddress: address }),
    enabled: isAddress(address),
  });
};

const useEnsoTokenDetails = ({
  address,
  priorityChainId,
  project,
  protocolSlug,
  enabled = true,
}: {
  address: Address | Address[];
  priorityChainId?: SupportedChainId;
  project?: string;
  protocolSlug?: string;
  enabled?: boolean;
}) => {
  const chainId = usePriorityChainId(priorityChainId);

  return useQuery({
    queryKey: ["enso-token-details", address, chainId, protocolSlug, project],
    queryFn: () =>
      ensoClient.getTokenData({
        project,
        protocolSlug,
        address,
        chainId,
        includeMetadata: true,
      }),
    enabled,
  });
};

export const useEnsoToken = ({
  address,
  priorityChainId,
  project,
  protocolSlug,
  enabled,
}: {
  address?: Address | Address[];
  priorityChainId?: SupportedChainId;
  protocolSlug?: string;
  project?: string;
  enabled?: boolean;
}) => {
  const queryEnabled = enabled ?? Boolean(address || project || protocolSlug);
  const { data, isLoading } = useEnsoTokenDetails({
    address,
    priorityChainId,
    project,
    protocolSlug,
    enabled: queryEnabled,
  });
  const tokenFromList = useTokenFromList(address, priorityChainId);

  const tokens: Token[] = useMemo(() => {
    if (!queryEnabled) {
      return [];
    }

    const ensoTokens =
      data?.data
        ?.filter((token) => token?.address && token?.decimals !== undefined)
        .map((token) => {
          const fallbackToken = tokenFromList?.find((fallbackToken) =>
            compareCaseInsensitive(fallbackToken?.address, token.address)
          );
          return {
            ...fallbackToken,
            ...token,
            address: token.address.toLowerCase() as Address,
            logoURI: fallbackToken?.logoURI ?? token?.logosUri?.[0] ?? "",
            underlyingTokens: token?.underlyingTokens?.map((token) => ({
              ...token,
              address: token?.address.toLowerCase() as Address,
              logoURI: token?.logosUri?.[0] ?? "",
            })),
          };
        }) ?? [];

    if (ensoTokens.length) {
      return ensoTokens;
    }

    return tokenFromList.filter(Boolean) as Token[];
  }, [data, tokenFromList, queryEnabled]);

  return { tokens, isLoading };
};

export const useEnsoPrice = (
  address: Address,
  priorityChainId?: SupportedChainId
) => {
  const chainId = usePriorityChainId(priorityChainId);

  return useQuery({
    queryKey: ["enso-token-price", address, chainId],
    queryFn: () => ensoClient.getPriceData({ address, chainId }),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30,
    enabled: chainId && isAddress(address),
  });
};

export const useEnsoProtocols = () => {
  return useQuery({
    queryKey: ["enso-protocols"],
    queryFn: () => ensoClient.getProtocolData(),
  });
};

export const useChainProtocols = (chainId: SupportedChainId) => {
  const { data } = useEnsoProtocols();

  return data
    ?.filter(
      (protocol) =>
        protocol.chains.some((chain) => chain.id === chainId) &&
        // @ts-ignore
        protocol[projectProp] !== "permit2" &&
        // @ts-ignore
        protocol[projectProp] !== "erc4626" &&
        // @ts-ignore
        protocol[projectProp] !== "wrapped-native"
    )
    .reduce((acc, protocol) => {
      // @ts-ignore
      acc.set(protocol[projectProp], protocol);
      return acc;
    }, new Map())
    .values()
    .toArray();
};
