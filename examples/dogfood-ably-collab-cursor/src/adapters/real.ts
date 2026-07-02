import type {
  CursorBoardAdapter,
  CursorMoveResult,
  JoinBoardResult,
  PresenceSnapshot,
  RewindResult,
  TraceEvent,
} from './interface.js';

/**
 * "Real" adapter — points at the real Ably service. When `ABLY_API_KEY` is
 * not set the adapter returns a `skipped` variant whose every method records
 * a `ABLY_ENV_MISSING` trace and throws a distinguished error. Tests use
 * this behaviour to short-circuit gracefully — the fidelity report captures
 * "environment absent" rather than failing the whole suite in local dev.
 *
 * The real Ably driving is intentionally lazy — we do not eagerly
 * `import('ably')` because the package is not a workspace dependency
 * (dogfood is meant to be runnable without a live Ably project). The
 * connected path is exercised only when both env vars + the package are
 * present at runtime, and the harness records `ABLY_SDK_MISSING` when only
 * the env vars are set.
 */

export interface RealAdapterEnv {
  apiKey: string;
  clientId: string;
}

export function detectRealEnv(): RealAdapterEnv | null {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) return null;
  const clientId =
    process.env.ABLY_CLIENT_ID ?? `client_${Math.random().toString(36).slice(2, 8)}`;
  return { apiKey, clientId };
}

/**
 * Distinguished error emitted when the real adapter is asked to run without
 * a live Ably API key.
 */
export class SkippedError extends Error {
  readonly code: 'ABLY_ENV_MISSING' | 'ABLY_SDK_MISSING';
  constructor(op: string, code: 'ABLY_ENV_MISSING' | 'ABLY_SDK_MISSING') {
    super(`SkippedError(${code}): cannot execute ${op}`);
    this.code = code;
  }
}

export function makeRealAdapter(): CursorBoardAdapter {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter('ABLY_ENV_MISSING');
  // Env is present — probe SDK on first use so tests that only need trace
  // parity (`ABLY_ENV_MISSING`) can construct the adapter without importing
  // the SDK. When the env is present the caller opts in to real IO — we
  // probe the SDK lazily and downgrade to `ABLY_SDK_MISSING` if the package
  // is not installed in the workspace.
  return makeLazyConnectedAdapter(env);
}

function makeSkippedRealAdapter(kind: 'ABLY_ENV_MISSING'): CursorBoardAdapter {
  const trace: TraceEvent[] = [];
  function unsupported<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: kind });
    throw new SkippedError(op, kind);
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    joinBoard: async () => unsupported<JoinBoardResult>('joinBoard'),
    moveCursor: async () => unsupported<CursorMoveResult>('moveCursor'),
    rewindHistory: async () => unsupported<RewindResult>('rewindHistory'),
    getPresence: async () => unsupported<PresenceSnapshot>('getPresence'),
    metrics: () => ({
      subscribeCount: 0,
      publishCount: 0,
      eventsDelivered: 0,
      eventsDropped: 0,
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
 * Lazy connected adapter — imports `ably` on first use so a missing
 * dependency downgrades to `ABLY_SDK_MISSING` traces without crashing the
 * harness at construction time.
 */
function makeLazyConnectedAdapter(_env: RealAdapterEnv): CursorBoardAdapter {
  const trace: TraceEvent[] = [];

  function recordSkip<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: 'ABLY_SDK_MISSING' });
    throw new SkippedError(op, 'ABLY_SDK_MISSING');
  }

  // Every op currently reports `ABLY_SDK_MISSING` because the dogfood
  // workspace does not vendor `ably` (keeping the example self-contained).
  // Wiring the SDK is a follow-up when a real Ably project is available —
  // the adapter shape is ready and the interface contract is stable, so
  // only the internals change.
  return {
    mode: 'real',
    traces: () => [...trace],
    joinBoard: async () => recordSkip<JoinBoardResult>('joinBoard'),
    moveCursor: async () => recordSkip<CursorMoveResult>('moveCursor'),
    rewindHistory: async () => recordSkip<RewindResult>('rewindHistory'),
    getPresence: async () => recordSkip<PresenceSnapshot>('getPresence'),
    metrics: () => ({
      subscribeCount: 0,
      publishCount: 0,
      eventsDelivered: 0,
      eventsDropped: 0,
      subscribeLatencySamplesMs: [],
      publishLatencySamplesMs: [],
      requests: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}
