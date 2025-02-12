import { Address } from 'viem';
import { SupportedChainId } from '../../../../../../../src/constants';
export type Token = {
    address: Address;
    name: string;
    symbol: string;
    decimals: number;
    logoURI: string;
    underlyingTokens?: Token[];
};
export declare const compareCaseInsensitive: (a: string, b: string) => boolean;
export declare const useCurrentChainList: () => any[];
export declare const useOneInchTokenList: () => import('@tanstack/react-query').UseQueryResult<Record<string, Token>, Error>;
export declare const useTokenFromList: (tokenAddress: Address) => any;
export declare const usePriorityChainId: () => number;
export declare const useEtherscanUrl: (address: string, type?: "/address" | "/tx") => string;
export declare const capitalize: (s: string) => string;
export declare const getChainName: (chainId: SupportedChainId) => string;
