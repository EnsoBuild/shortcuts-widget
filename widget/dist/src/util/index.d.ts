import { Address } from 'viem';
export declare const denormalizeValue: (value: string, decimals?: number) => string;
export declare const normalizeValue: (value?: bigint | string, decimals?: number) => string;
export declare const compareCaseInsensitive: (a: string, b: string) => boolean;
export declare const shortenAddress: (address: Address) => string;
export declare const formatNumber: (value: number | string, precise?: boolean) => string;
export declare const formatUSD: (value: number | string) => string;
