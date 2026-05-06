import { RouteData } from "@ensofinance/sdk";
import { Address } from "viem";

export type Token = {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  underlyingTokens?: Token[];
  type?: string;
  apy?: string | number;
  tvl?: string | number;
};

export type WidgetMode = "tokenized" | "nontokenized";

export type NonTokenizedPosition = {
  chainId: number;
  protocol: string;
  address: string;
  positionId: string;
  primaryAddress: string;
  name?: string;
  logosUri?: string;
  underlyingTokens?: Token[];
};

export type NontokenizedRouteData = {
  createdAt: number;
  gas: string;
  amountDeposited: string;
  amountOut?: string;
  priceImpact?: number | null;
  tx: RouteData["tx"];
  route: RouteData["route"];
  feeAmount?: string[];
  ensoFeeAmount?: string[];
  userOp?: unknown;
  bridgingEstimates?: unknown[];
  validUntil?: number;
};

export type SuccessDetails = {
  amountIn: string;
  tokenIn: Token;
  tokenOut?: Token;
  positionOut?: NonTokenizedPosition;
  slippage: number;
  routerData: RouteData | NontokenizedRouteData;
};

export type Placement =
  | "top-start"
  | "top"
  | "top-end"
  | "bottom-start"
  | "bottom"
  | "bottom-end";

export type WidgetState = {
  tokenIn?: Address;
  tokenOut?: Address;
  positionOut?: string;
  outProtocolSlug?: string;
  chainId?: number;
  outChainId?: number;
  outProject?: string;
};

export type ProjectFilter = {
  include: string[];
  exclude: string[];
};

export type WidgetComponentProps = {
  onSuccess?: (hash: string, details?: SuccessDetails) => void;
  adaptive?: boolean;
  mode?: WidgetMode;
  tokenOut?: Address;
  tokenIn?: Address;
  outChainId?: number;
  positionOut?: string;
  outProtocolSlug?: string;
  notificationPlacement?: Placement;
  obligateSelection?: boolean;
  enableShare?: boolean;
  indicateRoute?: boolean;
  rotateObligated?: boolean | ObligatedToken;
  outProject?: string;
  outProjects?: ProjectFilter;
  inProjects?: ProjectFilter;
  onChange?: (newState: WidgetState) => void;
  referralCode?: string;
  fee?: {
    fee: number;
    feeReceiver: Address;
  };
  outTokens?: {
    include: Address[];
    exclude: Address[];
  };
  inTokens?: {
    exclude: Address[];
  };
};

export enum NotifyType {
  Success = "success",
  Error = "error",
  Info = "info",
  Loading = "loading",
  Warning = "warning",
  Blocked = "blocked",
}

export enum ObligatedToken {
  TokenIn,
  TokenOut,
}
