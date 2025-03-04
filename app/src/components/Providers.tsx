import {
  RainbowKitProvider,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
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
} from "viem/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig } from "wagmi";
import { binanceWallet } from "@rainbow-me/rainbowkit/wallets";

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

const connectors = connectorsForWallets(
  [
    {
      groupName: "wallets:",
      wallets: [binanceWallet],
    },
  ],
  {
    appName: "My RainbowKit App",
    projectId: "YOUR_PROJECT_ID",
  },
);

// @ts-expect-error no transport
const config = createConfig({
  multiInjectedProviderDiscovery: false,
  connectors,
  chains: [
    bsc,
    mainnet,
    base,
    arbitrum,
    berachainWithIcon,
    sonicWithIcon,
    zksync,
    optimism,
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
