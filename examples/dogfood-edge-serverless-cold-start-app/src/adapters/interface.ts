/**
 * Provider-neutral serverless cold-start observability surface for the
 * dogfood-edge-serverless-cold-start-app.
 *
 * The app talks to the edge function invocation + warm pool + provisioned
 * concurrency stack only through this interface. Two implementations exist —
 *  - {@link makeRealAdapter} — drives a real Cloudflare Workers + Vercel Edge
 *    + AWS Lambda style stack (KIWA_EDGE_FN_URL + KIWA_EDGE_WARM_POOL_URL
 *    + KIWA_EDGE_PROVISIONED_URL) when `KIWA_MODE=real` +
 *    `EDGE_COLD_START_STACK_READY=1` are set; otherwise every op reports
 *    `KIWA_EDGE_COLD_START_ENV_MISSING`.
 *  - {@link makeMockAdapter} — backed by `@kiwa-test/edge` v1.2 advanced
 *    cold-start + middleware-chain + global-routing semantics
 *    (invokeColdStart / preWarmInstance / evictExpired / enterMiddleware /
 *    receiveAnycast / selectByLatency).
 *
 * Both must satisfy the same 12-op contract so behavioural fidelity between
 * real vs mock can be measured side-by-side across 3 axes —
 *  - cold (session start + invoke cold + measure latency + close)
 *  - warm (session start + preWarm + invoke warm + close)
 *  - provisioned (session start + reserve provisioned + invoke provisioned + close)
 */

import type { EdgePlatform as EdgeEdgePlatform } from '@kiwa-test/edge';

/** Edge platform (re-exported from edge semantics). */
export type EdgePlatform = EdgeEdgePlatform;

/** Cold-start classification the harness observes. */
export type ColdStartClass = 'cold' | 'warm' | 'provisioned';

/** Invocation request — instance + timestamp. */
export interface InvokeRequest {
  instanceId: string;
  nowMs: number;
}

/** Warm pool reservation request. */
export interface WarmPoolRequest {
  instanceId: string;
  nowMs: number;
}

/** Provisioned concurrency reservation request. */
export interface ProvisionedRequest {
  instanceIds: string[];
}

/** Latency measurement result — class + observed latency ms. */
export interface LatencyMeasurement {
  cls: ColdStartClass;
  latencyMs: number;
  instanceId: string;
}

/** Session lifecycle context. */
export interface EdgeSession {
  sessionId: string;
  platform: EdgePlatform;
  startedAtMs: number;
}

/** Trace step from any adapter — used by fidelity harness. */
export interface TraceStep {
  op: string;
  outcome: 'success' | 'env-missing' | 'error';
  metadata: Record<string, string | number | boolean>;
}

/** The 12-op adapter contract — 3 axes × 4 ops. */
export interface EdgeColdStartAdapter {
  // cold axis
  startCold: (input: { platform: EdgePlatform }) => Promise<EdgeSession>;
  invokeCold: (input: EdgeSession & InvokeRequest) => Promise<LatencyMeasurement>;
  measureLatencyCold: (input: EdgeSession & { cls: ColdStartClass }) => Promise<number>;
  closeCold: (input: EdgeSession) => Promise<void>;
  // warm axis
  startWarm: (input: { platform: EdgePlatform }) => Promise<EdgeSession>;
  preWarm: (input: EdgeSession & WarmPoolRequest) => Promise<TraceStep>;
  invokeWarm: (input: EdgeSession & InvokeRequest) => Promise<LatencyMeasurement>;
  closeWarm: (input: EdgeSession) => Promise<void>;
  // provisioned axis
  startProvisioned: (input: { platform: EdgePlatform }) => Promise<EdgeSession>;
  reserveProvisioned: (
    input: EdgeSession & ProvisionedRequest,
  ) => Promise<TraceStep>;
  invokeProvisioned: (input: EdgeSession & InvokeRequest) => Promise<LatencyMeasurement>;
  closeProvisioned: (input: EdgeSession) => Promise<void>;
}
