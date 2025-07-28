import { Address } from "viem";
import { Token } from "@/util/common";

export const ERROR_MSG =
  "Swap not found for a required underlying of defi route, please make sure your amount is within an acceptable range";

export const VITALIK_ADDRESS = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
export const ETH_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
export const ETH_TOKEN: Token = {
  address: ETH_ADDRESS,
  name: "Ethereum",
  symbol: "ETH",
  decimals: 18,
  logoURI: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
};
export const BNB_TOKEN: Token = {
  address: ETH_ADDRESS,
  name: "Binance Coin",
  symbol: "BNB",
  decimals: 18,
  logoURI:
    "https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png",
};
export const AVAX_TOKEN: Token = {
  address: ETH_ADDRESS,
  name: "Avalanche",
  symbol: "AVAX",
  decimals: 18,
  logoURI:
    "https://assets.coingecko.com/coins/images/12559/large/coin-round-red.png",
};
export const MATIC_TOKEN: Token = {
  address: ETH_ADDRESS,
  name: "Polygon",
  symbol: "MATIC",
  decimals: 18,
  logoURI:
    "https://assets.coingecko.com/coins/images/4713/large/matic___polygon.jpg",
};
const BERA_TOKEN: Token = {
  address: ETH_ADDRESS,
  name: "BeraChain",
  symbol: "BERA",
  decimals: 18,
  logoURI:
    "https://assets.coingecko.com/coins/images/25235/large/BERA.png?1738822008",
};
const DAI_TOKEN: Token = {
  address: ETH_ADDRESS,
  name: "Gnosis XDAI",
  symbol: "XDAI",
  decimals: 18,
  logoURI:
    "https://assets.coingecko.com/coins/images/11062/large/Identity-Primary-DarkBG.png",
};
const SONIC_TOKEN: Token = {
  address: ETH_ADDRESS,
  name: "Sonic",
  symbol: "S",
  decimals: 18,
  logoURI:
    "https://assets.coingecko.com/coins/images/38108/standard/200x200_Sonic_Logo.png",
};
const PLUME_TOKEN: Token = {
  address: ETH_ADDRESS,
  name: "Plume",
  symbol: "PLUME",
  decimals: 18,
  logoURI:
    "https://assets.coingecko.com/coins/images/53623/standard/plume-token.png?1736896935",
};
const HYPERLIQUID_TOKEN: Token = {
  address: ETH_ADDRESS,
  name: "Hyperliquid",
  symbol: "HYPE",
  decimals: 18,
  logoURI:
    "https://assets.coingecko.com/asset_platforms/images/243/large/hyperliquid.png",
};

export enum SupportedChainId {
  MAINNET = 1,
  ARBITRUM_ONE = 42161,
  OPTIMISM = 10,
  POLYGON = 137,
  BSC = 56,
  // BOBA = 288,
  BASE = 8453,
  // BLAST = 81457,
  // SCROLL = 534352,
  LINEA = 59144,
  ZKSYNC = 324,
  GNOSIS = 100,
  AVALANCHE = 43114,
  BERACHAIN = 80094,
  SONIC = 146,
  UNICHAIN = 130,
  INK = 57073,
  SONEIUM = 1868,
  PLUME = 98866,
  HYPERLIQUID = 999,
  KATANA = 747474,
  // ARBITRUM_RINKEBY = 421611,
  // OPTIMISM_GOERLI = 420,w
  // GOERLI = 5,
  // POLYGON_MUMBAI = 80001,
  // CELO = 42220,
  // CELO_ALFAJORES = 44787,
}

export const GECKO_CHAIN_NAMES: { [key in SupportedChainId]: string } = {
  [SupportedChainId.MAINNET]: "ethereum",
  [SupportedChainId.ARBITRUM_ONE]: "arbitrum-one",
  [SupportedChainId.OPTIMISM]: "optimistic-ethereum",
  [SupportedChainId.POLYGON]: "polygon-pos",
  // [SupportedChainId.BOBA]: "boba",
  [SupportedChainId.BASE]: "base",
  [SupportedChainId.BSC]: "binance-smart-chain",
  // [SupportedChainId.BLAST]: "blast",
  // [SupportedChainId.SCROLL]: "scroll",
  [SupportedChainId.LINEA]: "linea",
  [SupportedChainId.ZKSYNC]: "zksync",
  [SupportedChainId.GNOSIS]: "xdai",
  [SupportedChainId.AVALANCHE]: "avalanche",
  [SupportedChainId.BERACHAIN]: "berachain",
  [SupportedChainId.SONIC]: "sonic",
  [SupportedChainId.UNICHAIN]: "unichain",
  [SupportedChainId.INK]: "ink",
  [SupportedChainId.SONEIUM]: "soneium",
  [SupportedChainId.PLUME]: "plume",
  [SupportedChainId.HYPERLIQUID]: "hyperevm",
  [SupportedChainId.KATANA]: "katana",
};

export const STARGATE_CHAIN_NAMES: { [key in SupportedChainId]: string } = {
  [SupportedChainId.MAINNET]: "ethereum",
  [SupportedChainId.BASE]: "base",
  [SupportedChainId.POLYGON]: "polygon",
  [SupportedChainId.BSC]: "bsc",
  [SupportedChainId.LINEA]: "linea",
  [SupportedChainId.ZKSYNC]: "zksync",
  [SupportedChainId.GNOSIS]: "gnosis",
  [SupportedChainId.AVALANCHE]: "avalanche",
  [SupportedChainId.BERACHAIN]: "bera",
  [SupportedChainId.SONIC]: "sonic",
  [SupportedChainId.ARBITRUM_ONE]: "arbitrum",
  [SupportedChainId.OPTIMISM]: "optimism",
  [SupportedChainId.UNICHAIN]: "unichain",
  [SupportedChainId.INK]: "ink",
  [SupportedChainId.SONEIUM]: "soneium",
  [SupportedChainId.PLUME]: "plumephoenix",
  [SupportedChainId.HYPERLIQUID]: "hyperliquid",
  [SupportedChainId.KATANA]: "katana",
};

export const MOCK_IMAGE_URL =
  "https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png";

export const CHAINS_ETHERSCAN: Record<SupportedChainId, string> = {
  [SupportedChainId.OPTIMISM]: "https://optimistic.etherscan.io",
  [SupportedChainId.MAINNET]: "https://etherscan.io",
  [SupportedChainId.ARBITRUM_ONE]: "https://arbiscan.io",
  [SupportedChainId.POLYGON]: "https://polygonscan.com",
  [SupportedChainId.BSC]: "https://bscscan.com",
  // [SupportedChainId.BOBA]: "https://bobascan.com",
  [SupportedChainId.BASE]: "https://basescan.org",
  // [SupportedChainId.BLAST]: "https://blastscan.io",
  // [SupportedChainId.SCROLL]: "https://scrollscan.com",
  [SupportedChainId.LINEA]: "https://lineascan.build",
  [SupportedChainId.ZKSYNC]: "https://explorer.zksync.io/",
  [SupportedChainId.GNOSIS]: "https://gnosisscan.io/",
  [SupportedChainId.AVALANCHE]: "https://cchain.explorer.avax.network",
  [SupportedChainId.BERACHAIN]: "https://berascan.com",
  [SupportedChainId.SONIC]: "https://sonicscan.io",
  [SupportedChainId.UNICHAIN]: "https://uniscan.xyz",
  [SupportedChainId.INK]: "https://explorer.inkonchain.com",
  [SupportedChainId.SONEIUM]: "https://soneium.blockscout.com/",
  [SupportedChainId.PLUME]: "https://explorer.plume.org/",
  [SupportedChainId.HYPERLIQUID]: "https://www.hyperscan.com/",
  [SupportedChainId.KATANA]: "https://explorer-katana.t.conduit.xyz/",
};

export const NATIVE_ETH_CHAINS = [
  SupportedChainId.MAINNET,
  SupportedChainId.ARBITRUM_ONE,
  SupportedChainId.OPTIMISM,
  SupportedChainId.BASE,
  SupportedChainId.LINEA,
  SupportedChainId.ZKSYNC,
  SupportedChainId.SONEIUM,
  SupportedChainId.UNICHAIN,
  SupportedChainId.INK,
];

export const CHAINS_NATIVE_TOKENS: Record<SupportedChainId, Token> = {
  [SupportedChainId.MAINNET]: ETH_TOKEN,
  [SupportedChainId.ARBITRUM_ONE]: ETH_TOKEN,
  [SupportedChainId.OPTIMISM]: ETH_TOKEN,
  [SupportedChainId.BASE]: ETH_TOKEN,
  [SupportedChainId.LINEA]: ETH_TOKEN,
  [SupportedChainId.ZKSYNC]: ETH_TOKEN,
  [SupportedChainId.SONEIUM]: ETH_TOKEN,
  [SupportedChainId.UNICHAIN]: ETH_TOKEN,
  [SupportedChainId.INK]: ETH_TOKEN,
  [SupportedChainId.BSC]: BNB_TOKEN,
  [SupportedChainId.AVALANCHE]: AVAX_TOKEN,
  [SupportedChainId.POLYGON]: MATIC_TOKEN,
  [SupportedChainId.BERACHAIN]: BERA_TOKEN,
  [SupportedChainId.GNOSIS]: DAI_TOKEN,
  [SupportedChainId.SONIC]: SONIC_TOKEN,
  [SupportedChainId.PLUME]: PLUME_TOKEN,
  [SupportedChainId.HYPERLIQUID]: HYPERLIQUID_TOKEN,
  [SupportedChainId.KATANA]: ETH_TOKEN,
};

export const SWAP_LIMITS: Record<Address, number> = {
  ["0x09def5abc67e967d54e8233a4b5ebbc1b3fbe34b"]: 100000, // WABTC limit
};

export const SWAP_REDIRECT_TOKENS: Address[] = [
  "0x09def5abc67e967d54e8233a4b5ebbc1b3fbe34b", // WABTC
];
export const LP_REDIRECT_TOKENS: Record<Address, string> = {
  ["0x42a094364bbdca0efac8af2cf7d6b9ec885ee554"]:
    "https://app.uniswap.org/positions/create/v2?currencyA=0x09DEF5aBc67e967d54E8233A4b5EBBc1B3fbE34b&currencyB=0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599&chain=ethereum", // WABTC
};
export const ONEINCH_ONLY_TOKENS = [
  "0xcf21354360fdae8edad02c0529e55cb3e71c36c9",
  "0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3",
];

export const PRICE_IMPACT_WARN_THRESHOLD = 200; // basis points
export const DEFAULT_SLIPPAGE = 25; // 0.25%

export const MAINNET_ZAP_INPUT_TOKENS: Address[] = [
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
  "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", // WBTC
  "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT
  "0x97ad75064b20fb2b2447fed4fa953bf7f007a706", // beraSTONE
  "0x6982508145454ce325ddbe47a25d4ec3d2311933", // PEPE
  "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI
  "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984", // UNI
  "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf", // cbBTC
  "0x514910771af9ca656af840dff83e8264ecf986ca", // LINK
  "0x8236a87084f8b84306f72007f36f2618a5634494", // LBTC
  "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0", // wstETH
  "0xae78736cd615f374d3085123a210448e74fc6393", // rETH
  "0x4c9edd5852cd905f086c759e8383e09bff1e68b3", // USDe
  ETH_ADDRESS,
];

// export const CHAINS_ICON_URL: Record<SupportedChainId, string> = {
//   [SupportedChainId.MAINNET]:
//     "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
//   [SupportedChainId.ARBITRUM_ONE]:
//     "https://assets.coingecko.com/asset_platforms/images/33/large/AO_logomark.png",
//   [SupportedChainId.OPTIMISM]:
//     "https://assets.coingecko.com/asset_platforms/images/34/large/Optimism_logo.png",
//   [SupportedChainId.POLYGON]:
//     "https://assets.coingecko.com/asset_platforms/images/35/large/polygon-pos.png",
//   [SupportedChainId.BSC]:
//     "https://assets.coingecko.com/asset_platforms/images/36/large/binance-smart-chain.png",
//   [SupportedChainId.BASE]:
//     "https://assets.coingecko.com/asset_platforms/images/37/large/base.png",
//   [SupportedChainId.LINEA]:
//     "https://assets.coingecko.com/asset_platforms/images/38/large/linea.png",
//   [SupportedChainId.ZKSYNC]:
//     "https://assets.coingecko.com/asset_platforms/images/39/large/zksync.png",
//   [SupportedChainId.GNOSIS]:
//     "https://assets.coingecko.com/asset_platforms/images/40/large/xdai.png",
//   [SupportedChainId.AVALANCHE]:
//     "https://assets.coingecko.com/asset_platforms/images/41/large/avalanche-2.png",
//   [SupportedChainId.BERACHAIN]:
//     "https://assets.coingecko.com/asset_platforms/images/42/large/berachain.png",
//   [SupportedChainId.SONIC]:
//     "https://assets.coingecko.com/asset_platforms/images/43/large/sonic.png",
//   [SupportedChainId.UNICHAIN]:
//     "https://assets.coingecko.com/asset_platforms/images/22206/large/unichain.png",
//   [SupportedChainId.PLUME]:
//     "https://assets.coingecko.com/coins/images/53623/large/plume-token.png?1736896935",
//   [SupportedChainId.SONEIUM]:
//     "https://assets.coingecko.com/asset_platforms/images/22200/large/soneium-removebg-preview.png?1737099934",
//   [SupportedChainId.INK]:
//     "https://assets.coingecko.com/asset_platforms/images/22194/large/ink.jpg?1737600222",
//   [SupportedChainId.HYPERLIQUID]:
//     "https://assets.coingecko.com/asset_platforms/images/243/large/hyperliquid.png",
//   [SupportedChainId.KATANA]:
//     "https://assets.coingecko.com/asset_platforms/images/32239/large/katana.jpg",
// };
