import { useQuery } from "@tanstack/react-query";
import { useChainId } from "wagmi";
import { Address, zeroAddress } from "viem";
import {
  CHAINS_ETHERSCAN,
  CHAINS_NATIVE_TOKENS,
  ETH_ADDRESS,
  GECKO_CHAIN_NAMES,
  SupportedChainId,
} from "@/constants";
import { useStore } from "@/store";

export type Token = {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  underlyingTokens?: Token[];
};

export const compareCaseInsensitive = (a: string, b: string) => {
  return !!(a && b && a?.toLowerCase() === b?.toLowerCase());
};

const MOCK_ARRAY = [];

const getGeckoList = (chainId: SupportedChainId) =>
  fetch(`https://tokens.coingecko.com/${GECKO_CHAIN_NAMES[chainId]}/all.json`)
    .then((res) => res.json())
    .then((data) => data?.tokens)
    .then((tokens) => [CHAINS_NATIVE_TOKENS[chainId], ...tokens]);

const getOogaboogaList: () => Promise<Token[]> = () =>
  fetch(
    "https://mainnet.internal.oogabooga.io/token-list/tokens?chainId=80094&client=SWAP",
  )
    .then((res) => res.json())
    .then((data) =>
      data.map((token) => ({
        ...token,
        logoURI: token.tokenURI,
        address:
          token.address === zeroAddress
            ? ETH_ADDRESS
            : token.address.toLowerCase(),
      })),
    );

const getOneInchTokenList = (chainId: number) =>
  fetch("https://tokens.1inch.io/v1.2/" + chainId)
    .then((res) => res.json())
    .then((data) => Object.values(data) as Token[]);

// .catch(() => tokenList[chainId]);

const getChainSymbolSortPriority = (chainId: SupportedChainId) => {
  const defaultPriority = {
    [CHAINS_NATIVE_TOKENS[chainId].symbol]: 5,
    USDC: 4,
    DAI: 4,
    USDT: 4,
    WBTC: 4,
    WETH: 3,
    LINK: 3,
    UNI: 3,
    SUSHI: 3,
    AAVE: 3,
  };
  switch (chainId) {
    default:
      return defaultPriority;
  }
};

const getCurrentChainTokens = (chainId: SupportedChainId) => {
  let getters: Promise<Token[] | undefined>[] = [];

  switch (chainId) {
    case SupportedChainId.BERACHAIN:
      getters = [getOogaboogaList()];
      break;
    default:
      // priority for oneInch tokens
      getters = [getOneInchTokenList(chainId), getGeckoList(chainId)];
  }

  return Promise.allSettled(getters).then((results) => {
    const tokens = results
      .filter(
        (result): result is PromiseFulfilledResult<Token[]> =>
          result.status === "fulfilled",
      )
      .map((result) => result.value);

    const tokenList = tokens[0];

    if (tokens.length > 1) {
      const addedToken = new Set<string>(
        tokens[0]?.map((t) => t.address) ?? [],
      );
      const tokenList = tokens[0];

      for (let i = 1; i < tokens.length; i++) {
        const newTokens = tokens[i]?.filter(
          (token) => !addedToken.has(token.address),
        );

        if (newTokens) {
          tokenList.push(...newTokens);
          newTokens.forEach((t) => addedToken.add(t.address));
        }
      }
    }

    const priority = getChainSymbolSortPriority(chainId);

    // sort by token symbol priority
    const sortedTokenList = [...tokenList].sort((a, b) => {
      return priority[b.symbol] ?? 0 - priority[a.symbol] ?? 0;
    });

    return sortedTokenList;
  });
};

export const useCurrentChainList = () => {
  const chainId = usePriorityChainId();

  const { data } = useQuery<Token[] | undefined>({
    queryKey: ["tokenList", chainId],
    queryFn: () => getCurrentChainTokens(chainId),
    enabled: !!chainId,
  });

  return data ?? MOCK_ARRAY;
};

export const useOneInchTokenList = () => {
  const chainId = usePriorityChainId();

  return useQuery({
    queryKey: ["oneInchTokenList", chainId],
    queryFn: () => getOneInchTokenList(chainId),
    enabled: !!chainId,
  });
};

export const useTokenFromList = (tokenAddress: Address) => {
  const data = useCurrentChainList();

  return data?.find?.((token) => token.address == tokenAddress);
};

export const usePriorityChainId = () => {
  const obligatedChainId = useStore((state) => state.obligatedChainId);
  const chainId = useChainId();

  return obligatedChainId ?? chainId;
};

export const useEtherscanUrl = (
  address: string,
  type: "/address" | "/tx" = "/tx",
) => {
  const chainId = usePriorityChainId();
  const chainPrefix = CHAINS_ETHERSCAN[chainId];

  if (address) return `${chainPrefix}${type}/${address}`;
};

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const getChainName = (chainId: SupportedChainId) => {
  const geckoName = GECKO_CHAIN_NAMES[chainId];

  return capitalize(geckoName).split("-")[0];
};
