import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import {
  base,
  mainnet,
  arbitrum,
  bsc,
  linea,
  avalanche,
  optimism,
  zksync,
  gnosis,
  polygon,
  berachain,
  sonic,
  ink,
  soneium,
  unichain,
  plumeMainnet,
} from "viem/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import React from "react";

const berachainWithIcon = {
  ...berachain,
  iconUrl: "https://assets.coingecko.com/coins/images/25235/large/BERA.png",
};
const sonicWithIcon = {
  ...sonic,
  iconUrl:
    "https://assets.coingecko.com/coins/images/38108/large/200x200_Sonic_Logo.png",
};
const plumeWithIcon = {
  ...plumeMainnet,
  iconUrl:
    "https://assets.coingecko.com/coins/images/53623/large/plume-token.png",
};

const soneiumWithIcon = {
  ...soneium,
  name: "Soneium",
  iconUrl:
    "https://assets.coingecko.com/asset_platforms/images/22200/large/soneium-removebg-preview.png",
};

const ethereumWithRpc = {
  ...mainnet,
  rpcUrls: {
    default: {
      http: [
        "https://mainnet.gateway.tenderly.co",
        "https://eth-mainnet.public.blastapi.io",
      ],
      webSocket: [
        "wss://mainnet.gateway.tenderly.co",
        "wss://ethereum-rpc.publicnode.com",
      ],
    },
  },
};

const baseWithRpc = {
  ...base,
  rpcUrls: {
    default: {
      http: [
        "https://base-rpc.publicnode.com",
        "https://base-mainnet.public.blastapi.io",
      ],
      webSocket: [
        "wss://base-rpc.publicnode.com",
        "wss://base-mainnet.public.blastapi.io",
      ],
    },
  },
};

const hyperevm = {
  id: 999,
  name: "Hyperevm",
  iconUrl:
    "https://assets.coingecko.com/asset_platforms/images/243/large/hyperliquid.png",
  nativeCurrency: {
    decimals: 18,
    name: "Hyperliquid",
    symbol: "HYPE",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.hyperliquid.xyz/evm", "https://hyperliquid.drpc.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Hyperscan",
      url: "https://www.hyperscan.com/",
    },
  },
};

const katana = {
  id: 747474,
  name: "Katana",
  logoURI:
    "https://assets.coingecko.com/asset_platforms/images/32239/large/katana.jpg",
  nativeCurrency: { name: "Katana Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc.katana.network", "https://rpc.katanarpc.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Etherscan",
      url: "https://explorer-katana.t.conduit.xyz/",
      apiUrl: "https://api.lineascan.build/api",
    },
  },
};

const projectId = import.meta.env.VITE_RAINBOWKIT_PROJECT_ID ?? "";

const config = getDefaultConfig({
  appName: "Happy Path",
  projectId,
  chains: [
    ethereumWithRpc,
    baseWithRpc,
    arbitrum,
    berachainWithIcon,
    katana,
    sonicWithIcon,
    unichain,
    plumeWithIcon,
    optimism,
    hyperevm,
    soneiumWithIcon,
    bsc,
    zksync,
    avalanche,
    gnosis,
    polygon,
    linea,
    ink,
  ],
});
const queryClient = new QueryClient();

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default Providers;
