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
  sonic
} from "viem/chains";
import { plume } from "../chains/plume";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import React from "react";

const berachainWithIcon = {
  ...berachain,
  iconUrl:
    "https://assets.coingecko.com/coins/images/25235/large/BERA.png?1738822008",
};
const sonicWithIcon = {
  ...sonic,
  iconUrl:
    "https://assets.coingecko.com/coins/images/38108/standard/200x200_Sonic_Logo.png",
};
const plumeWithIcon= {
  ...plume,
  iconUrl:
    "https://assets.coingecko.com/coins/images/53623/standard/plume-token.png?1736896935",
};

const config = getDefaultConfig({
  appName: "Enso-widget",
  projectId: import.meta.env.VITE_RAINBOWKIT_PROJECT_ID ?? "",
  chains: [
    mainnet,
    base,
    arbitrum,
    berachainWithIcon,
    sonicWithIcon,
    plumeWithIcon,
    zksync,
    optimism,
    bsc,
    avalanche,
    gnosis,
    polygon,
    linea,
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
