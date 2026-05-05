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
  worldchain,
  sei,
  // etherlink,
  megaeth,
  tempo,
  monad,
  plasma,
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

const polygonWithRpc = {
  ...polygon,
  rpcUrls: {
    default: {
      http: [
        "https://polygon-bor-rpc.publicnode.com",
        "https://polygon-mainnet.public.blastapi.io",
        "https://polygon.drpc.org",
      ],
      webSocket: [
        "wss://polygon-bor-rpc.publicnode.com",
        "wss://polygon-mainnet.public.blastapi.io",
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
      name: "Katanascan",
      url: "https://katanascan.io",
    },
  },
};

const projectId = import.meta.env.VITE_RAINBOWKIT_PROJECT_ID ?? "";

const plasmaWithIcon = {
  ...plasma,
  iconUrl:
    "https://assets.coingecko.com/asset_platforms/images/32256/large/plasma.jpg",
};

const seiWithIcon = {
  ...sei,
  iconUrl:
    "https://assets.coingecko.com/coins/images/28205/large/Sei_Logo_-_Transparent.png",
};

// const etherlinkWithIcon = {
//   ...etherlink,
//   iconUrl: "https://assets.coingecko.com/coins/images/976/large/Tezos-logo.png",
// };

const megaethWithIcon = {
  ...megaeth,
  iconUrl: "https://icons-ckg.pages.dev/stargate-light/networks/megaeth.svg",
};

const tempoWithIcon = {
  ...tempo,
  iconUrl: "https://icons.llamao.fi/icons/chains/rsz_tempo",
};

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
    polygonWithRpc,
    linea,
    ink,
    monad,
    plasmaWithIcon,
    worldchain,
    seiWithIcon,
    // etherlinkWithIcon,
    megaethWithIcon,
    tempoWithIcon,
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
