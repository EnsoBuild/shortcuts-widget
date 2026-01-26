import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { EnsoClient, type RouteParams } from "@ensofinance/sdk";
import { type Address, isAddress } from "viem";
import {
  usePriorityChainId,
  useOutChainId,
  useTokenFromList,
} from "@/util/common";
import { useExtendedSendTransaction } from "@/util/wallet";
import {
  ONEINCH_ONLY_TOKENS,
  SupportedChainId,
  VITALIK_ADDRESS,
} from "@/constants";
import { formatNumber, normalizeValue } from ".";
import { useTxTracker } from "./useTracker";
import { SuccessDetails, Token } from "@/types";

let ensoClient: EnsoClient | null = null;

type CrosschainParams = RouteParams & {
  referralCode?: string;
  destinationChainId?: number;
};

export const setApiKey = (apiKey: string) => {
  ensoClient = new EnsoClient({
    // baseURL: "http://localhost:3000/api/v1",
    // baseURL: "https://shortcuts-backend-dynamic-int.herokuapp.com/api/v1",
    // baseURL: "https://shortcuts-backend-dynamic-dev.herokuapp.com/api/v1",
    baseURL: "https://api.enso.build/api/v1",
    apiKey,
  });

  // Add custom header to all requests
  // @ts-expect-error accessing private axios client
  ensoClient.client.interceptors.request.use((config) => {
    config.headers["x-enso-widget"] = "shortcuts";
    return config;
  });
};

export const useEnsoApprove = (tokenAddress: Address, amount: string) => {
  const { address } = useAccount();
  const chainId = usePriorityChainId();

  return useQuery({
    queryKey: ["enso-approval", tokenAddress, chainId, address, amount],
    queryFn: () =>
      ensoClient.getApprovalData({
        fromAddress: address,
        tokenAddress,
        chainId,
        amount,
      }),
    enabled: +amount > 0 && isAddress(address) && isAddress(tokenAddress),
  });
};

const useEnsoRouterData = (params: CrosschainParams, enabled = true) =>
  useQuery({
    queryKey: [
      "enso-router",
      params.chainId,
      params.destinationChainId,
      params.fromAddress,
      params.tokenIn,
      params.tokenOut,
      params.amountIn,
      params.fee,
      params.feeReceiver,
    ],
    queryFn: () => ensoClient.getRouterData(params),
    refetchInterval: 30 * 1000,
    enabled:
      enabled &&
      +params.amountIn > 0 &&
      isAddress(params.fromAddress) &&
      isAddress(params.tokenIn) &&
      isAddress(params.tokenOut) &&
      (params.tokenIn !== params.tokenOut ||
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
    amountIn,
    tokenIn,
    tokenOut,
    slippage,
    fromAddress: address,
    receiver: address,
    spender: address,
    routingStrategy: "router",
    chainId,
    ...(fee && { fee: fee.fee, feeReceiver: fee.feeReceiver }),
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
    address: routerParams.tokenOut,
    enabled: isAddress(routerParams.tokenOut),
  });
  const {
    tokens: [tokenFromData],
  } = useEnsoToken({
    address: routerParams.tokenIn,
    enabled: isAddress(routerParams.tokenIn),
  });

  const swapTitle = `Purchase ${formatNumber(
    normalizeValue(routerParams.amountIn, tokenFromData?.decimals)
  )} ${tokenFromData?.symbol} of ${tokenToData?.symbol}`;

  const routerData = useEnsoRouterData(routerParams, true);

  const { track } = useTxTracker();

  const successCallback = useCallback(
    (hash) => {
      track({
        hash,
        chainId,
        crosschain: isCrosschain,
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

// fallback to normal token details
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
  const { data, isLoading } = useEnsoTokenDetails({
    address,
    priorityChainId,
    project,
    protocolSlug,
    enabled,
  });
  const tokenFromList = useTokenFromList(address, priorityChainId);

  const tokens: Token[] = useMemo(() => {
    if (!data?.data?.length || !data?.data[0]?.decimals || !enabled) {
      return [];
    }

    return data.data.map((token) => ({
      ...token,
      address: token?.address.toLowerCase() as Address,
      logoURI:
        tokenFromList?.find((t) => t?.address == token?.address)?.logoURI ??
        token?.logosUri[0],
      underlyingTokens: token?.underlyingTokens?.map((token) => ({
        ...token,
        address: token?.address.toLowerCase() as Address,
        logoURI: token?.logosUri[0],
      })),
    }));
  }, [data, tokenFromList]);

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
