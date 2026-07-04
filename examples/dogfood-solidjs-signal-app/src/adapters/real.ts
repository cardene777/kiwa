import type {
  ResourceTransition,
  SolidAdapter,
  SuspenseObservation,
  RenderSnapshot,
  TraceEvent,
} from './interface.js';

/**
 * "Real" adapter — targets a real `solid-js` runtime via
 * `solid-testing-library`. When `SOLID_LIVE` is not set to `1` the adapter
 * returns a `skipped` variant whose every method records a
 * `SOLID_REAL_ENV_MISSING` trace and throws a distinguished error. Tests
 * use this behaviour to short-circuit gracefully — the fidelity report
 * captures "environment absent" rather than failing the whole suite in
 * local dev.
 *
 * The real driving is intentionally lazy — we do not eagerly install
 * `solid-js` (or `solid-testing-library`) because the workspace does not
 * need a live JSX runtime for the mock path. When `SOLID_LIVE=1` is set
 * the connected implementation would import `solid-js` at call time,
 * mount the components inside `createRoot`, and mirror the trace shape.
 *
 * The v0.1 dogfood ships the skip path only — a follow-up "live" perf
 * harness spec exists to hook a real `solid-testing-library` runtime when
 * the caller opts in, so the perf and fidelity paths converge on the same
 * env-detect logic.
 */

export interface RealAdapterEnv {
  solidLive: boolean;
}

const DEFAULT_SOLID_LIVE_ENV = 'SOLID_LIVE';

export function detectRealEnv(): RealAdapterEnv | null {
  const raw = process.env[DEFAULT_SOLID_LIVE_ENV];
  if (!raw || raw !== '1') return null;
  return { solidLive: true };
}

/** Distinguished error emitted when real adapter runs without env. */
export class SkippedError extends Error {
  readonly code = 'SOLID_REAL_ENV_MISSING';
  constructor(op: string) {
    super(
      `SkippedError: cannot execute ${op} because SOLID_LIVE=1 is not set (real Solid runtime requires opt-in)`,
    );
  }
}

export function makeRealAdapter(): SolidAdapter {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter();
  return makeConnectedRealAdapter(env);
}

function makeSkippedRealAdapter(): SolidAdapter {
  const trace: TraceEvent[] = [];
  function unsupported<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: 'SOLID_REAL_ENV_MISSING' });
    throw new SkippedError(op);
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    mountCounter: async () =>
      unsupported<{ snapshot: RenderSnapshot; effect: { runCount: number; values: unknown[] } }>('mountCounter'),
    driveCounter: async () =>
      unsupported<{ snapshot: RenderSnapshot; effect: { runCount: number; values: unknown[] } }>('driveCounter'),
    mountTodos: async () => unsupported<RenderSnapshot>('mountTodos'),
    driveTodos: async () =>
      unsupported<{ snapshot: RenderSnapshot; effect: { runCount: number; values: unknown[] } }>('driveTodos'),
    mountResource: async () =>
      unsupported<{ transitions: ResourceTransition[]; finalMarkup: string }>('mountResource'),
    driveSuspense: async () => unsupported<SuspenseObservation>('driveSuspense'),
    metrics: () => ({
      latencySamplesMs: [],
      counterMountCount: 0,
      todosMountCount: 0,
      resourceMountCount: 0,
      suspenseMountCount: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}

function makeConnectedRealAdapter(env: RealAdapterEnv): SolidAdapter {
  const trace: TraceEvent[] = [];
  const noteEnv: TraceEvent = {
    op: 'connect',
    ok: false,
    errorKind: 'SOLID_LIVE_NOT_IMPLEMENTED',
    detail: { solidLive: env.solidLive },
  };
  trace.push(noteEnv);
  function unsupported<T>(op: string): T {
    trace.push({
      op,
      ok: false,
      errorKind: 'SOLID_LIVE_NOT_IMPLEMENTED',
      detail: { solidLive: env.solidLive },
    });
    throw new SkippedError(op);
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    mountCounter: async () =>
      unsupported<{ snapshot: RenderSnapshot; effect: { runCount: number; values: unknown[] } }>('mountCounter'),
    driveCounter: async () =>
      unsupported<{ snapshot: RenderSnapshot; effect: { runCount: number; values: unknown[] } }>('driveCounter'),
    mountTodos: async () => unsupported<RenderSnapshot>('mountTodos'),
    driveTodos: async () =>
      unsupported<{ snapshot: RenderSnapshot; effect: { runCount: number; values: unknown[] } }>('driveTodos'),
    mountResource: async () =>
      unsupported<{ transitions: ResourceTransition[]; finalMarkup: string }>('mountResource'),
    driveSuspense: async () => unsupported<SuspenseObservation>('driveSuspense'),
    metrics: () => ({
      latencySamplesMs: [],
      counterMountCount: 0,
      todosMountCount: 0,
      resourceMountCount: 0,
      suspenseMountCount: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}
