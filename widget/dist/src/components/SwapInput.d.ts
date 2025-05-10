import { Address } from 'viem';
declare const SwapInput: ({ tokenValue, tokenOnChange, inputValue, inputOnChange, usdValue, title, loading, disabled, portalRef, obligatedToken, limitTokens, }: {
    tokenValue: Address;
    tokenOnChange: (value: Address) => void;
    inputValue: string;
    inputOnChange: (value: string) => void;
    title?: string;
    usdValue?: number;
    disabled?: boolean;
    loading?: boolean;
    portalRef?: React.RefObject<HTMLDivElement>;
    obligatedToken?: boolean;
    limitTokens?: Address[];
}) => import("react/jsx-runtime").JSX.Element;
export default SwapInput;
