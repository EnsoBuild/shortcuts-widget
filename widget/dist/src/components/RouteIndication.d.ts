import { RouteData } from '@ensofinance/sdk';
type RouteSegment = RouteData["route"][0];
declare const RouteSegment: ({ step }: {
    step: RouteSegment;
}) => import("react/jsx-runtime").JSX.Element;
declare const RouteIndication: ({ route, loading, }: {
    route?: RouteSegment[];
    loading?: boolean;
}) => import("react/jsx-runtime").JSX.Element;
export default RouteIndication;
