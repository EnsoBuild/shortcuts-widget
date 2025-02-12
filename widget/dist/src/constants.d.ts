import { Address } from 'viem';
import { Token } from '../../../../../../src/util/common';
export declare const ETH_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
export declare const ETH_TOKEN: Token;
export declare const BNB_TOKEN: Token;
export declare const AVAX_TOKEN: Token;
export declare const MATIC_TOKEN: Token;
export declare enum SupportedChainId {
    MAINNET = 1,
    ARBITRUM_ONE = 42161,
    OPTIMISM = 10,
    POLYGON = 137,
    BSC = 56,
    BASE = 8453,
    LINEA = 59144,
    ZKSYNC = 324,
    GNOSIS = 100,
    AVALANCHE = 43114,
    BERACHAIN = 80094
}
export declare const GECKO_CHAIN_NAMES: {
    [key in SupportedChainId]: string;
};
export declare const MOCK_IMAGE_URL = "https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png";
export declare const CHAINS_ETHERSCAN: Record<SupportedChainId, string>;
export declare const USDC_ADDRESS: Record<SupportedChainId, Address>;
export declare const NATIVE_ETH_CHAINS: SupportedChainId[];
export declare const CHAINS_NATIVE_TOKENS: Record<SupportedChainId, Token>;
export declare const SWAP_LIMITS: Record<Address, number>;
export declare const SWAP_REDIRECT_TOKENS: Address[];
export declare const LP_REDIRECT_TOKENS: Record<Address, string>;
export declare const ONEINCH_ONLY_TOKENS: string[];
export declare const PRICE_IMPACT_WARN_THRESHOLD = 100;
export declare const DEFAULT_SLIPPAGE = 25;
export declare const MAINNET_ZAP_INPUT_TOKENS: Address[];
