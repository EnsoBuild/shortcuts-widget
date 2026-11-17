import posthog from "posthog-js";

// One W3C trace id per swap flow (a quote, its approval, the submission and its bridge
// status), so every Enso API call in the flow joins up under it. New route inputs start a
// new flow.

const MAX_TRACKED_TXS = 50;
// a tab left open keeps polling the same inputs; start a new trace after this long
export const FLOW_TRACE_MAX_AGE_MS = 10 * 60 * 1000;

const randomHex = (bytes: number) =>
  Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (value) =>
    value.toString(16).padStart(2, "0")
  ).join("");

const randomNonZeroHex = (bytes: number) => {
  const zero = "0".repeat(bytes * 2);
  let value = randomHex(bytes);
  while (value === zero) value = randomHex(bytes);
  return value;
};

export const newTraceId = () => randomNonZeroHex(16);

// a fresh span id per call, sampled
export const toTraceparent = (traceId: string) =>
  `00-${traceId}-${randomNonZeroHex(8)}-01`;

let flowTraceId: string | undefined;
// bridge status checks belong to the flow that submitted the tx, not the current one
const txTraceIds = new Map<string, string>();

// PostHog is session-scoped here: the widget runs inside third-party pages
export const registerFlowTraceForSession = () => {
  if (!flowTraceId || !posthog.__loaded) return;
  try {
    posthog.register_for_session({ enso_trace_id: flowTraceId });
  } catch {
    // analytics must never break the widget
  }
};

export const activateFlowTrace = (traceId: string) => {
  if (traceId === flowTraceId) return;
  flowTraceId = traceId;
  registerFlowTraceForSession();
};

export const rememberTxTrace = (hash: string, traceId: string) => {
  txTraceIds.set(hash.toLowerCase(), traceId);
  const oldest = txTraceIds.keys().next().value;
  if (txTraceIds.size > MAX_TRACKED_TXS && oldest !== undefined)
    txTraceIds.delete(oldest);
};

// A route quote with the trace it was fetched under. The query caches this pair, so a quote
// served from the cache (or kept after a failed refetch) still names its own trace.
export type TracedRoute<T> = { route: T; traceId: string };

export const fetchTracedRoute = async <P, T>(
  params: P,
  traceId: string,
  fetchRoute: (params: P) => Promise<T>
): Promise<TracedRoute<T>> => {
  // the query can fire before the effect that activates the flow
  activateFlowTrace(traceId);
  return { route: await fetchRoute(params), traceId };
};

const FLOW_ENDPOINTS = new Set(["/shortcuts/route", "/wallet/approve"]);

// The trace id for an SDK request: the active flow for quotes and approvals, the submitting
// flow for bridge status. Other calls (balances, prices, tokens) start their own trace.
export const traceIdForRequest = (
  url: string | undefined,
  params: unknown
): string | undefined => {
  if (!url) return undefined;
  if (FLOW_ENDPOINTS.has(url)) return flowTraceId;
  if (url.endsWith("/bridge/check")) {
    const txHash = (params as { txHash?: unknown } | undefined)?.txHash;
    return typeof txHash === "string"
      ? txTraceIds.get(txHash.toLowerCase())
      : undefined;
  }
  return undefined;
};
