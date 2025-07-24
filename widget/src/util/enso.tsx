import { useAccount } from "wagmi";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import {
  EnsoClient,
  type RouteParams,
  type BundleAction,
  type BundleParams,
  BundleActionType,
} from "@ensofinance/sdk";
import { type Address, isAddress } from "viem";
import {
  type Token,
  usePriorityChainId,
  useOutChainId,
  useTokenFromList,
} from "@/util/common";
import { useExtendedSendTransaction } from "@/util/wallet";
import {
  ONEINCH_ONLY_TOKENS,
  SupportedChainId,
  STARGATE_CHAIN_NAMES,
  NATIVE_ETH_CHAINS,
  VITALIK_ADDRESS,
} from "@/constants";
import { formatNumber, normalizeValue } from ".";
import { useTxTracker } from "./useTracker";

let ensoClient: EnsoClient | null = null;

type CrosschainParams = RouteParams & {
  referralCode: string;
  destinationChainId?: number;
};

export const setApiKey = (apiKey: string) => {
  ensoClient = new EnsoClient({
    // baseURL: "http://localhost:3000/api/v1",
    // baseURL: "https://shortcuts-backend-dynamic-int.herokuapp.com/api/v1",
    // baseURL: "https://shortcuts-backend-dynamic-dev.herokuapp.com/api/v1",
    baseURL: "https://api.enso.finance/api/v1",
    apiKey,
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

const useStargatePools = () =>
  useQuery<
    {
      address: Address;
      chainKey: string;
      token: { address: Address; symbol: string };
    }[]
  >({
    queryKey: ["stargate-pools"],
    queryFn: () =>
      fetch("https://mainnet.stargate-api.com/v1/metadata?version=v2")
        .then((res) => res.json())
        .then(({ data }) => data.v2),
  });

const useStargateTokensGetter = () => {
  const { data: stargatePools } = useStargatePools();

  return useCallback(
    (chainId: SupportedChainId, tokenSymbol: string) => {
      const foundOccurrency = stargatePools?.find(
        (pool) =>
          pool.chainKey === STARGATE_CHAIN_NAMES[chainId] &&
          pool.token.symbol.includes(tokenSymbol)
      );

      let underyingToken = foundOccurrency?.token.address.toLowerCase();

      if (underyingToken === "0x0000000000000000000000000000000000000000") {
        underyingToken = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
      }

      return [
        foundOccurrency?.address.toLowerCase() as Address,
        underyingToken,
      ];
    },
    [stargatePools]
  );
};

const useBridgeBundle = (
  {
    tokenIn,
    tokenOut,
    amountIn,
    receiver,
    chainId,
    destinationChainId,
    slippage,
  }: {
    tokenIn: Address;
    tokenOut: Address;
    amountIn: string;
    receiver: Address;
    chainId: SupportedChainId;
    destinationChainId: SupportedChainId;
    slippage: number;
  },
  enabled = false
) => {
  const getStargateTokens = useStargateTokensGetter();
  const {
    tokens: [tokenInData],
  } = useEnsoToken({ address: tokenIn, enabled: isAddress(tokenIn) });
  const {
    tokens: [tokenOutData],
  } = useEnsoToken({
    address: tokenOut,
    priorityChainId: destinationChainId,
    enabled: isAddress(tokenOut),
  });

  /*
    If outToken is stable it should have priority
    Than if inToken is stable it should have priority
    Having pririty means use it if it is USDC/USDT or just use one of them
    Otherwise use default priority depending on if chain is native eth chain
  */
  const prioritizedBridgeSymbols = useMemo(() => {
    if (!tokenInData || !tokenOutData) {
      return [];
    }
    const stableTokens = ["USDC", "USDT"];
    const stablePriority = [...stableTokens, "ETH"];
    const defaultPriority =
      NATIVE_ETH_CHAINS.includes(chainId) &&
      NATIVE_ETH_CHAINS.includes(destinationChainId)
        ? ["ETH", ...stableTokens]
        : stablePriority;

    const tokenOutStable = stableTokens.find((token) =>
      tokenOutData.symbol.includes(token)
    );

    if (tokenOutStable) {
      return [
        tokenOutStable,
        ...stablePriority.filter((token) => token !== tokenOutStable),
      ];
    }

    return defaultPriority;
  }, [tokenInData, tokenOutData, chainId, destinationChainId]);

  const [sourcePool, sourceToken, destinationToken] = useMemo(() => {
    for (const tokenNameToBridge of prioritizedBridgeSymbols) {
      const [sourcePool, sourceToken] = getStargateTokens(
        chainId,
        tokenNameToBridge
      );
      const [, destinationToken] = getStargateTokens(
        destinationChainId,
        tokenNameToBridge
      );

      if (sourceToken && destinationToken) {
        return [sourcePool, sourceToken, destinationToken];
      }
    }
    return [null, null, null];
  }, [
    chainId,
    destinationChainId,
    prioritizedBridgeSymbols,
    getStargateTokens,
  ]);

  const bundleActions: BundleAction[] = [
    {
      protocol: "stargate",
      action: BundleActionType.Bridge,
      args: {
        // @ts-ignore
        primaryAddress: sourcePool,
        destinationChainId,
        // @ts-ignore
        tokenIn: sourceToken,
        amountIn,
        receiver,
        callback:
          destinationToken !== tokenOut
            ? [
                {
                  protocol: "enso",
                  action: BundleActionType.Balance,
                  args: {
                    token: destinationToken,
                  },
                },
                {
                  protocol: "enso",
                  action: BundleActionType.Route,
                  slippage,
                  args: {
                    tokenIn: destinationToken,
                    tokenOut,
                    amountIn: {
                      useOutputOfCallAt: 0,
                    },
                  },
                },
              ]
            : undefined,
      },
    },
  ];

  if (tokenIn !== sourceToken) {
    // @ts-ignore
    bundleActions[0].args.amountIn = {
      useOutputOfCallAt: 0,
    };
    bundleActions.unshift({
      protocol: "enso",
      action: BundleActionType.Route,
      slippage,
      args: {
        tokenIn,
        amountIn,
        tokenOut: sourceToken,
      },
    } as BundleAction);
  }

  const { data, isLoading, error } = useBundleData(
    { chainId, fromAddress: receiver, spender: receiver },
    bundleActions,
    enabled
  );

  const bundleData = {
    tx: data?.tx,
    // @ts-ignore
    route: data?.route,
    amountOut:
      Object.entries(data?.amountsOut || {}).find(
        ([key]) => key.toLowerCase() === tokenOut.toLowerCase()
      )?.[1] || "0",
    gas: data?.gas || "0",
  };

  return {
    data: bundleData,
    isLoading,
    error,
  };
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
    ],
    queryFn: () => ensoClient.getRouterData(params),
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

export const useBundleData = (
  bundleParams: BundleParams,
  bundleActions: BundleAction[],
  enabled = true
) => {
  const chainId = usePriorityChainId();

  return useQuery({
    queryKey: ["enso-bundle", chainId, bundleParams, bundleActions],
    queryFn: () => ensoClient.getBundleData(bundleParams, bundleActions),
    enabled:
      enabled &&
      bundleActions.length > 0 &&
      isAddress(bundleParams.fromAddress) &&
      // @ts-ignore
      +(bundleActions[0]?.args?.amountIn as string) > 0 &&
      // @ts-ignore
      (isAddress(bundleActions[0]?.args?.tokenOut) ||
        bundleActions[0].action === BundleActionType.Bridge),
  });
};

export const useEnsoData = (
  amountIn: string,
  tokenIn: Address,
  tokenOut: Address,
  slippage: number,
  referralCode?: string,
  onSuccess?: (hash: string) => void
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

  // const {
  //   data: bundleData,
  //   isLoading: bundleLoading,
  //   error: bundleError,
  // } = useBridgeBundle(
  //   {
  //     tokenIn,
  //     tokenOut,
  //     amountIn,
  //     receiver: address,
  //     chainId,
  //     destinationChainId: outChainId,
  //     slippage,
  //   },
  //   !isCrosschain
  // );

  // const data = isCrosschain ? routerData : bundleData;
  // const isLoading = isCrosschain ? routerLoading : bundleLoading;

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
      onSuccess?.(hash);
    },
    [swapTitle, chainId],
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
