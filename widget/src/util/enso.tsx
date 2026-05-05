import { useAccount, usePublicClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import {
  EnsoClient,
  type RouteParams,
  type RouteData,
  type BridgeStatusData,
} from "@ensofinance/sdk";
import { type Address, erc20Abi, isAddress, isAddressEqual } from "viem";
import {
  useCurrentChainList,
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
  NonTokenizedPosition,
  NontokenizedRouteData,
  SuccessDetails,
  Token,
} from "@/types";

let ensoClient: EnsoClient | null = null;
let ensoApiKey = "";
let ensoBaseUrl = "https://shortcuts-backend-dynamic-int.herokuapp.com";

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

const getEnsoHeaders = () => ({
  Authorization: `Bearer ${ensoApiKey}`,
  "x-enso-widget": "shortcuts",
});

const appendArrayParams = (
  searchParams: URLSearchParams,
  key: string,
  values?: string[] | number[]
) => {
  values?.forEach((value) => searchParams.append(key, String(value)));
};

const normalizeEnsoBaseUrl = (baseUrl?: string) =>
  (baseUrl ?? "https://shortcuts-backend-dynamic-int.herokuapp.com")
    .replace(/\/api\/v1\/?$/, "")
    .replace(/\/$/, "");

export const initEnsoClient = (apiKey: string, baseUrl?: string) => {
  ensoApiKey = apiKey;
  ensoBaseUrl = normalizeEnsoBaseUrl(baseUrl);
  ensoClient = new EnsoClient({
    // baseURL: "http://localhost:3000/api/v1",
    baseURL: "https://shortcuts-backend-dynamic-int.herokuapp.com/api/v1",
    // baseURL: "https://shortcuts-backend-dynamic-dev.herokuapp.com/api/v1",
    // baseURL: "https://api.enso.build/api/v1",
    apiKey: "18a49d71-3d8c-4346-87a5-1b856cb3e1dc",
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
  const involvesNative =
    params.tokenIn[0] === ETH_ADDRESS || params.tokenOut[0] === ETH_ADDRESS;
  if (!involvesNative) return false;
  return (
    CHAINS_WITHOUT_NATIVE.has(params.chainId) ||
    (params.destinationChainId !== undefined &&
      CHAINS_WITHOUT_NATIVE.has(params.destinationChainId))
  );
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
    queryFn: () => ensoClient.getRouteData(params),
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
  onSuccess?: (hash: string, details?: SuccessDetails) => void,
  enabled = true
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

  const routerData = useEnsoRouterData(routerParams, enabled);

  const { track } = useTxTracker();

  const successCallback = useCallback(
    (hash) => {
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

type NontokenizedRouteParams = {
  chainId: number;
  destinationChainId?: number;
  fromAddress: Address;
  receiver: Address;
  spender: Address;
  routingStrategy: "router" | "delegate" | "delegate-legacy" | "checkout";
  tokenIn: Address[];
  positionOut: string;
  amountIn: string[];
  slippage: number;
  referralCode?: string;
  fee?: string[];
  feeReceiver?: Address;
};

export const useNontokenizedPositions = ({
  chainId,
  protocolSlug,
  enabled = true,
}: {
  chainId?: number;
  protocolSlug?: string;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: ["enso-nontokenized", chainId, protocolSlug],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (chainId) searchParams.set("chainId", String(chainId));
      if (protocolSlug) searchParams.set("protocolSlug", protocolSlug);
      searchParams.set("pageSize", "1000");

      const response = await fetch(
        `${ensoBaseUrl}/api/v1/nontokenized?${searchParams.toString()}`,
        { headers: getEnsoHeaders() }
      );

      if (!response.ok) throw new Error(await response.text());

      return (await response.json()) as {
        data: NonTokenizedPosition[];
        meta: { total: number; perPage: number; cursor?: number };
      };
    },
    enabled,
  });

const useEnsoNontokenizedRouterData = (
  params: NontokenizedRouteParams,
  enabled = true
) =>
  useQuery({
    queryKey: [
      "enso-nontokenized-router",
      params.chainId,
      params.destinationChainId,
      params.fromAddress,
      params.tokenIn,
      params.positionOut,
      params.amountIn,
      params.fee,
      params.feeReceiver,
    ],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set("chainId", String(params.chainId));
      searchParams.set("fromAddress", params.fromAddress);
      searchParams.set("receiver", params.receiver);
      searchParams.set("spender", params.spender);
      searchParams.set("routingStrategy", params.routingStrategy);
      searchParams.set("positionOut", params.positionOut);
      searchParams.set("slippage", String(params.slippage));
      if (params.destinationChainId) {
        searchParams.set("destinationChainId", String(params.destinationChainId));
      }
      if (params.referralCode) searchParams.set("referralCode", params.referralCode);
      if (params.feeReceiver) searchParams.set("feeReceiver", params.feeReceiver);
      appendArrayParams(searchParams, "tokenIn", params.tokenIn);
      appendArrayParams(searchParams, "amountIn", params.amountIn);
      appendArrayParams(searchParams, "fee", params.fee);

      const response = await fetch(
        `${ensoBaseUrl}/api/v1/shortcuts/route/nontokenized?${searchParams.toString()}`,
        { headers: getEnsoHeaders() }
      );

      if (!response.ok) throw new Error(await response.text());

      return (await response.json()) as NontokenizedRouteData;
    },
    refetchInterval: 30 * 1000,
    enabled:
      enabled &&
      +params.amountIn[0] > 0 &&
      isAddress(params.fromAddress) &&
      isAddress(params.tokenIn[0]) &&
      Boolean(params.positionOut),
    retry: 2,
  });

export const useEnsoNontokenizedData = (
  amountIn: string,
  tokenIn: Address,
  positionOut: string | undefined,
  positionOutData: NonTokenizedPosition | undefined,
  slippage: number,
  referralCode?: string,
  fee?: { fee: number; feeReceiver: Address },
  onSuccess?: (hash: string, details?: SuccessDetails) => void
) => {
  const { address = VITALIK_ADDRESS } = useAccount();
  const chainId = usePriorityChainId();
  const outChainId = useOutChainId();
  const routerParams: NontokenizedRouteParams = {
    referralCode,
    amountIn: [amountIn],
    tokenIn: [tokenIn],
    positionOut: positionOut ?? "",
    slippage,
    fromAddress: address,
    receiver: address,
    spender: address,
    routingStrategy: "router",
    chainId,
    ...(fee && { fee: [String(fee.fee)], feeReceiver: fee.feeReceiver }),
  };

  if (outChainId !== chainId) routerParams.destinationChainId = outChainId;

  const {
    tokens: [tokenFromData],
  } = useEnsoToken({ address: tokenIn, enabled: isAddress(tokenIn) });

  const routeTitle = `Purchase ${formatNumber(
    normalizeValue(amountIn, tokenFromData?.decimals)
  )} ${tokenFromData?.symbol} of ${positionOutData?.name ?? "position"}`;

  const routerData = useEnsoNontokenizedRouterData(routerParams, Boolean(positionOut));
  const { track } = useTxTracker();

  const successCallback = useCallback(
    (hash) => {
      track({
        hash,
        chainId,
        bridgeProtocol: getBridgeProtocol(routerData.data?.route),
        message: routeTitle,
        onConfirmed: () => {},
      });

      onSuccess?.(hash, {
        amountIn,
        tokenIn: tokenFromData,
        positionOut: positionOutData,
        slippage,
        routerData: routerData.data,
      });
    },
    [routeTitle, chainId, routerData.data, tokenFromData?.address, positionOutData?.positionId]
  );

  const sendTransaction = useExtendedSendTransaction({
    args: routerData.data?.tx,
    onSuccess: successCallback,
  });

  return { ...routerData, sendTransaction };
};

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

const useOnchainTokenMetadata = (
  address: Address | undefined,
  chainId: number | undefined,
  enabled: boolean
) => {
  const publicClient = usePublicClient({ chainId });

  return useQuery<Token | null>({
    queryKey: ["onchain-token", address?.toLowerCase(), chainId],
    queryFn: async () => {
      const tokenAddress = address as Address;
      const [decimalsResult, symbolResult, nameResult] =
        await publicClient.multicall({
          allowFailure: true,
          // Required by viem 2.48 type signature (Pick from CallParameters); empty array is a no-op at runtime.
          authorizationList: [],
          contracts: [
            {
              address: tokenAddress,
              abi: erc20Abi,
              functionName: "decimals",
            },
            {
              address: tokenAddress,
              abi: erc20Abi,
              functionName: "symbol",
            },
            {
              address: tokenAddress,
              abi: erc20Abi,
              functionName: "name",
            },
          ],
        });

      if (decimalsResult.status !== "success") {
        throw new Error("decimals() failed");
      }

      const symbol =
        symbolResult.status === "success" ? symbolResult.result : "";
      const name = nameResult.status === "success" ? nameResult.result : symbol;

      return {
        address: tokenAddress.toLowerCase() as Address,
        decimals: decimalsResult.result,
        symbol,
        name,
        logoURI: "",
      };
    },
    enabled: enabled && !!publicClient && !!address && isAddress(address),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 0,
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
  const chainId = usePriorityChainId(priorityChainId);
  const isSingleAddress = typeof address === "string" && isAddress(address);
  const singleAddress = isSingleAddress ? (address as Address) : undefined;
  const isNative =
    isSingleAddress && isAddressEqual(singleAddress, ETH_ADDRESS);

  const { data, isLoading: ensoLoading } = useEnsoTokenDetails({
    address,
    priorityChainId,
    project,
    protocolSlug,
    enabled,
  });
  const tokenFromList = useTokenFromList(address, priorityChainId);
  const { isLoading: chainListLoading } = useCurrentChainList(priorityChainId);

  const ensoHasUsableData =
    !!data?.data?.length && data.data[0]?.decimals != null;
  const listMatch =
    isSingleAddress && !isNative ? tokenFromList?.find((t) => !!t) : undefined;
  const listOk = listMatch?.decimals != null;

  const fallbackEligible =
    enabled !== false &&
    isSingleAddress &&
    !isNative &&
    !ensoLoading &&
    !ensoHasUsableData &&
    !chainListLoading &&
    !listOk;

  const { data: priceData, isLoading: priceLoading } = useEnsoPrice(
    singleAddress,
    priorityChainId,
    fallbackEligible
  );
  const priceOk = priceData?.decimals != null;

  const { data: onchainToken, isLoading: onchainLoading } =
    useOnchainTokenMetadata(singleAddress, chainId, fallbackEligible);

  const tokens: Token[] = useMemo(() => {
    if (enabled === false) return [];

    if (ensoHasUsableData) {
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
    }

    if (!isSingleAddress || isNative) return [];

    if (listOk) {
      return [
        {
          address: listMatch.address.toLowerCase() as Address,
          name: listMatch.name,
          symbol: listMatch.symbol,
          decimals: listMatch.decimals,
          logoURI: listMatch.logoURI ?? "",
        },
      ];
    }

    if (priceOk) {
      return [
        {
          address: singleAddress.toLowerCase() as Address,
          name: priceData.symbol,
          symbol: priceData.symbol,
          decimals: priceData.decimals,
          logoURI: "",
        },
      ];
    }

    if (onchainToken) return [onchainToken];

    return [];
  }, [
    enabled,
    ensoHasUsableData,
    data,
    tokenFromList,
    isSingleAddress,
    isNative,
    listOk,
    listMatch,
    priceOk,
    priceData,
    onchainToken,
    singleAddress,
  ]);

  const isLoading =
    ensoLoading ||
    (fallbackEligible &&
      !priceOk &&
      !onchainToken &&
      (chainListLoading || priceLoading || onchainLoading));

  return { tokens, isLoading };
};

export const useEnsoPrice = (
  address?: Address,
  priorityChainId?: SupportedChainId,
  enabled = true
) => {
  const chainId = usePriorityChainId(priorityChainId);

  return useQuery({
    queryKey: ["enso-token-price", address, chainId],
    queryFn: () => ensoClient.getPriceData({ address: address!, chainId }),
    staleTime: 1000 * 30,
    refetchInterval: (query) => (query.state.data ? 1000 * 30 : false),
    retry: 0,
    enabled: Boolean(enabled && !!chainId && isAddress(address)),
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
