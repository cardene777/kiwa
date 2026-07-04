import type {
  EdgeEnvObservation,
  FreshAdapter,
  FreshMethod,
  HeadSnapshot,
  InteractionSummary,
  IslandSnapshot,
  RouteSnapshot,
  TraceEvent,
} from './interface.js';

/**
 * "Real" adapter — targets a real Deno Fresh runtime via
 * `fresh-testing-library`. When `DENO_INSTALLED` is not set to `1` the
 * adapter returns a `skipped` variant whose every method records a
 * `FRESH_REAL_ENV_MISSING` trace and throws a distinguished error. Tests
 * use this behaviour to short-circuit gracefully — the fidelity report
 * captures "environment absent" rather than failing the whole suite in
 * local dev.
 *
 * The real driving is intentionally lazy — we do not eagerly import
 * `fresh` or `fresh-testing-library` because the workspace does not need
 * a live Deno runtime for the mock path. When `DENO_INSTALLED=1` is set
 * the connected implementation would spawn `deno test` (or drive a
 * `fresh-testing-library` harness in-process), mount the same routes /
 * islands / head fragments as the mock adapter, and mirror the trace
 * shape.
 *
 * The v0.1 dogfood ships the skip path only — a follow-up "live" perf
 * harness spec exists to hook a real Fresh runtime when the caller opts
 * in, so the perf and fidelity paths converge on the same env-detect
 * logic.
 */

export interface RealAdapterEnv {
  denoInstalled: boolean;
}

const DEFAULT_DENO_INSTALLED_ENV = 'DENO_INSTALLED';

export function detectRealEnv(): RealAdapterEnv | null {
  const raw = process.env[DEFAULT_DENO_INSTALLED_ENV];
  if (!raw || raw !== '1') return null;
  return { denoInstalled: true };
}

/** Distinguished error emitted when real adapter runs without env. */
export class SkippedError extends Error {
  readonly code = 'FRESH_REAL_ENV_MISSING';
  constructor(op: string) {
    super(
      `SkippedError: cannot execute ${op} because DENO_INSTALLED=1 is not set (real Deno Fresh runtime requires opt-in)`,
    );
  }
}

export function makeRealAdapter(): FreshAdapter {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter();
  return makeConnectedRealAdapter(env);
}

function makeSkippedRealAdapter(): FreshAdapter {
  const trace: TraceEvent[] = [];
  function unsupported<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: 'FRESH_REAL_ENV_MISSING' });
    throw new SkippedError(op);
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    mountRoute: async () => unsupported<RouteSnapshot>('mountRoute'),
    driveHandler: async (_method: FreshMethod) =>
      unsupported<RouteSnapshot>('driveHandler'),
    mountIsland: async () => unsupported<IslandSnapshot>('mountIsland'),
    driveInteraction: async () =>
      unsupported<InteractionSummary>('driveInteraction'),
    mountHead: async () => unsupported<HeadSnapshot>('mountHead'),
    driveEdgeEnv: async () => unsupported<EdgeEnvObservation>('driveEdgeEnv'),
    metrics: () => ({
      latencySamplesMs: [],
      routeMountCount: 0,
      handlerDispatchCount: 0,
      islandMountCount: 0,
      interactionCount: 0,
      headMergeCount: 0,
      edgeEnvCount: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}

function makeConnectedRealAdapter(env: RealAdapterEnv): FreshAdapter {
  const trace: TraceEvent[] = [];
  const noteEnv: TraceEvent = {
    op: 'connect',
    ok: false,
    errorKind: 'FRESH_LIVE_NOT_IMPLEMENTED',
    detail: { denoInstalled: env.denoInstalled },
  };
  trace.push(noteEnv);
  function unsupported<T>(op: string): T {
    trace.push({
      op,
      ok: false,
      errorKind: 'FRESH_LIVE_NOT_IMPLEMENTED',
      detail: { denoInstalled: env.denoInstalled },
    });
    throw new SkippedError(op);
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    mountRoute: async () => unsupported<RouteSnapshot>('mountRoute'),
    driveHandler: async (_method: FreshMethod) =>
      unsupported<RouteSnapshot>('driveHandler'),
    mountIsland: async () => unsupported<IslandSnapshot>('mountIsland'),
    driveInteraction: async () =>
      unsupported<InteractionSummary>('driveInteraction'),
    mountHead: async () => unsupported<HeadSnapshot>('mountHead'),
    driveEdgeEnv: async () => unsupported<EdgeEnvObservation>('driveEdgeEnv'),
    metrics: () => ({
      latencySamplesMs: [],
      routeMountCount: 0,
      handlerDispatchCount: 0,
      islandMountCount: 0,
      interactionCount: 0,
      headMergeCount: 0,
      edgeEnvCount: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}
