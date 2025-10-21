import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
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
  worldchain,
} from "viem/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, fallback, http, WagmiProvider } from "wagmi";
import React from "react";

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

const plasma = {
  id: 9745,
  name: "Plasma",
  logoURI:
    "https://assets.coingecko.com/asset_platforms/images/32256/large/plasma.jpg",
  nativeCurrency: { name: "Plasma Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://plasma.drpc.org", "https://rpc.plasma.to"],
    },
  },
  blockExplorers: {
    default: {
      name: "Plasmascan",
      url: "https://plasmascan.to",
      apiUrl: "https://api.plasmascan.to/api",
    },
  },
};

const projectId = import.meta.env.VITE_RAINBOWKIT_PROJECT_ID ?? "";

const { connectors } = getDefaultWallets({
  appName: "EnsoDrop",

  projectId,
});

const config = createConfig({
  connectors,
  chains: [
    mainnet,
    base,
    arbitrum,
    berachain,
    katana,
    sonic,
    unichain,
    plumeMainnet,
    optimism,
    hyperevm,
    soneium,
    bsc,
    zksync,
    avalanche,
    gnosis,
    polygon,
    linea,
    ink,
    worldchain,
    plasma,
  ],
  transports: {
    [mainnet.id]: fallback([
      http("https://mainnet.gateway.tenderly.co"),
      http("https://eth-mainnet.public.blastapi.io"),
      http(),
    ]),
    [base.id]: fallback([
      http("https://base-rpc.publicnode.com"),
      http("https://base-mainnet.public.blastapi.io"),
      http(),
    ]),
  },
  ssr: false,
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
