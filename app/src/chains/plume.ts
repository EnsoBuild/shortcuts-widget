import { Chain } from 'viem';

export const plume = {
  id: 98866,
  name: 'Plume',
  nativeCurrency: {
    decimals: 18,
    name: 'Plume',
    symbol: 'PLUME',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.plume.org/'],
      webSocket: ['wss://rpc.plume.org'],
    },
    public: {
      http: ['https://rpc.plume.org/'],
      webSocket: ['wss://rpc.plume.org'],
    },
  },
  blockExplorers: {
    default: { name: 'Plume Explorer', url: 'https://explorer.plume.org' },
  },
} as const satisfies Chain;
