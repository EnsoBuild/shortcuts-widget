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
//
// const getShadowList: (chainId: number) => Promise<Token[]> = () =>
//   fetch(
//     `https://raw.githubusercontent.com/Shadow-Exchange/shadow-assets/main/blockchains/sonic/tokenlist.json`,
//   )
//     .then((res) => res.json())
//     .then((data) =>
//       data.tokens[0]
//         .map((token: any) => ({
//           ...token,
//           address: token.address?.toLowerCase(),
//           logoURI: `https://raw.githubusercontent.com/Shadow-Exchange/shadow-assets/main/blockchains/sonic/assets/${token.address}/logo.png`,
//         }))
//         .filter(({ address }) => address),
//     );

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
    USDCE: 2,
  };
  switch (chainId) {
    default:
      return defaultPriority;
  }
};

const sonicAdditionalTokens = // TODO: remove after it comes in list for sonic
  new Promise<Token[]>((resolve) =>
    resolve([
      {
        address: "0x6047828dc181963ba44974801ff68e538da5eaf9",
        name: "Tether USD",
        symbol: "USDT",
        decimals: 6,
        logoURI:
          "https://assets.coingecko.com/coins/images/325/large/Tether.png",
      },
    ]),
  );

const plumeAdditionalTokens = // Additional tokens for Plume network
  new Promise<Token[]>((resolve) =>
    resolve([
      {
        address: ETH_ADDRESS, // Native token address
        name: "Plume",
        symbol: "PLUME",
        decimals: 18,
        logoURI:
          "https://assets.coingecko.com/coins/images/53623/standard/plume-token.png?1736896935",
      },
      {
        address: "0x54FD4da2Fa19Cf0f63d8f93A6EA5BEd3F9C042C6",
        name: "USD Coin",
        symbol: "USDC",
        decimals: 6,
        logoURI:
          "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png",
      },
      {
        address: "0x78adD880A697070c1e765Ac44D65323a0DcCE913",
        name: "USD Coin.e",
        symbol: "USDC.e",
        decimals: 6,
        logoURI:
          "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png",
      },
      {
        address: "0xEa237441c92CAe6FC17Caaf9a7acB3f953be4bd1",
        name: "Wrapped Plume",
        symbol: "wPlume",
        decimals: 18,
        logoURI:
          "https://assets.coingecko.com/coins/images/53623/standard/plume-token.png?1736896935",
      },
      {
        address: "0xca59cA09E5602fAe8B629DeE83FfA819741f14be",
        name: "Wrapped Ether",
        symbol: "WETH",
        decimals: 18,
        logoURI:
          "https://assets.coingecko.com/coins/images/2518/large/weth.png",
      },
      {
        address: "0x3fE62c879EA1E4Ce3EB8d7e0dDB2D6A69d8AeC05",
        name: "myWPLUME", // remove once is in some list
        symbol: "myWPLUME",
        decimals: 18,
        logoURI: "https://icons.llamao.fi/icons/protocols/mystic-finance",
      },
    ]),
  );

const getCurrentChainTokens = (chainId: SupportedChainId) => {
  let getters: Promise<Token[] | undefined>[] = [];

  switch (chainId) {
    case SupportedChainId.BERACHAIN:
      getters = [getOogaboogaList()];
      break;
    case SupportedChainId.SONIC:
      getters = [getGeckoList(chainId), sonicAdditionalTokens];
      break;
    case SupportedChainId.PLUME:
      getters = [plumeAdditionalTokens];
      break;
    case SupportedChainId.INK:
    case SupportedChainId.UNICHAIN:
    case SupportedChainId.SONEIUM:
      getters = [getGeckoList(chainId)];
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
