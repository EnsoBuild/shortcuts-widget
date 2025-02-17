import { Address } from 'viem';
export type WidgetProps = {
    adaptive?: boolean;
    tokenOut?: Address;
    tokenIn?: Address;
    obligateSelection?: boolean;
    enableShare?: boolean;
    indicateRoute?: boolean;
};
export declare enum NotifyType {
    Success = "success",
    Error = "error",
    Info = "info",
    Loading = "loading",
    Warning = "warning",
    Blocked = "blocked"
}
