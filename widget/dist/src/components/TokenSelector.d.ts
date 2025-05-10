import { Address } from 'viem';
declare const TokenSelector: ({ value, onChange, portalRef, obligatedToken, limitTokens, }: {
    value: Address;
    onChange: (value: string) => void;
    portalRef?: React.RefObject<HTMLDivElement>;
    obligatedToken?: boolean;
    limitTokens?: Address[];
}) => import("react/jsx-runtime").JSX.Element;
export default TokenSelector;
