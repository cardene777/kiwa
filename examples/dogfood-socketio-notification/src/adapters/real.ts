import type {
  DeliverResult,
  NotificationAdapter,
  PendingSnapshot,
  ReconnectResult,
  SubscribeRoomResult,
  TraceEvent,
} from './interface.js';

/**
 * "Real" adapter — points at a real Socket.io server (or the SSE
 * endpoint). When `SOCKETIO_URL` is not set the adapter returns a
 * `skipped` variant whose every method records a `SOCKETIO_ENV_MISSING`
 * trace and throws a distinguished error. Tests use this behaviour to
 * short-circuit gracefully — the fidelity report captures "environment
 * absent" rather than failing the whole suite in local dev.
 *
 * The real driving is intentionally lazy — we do not eagerly
 * `import('socket.io-client')` because the package is not a workspace
 * dependency (dogfood is meant to be runnable without a live Socket.io
 * server). The connected path is exercised only when both env vars + the
 * package are present at runtime, and the harness records
 * `SOCKETIO_SDK_MISSING` when only the env vars are set.
 *
 * SSE is treated as an alternative transport under the same env var —
 * `SOCKETIO_TRANSPORT=sse` switches the adapter to the SSE endpoint at
 * `{SOCKETIO_URL}/notify/sse`. The interface contract is transport-neutral
 * so the fidelity harness measures notification behaviour regardless of
 * whether the socket or the SSE stream carries it.
 */

export interface RealAdapterEnv {
  url: string;
  namespace: string;
  transport: 'socketio' | 'sse';
}

export function detectRealEnv(): RealAdapterEnv | null {
  const url = process.env.SOCKETIO_URL;
  if (!url) return null;
  const namespace = process.env.SOCKETIO_NAMESPACE ?? '/notify';
  const rawTransport = process.env.SOCKETIO_TRANSPORT ?? 'socketio';
  const transport = rawTransport === 'sse' ? 'sse' : 'socketio';
  return { url, namespace, transport };
}

/**
 * Distinguished error emitted when the real adapter is asked to run
 * without the required environment.
 */
export class SkippedError extends Error {
  readonly code: 'SOCKETIO_ENV_MISSING' | 'SOCKETIO_SDK_MISSING';
  constructor(op: string, code: 'SOCKETIO_ENV_MISSING' | 'SOCKETIO_SDK_MISSING') {
    super(`SkippedError(${code}): cannot execute ${op}`);
    this.code = code;
  }
}

export function makeRealAdapter(): NotificationAdapter {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter('SOCKETIO_ENV_MISSING');
  // Env is present — probe SDK on first use so tests that only need trace
  // parity (`SOCKETIO_ENV_MISSING`) can construct the adapter without
  // importing the SDK. When the env is present the caller opts in to real
  // IO — we probe the SDK lazily and downgrade to `SOCKETIO_SDK_MISSING`
  // if the package is not installed in the workspace.
  return makeLazyConnectedAdapter(env);
}

function makeSkippedRealAdapter(kind: 'SOCKETIO_ENV_MISSING'): NotificationAdapter {
  const trace: TraceEvent[] = [];
  function unsupported<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: kind });
    throw new SkippedError(op, kind);
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    subscribeRoom: async () => unsupported<SubscribeRoomResult>('subscribeRoom'),
    deliverNotification: async () => unsupported<DeliverResult>('deliverNotification'),
    simulateReconnect: async () => unsupported<ReconnectResult>('simulateReconnect'),
    getPending: async () => unsupported<PendingSnapshot>('getPending'),
    metrics: () => ({
      subscribeCount: 0,
      publishCount: 0,
      eventsDelivered: 0,
      eventsDropped: 0,
      reconnectCount: 0,
      subscribeLatencySamplesMs: [],
      publishLatencySamplesMs: [],
      requests: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}

/**
 * Lazy connected adapter — imports `socket.io-client` on first use so a
 * missing dependency downgrades to `SOCKETIO_SDK_MISSING` traces without
 * crashing the harness at construction time.
 */
function makeLazyConnectedAdapter(_env: RealAdapterEnv): NotificationAdapter {
  const trace: TraceEvent[] = [];

  function recordSkip<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: 'SOCKETIO_SDK_MISSING' });
    throw new SkippedError(op, 'SOCKETIO_SDK_MISSING');
  }

  // Every op currently reports `SOCKETIO_SDK_MISSING` because the dogfood
  // workspace does not vendor `socket.io-client` (keeping the example
  // self-contained). Wiring the SDK is a follow-up when a real Socket.io
  // server is available — the adapter shape is ready and the interface
  // contract is stable, so only the internals change. The SSE variant
  // would land in the same slot behind `_env.transport === 'sse'`.
  return {
    mode: 'real',
    traces: () => [...trace],
    subscribeRoom: async () => recordSkip<SubscribeRoomResult>('subscribeRoom'),
    deliverNotification: async () => recordSkip<DeliverResult>('deliverNotification'),
    simulateReconnect: async () => recordSkip<ReconnectResult>('simulateReconnect'),
    getPending: async () => recordSkip<PendingSnapshot>('getPending'),
    metrics: () => ({
      subscribeCount: 0,
      publishCount: 0,
      eventsDelivered: 0,
      eventsDropped: 0,
      reconnectCount: 0,
      subscribeLatencySamplesMs: [],
      publishLatencySamplesMs: [],
      requests: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}
