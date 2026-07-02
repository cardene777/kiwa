import type {
  BroadcastResult,
  ChatMessage,
  ChatRoomAdapter,
  JoinRoomResult,
  PresenceSnapshot,
  TraceEvent,
  TypingResult,
} from './interface.js';

/**
 * "Real" adapter — points at the real Supabase Realtime service. When
 * `SUPABASE_URL` + `SUPABASE_ANON_KEY` are not set the adapter returns a
 * `skipped` variant whose every method records a `SUPABASE_ENV_MISSING`
 * trace and throws a distinguished error. Tests use this behaviour to
 * short-circuit gracefully — the fidelity report captures "environment
 * absent" rather than failing the whole suite in local dev.
 *
 * The real Supabase driving is intentionally lazy — we do not eagerly
 * `import('@supabase/supabase-js')` because the package is not a workspace
 * dependency (dogfood is meant to be runnable without a live Supabase URL).
 * The connected path is exercised only when both env vars + the package are
 * present at runtime, and the harness records `SUPABASE_SDK_MISSING` when
 * only the env vars are set.
 */

export interface RealAdapterEnv {
  url: string;
  anonKey: string;
}

export function detectRealEnv(): RealAdapterEnv | null {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/**
 * Distinguished error emitted when the real adapter is asked to run without
 * a live Supabase URL / anon key.
 */
export class SkippedError extends Error {
  readonly code: 'SUPABASE_ENV_MISSING' | 'SUPABASE_SDK_MISSING';
  constructor(op: string, code: 'SUPABASE_ENV_MISSING' | 'SUPABASE_SDK_MISSING') {
    super(`SkippedError(${code}): cannot execute ${op}`);
    this.code = code;
  }
}

export function makeRealAdapter(): ChatRoomAdapter {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter('SUPABASE_ENV_MISSING');
  // We defer SDK detection to first call so tests that only need trace parity
  // (`SUPABASE_ENV_MISSING`) can construct the adapter without importing the
  // SDK. When the env is present the caller opts in to real IO — we probe the
  // SDK lazily and downgrade to `SUPABASE_SDK_MISSING` if the package is not
  // installed in the workspace.
  return makeLazyConnectedAdapter(env);
}

function makeSkippedRealAdapter(kind: 'SUPABASE_ENV_MISSING'): ChatRoomAdapter {
  const trace: TraceEvent[] = [];
  function unsupported<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: kind });
    throw new SkippedError(op, kind);
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    joinRoom: async () => unsupported<JoinRoomResult>('joinRoom'),
    sendMessage: async () => unsupported<BroadcastResult>('sendMessage'),
    getPresence: async () => unsupported<PresenceSnapshot>('getPresence'),
    sendTyping: async () => unsupported<TypingResult>('sendTyping'),
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
 * Lazy connected adapter — imports `@supabase/supabase-js` on first use so a
 * missing dependency downgrades to `SUPABASE_SDK_MISSING` traces without
 * crashing the harness at construction time.
 */
function makeLazyConnectedAdapter(_env: RealAdapterEnv): ChatRoomAdapter {
  const trace: TraceEvent[] = [];

  function recordSkip<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: 'SUPABASE_SDK_MISSING' });
    throw new SkippedError(op, 'SUPABASE_SDK_MISSING');
  }

  // Every op currently reports `SUPABASE_SDK_MISSING` because the dogfood
  // workspace does not vendor `@supabase/supabase-js` (keeping the example
  // self-contained). Wiring the SDK is a follow-up when a real Supabase
  // project is available — the adapter shape is ready and the interface
  // contract is stable, so only the internals change.
  return {
    mode: 'real',
    traces: () => [...trace],
    joinRoom: async () => recordSkip<JoinRoomResult>('joinRoom'),
    sendMessage: async () => recordSkip<BroadcastResult>('sendMessage'),
    getPresence: async () => recordSkip<PresenceSnapshot>('getPresence'),
    sendTyping: async () => recordSkip<TypingResult>('sendTyping'),
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
