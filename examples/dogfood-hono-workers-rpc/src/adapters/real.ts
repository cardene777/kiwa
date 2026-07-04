import type {
  D1Observation,
  ExecutionCtxObservation,
  HonoAdapter,
  HonoMethod,
  KvObservation,
  R2Observation,
  RouteSnapshot,
  RpcSnapshot,
  TraceEvent,
} from './interface.js';

/**
 * "Real" adapter — targets a real Cloudflare Workers runtime via
 * `miniflare` (or, in a follow-up, `wrangler dev` in a subprocess). When
 * `CF_ACCOUNT_ID` is not set to `1` the adapter returns a `skipped` variant
 * whose every method records a `HONO_REAL_ENV_MISSING` trace and throws a
 * distinguished error. Tests use this behaviour to short-circuit gracefully
 * — the fidelity report captures "environment absent" rather than failing
 * the whole suite in local dev.
 *
 * The real driving is intentionally lazy — we do not eagerly import
 * `miniflare` or `wrangler` because the workspace does not need them for
 * the mock path. When `CF_ACCOUNT_ID=1` is set the connected implementation
 * would spawn miniflare, mount the same routes / middleware chain as the
 * mock adapter, and mirror the trace shape.
 *
 * The v0.1 dogfood ships the skip path only — a follow-up "live" perf
 * harness spec exists to hook a real miniflare runtime when the caller
 * opts in, so the perf and fidelity paths converge on the same env-detect
 * logic.
 */

export interface RealAdapterEnv {
  cfAccountId: boolean;
}

const DEFAULT_CF_ENV = 'CF_ACCOUNT_ID';

export function detectRealEnv(): RealAdapterEnv | null {
  const raw = process.env[DEFAULT_CF_ENV];
  if (!raw || raw !== '1') return null;
  return { cfAccountId: true };
}

/** Distinguished error emitted when real adapter runs without env. */
export class SkippedError extends Error {
  readonly code = 'HONO_REAL_ENV_MISSING';
  constructor(op: string) {
    super(
      `SkippedError: cannot execute ${op} because CF_ACCOUNT_ID=1 is not set (real Cloudflare Workers runtime requires opt-in)`,
    );
  }
}

export function makeRealAdapter(): HonoAdapter {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter();
  return makeConnectedRealAdapter(env);
}

function makeSkippedRealAdapter(): HonoAdapter {
  const trace: TraceEvent[] = [];
  function unsupported<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: 'HONO_REAL_ENV_MISSING' });
    throw new SkippedError(op);
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    driveRoute: async (_method: HonoMethod, _path: string) =>
      unsupported<RouteSnapshot>('driveRoute'),
    driveRpc: async (_method: HonoMethod, _path: string) =>
      unsupported<RpcSnapshot>('driveRpc'),
    driveKv: async () => unsupported<KvObservation>('driveKv'),
    driveD1: async () => unsupported<D1Observation>('driveD1'),
    driveR2: async () => unsupported<R2Observation>('driveR2'),
    driveExecutionCtx: async () =>
      unsupported<ExecutionCtxObservation>('driveExecutionCtx'),
    metrics: () => ({
      latencySamplesMs: [],
      routeInvokeCount: 0,
      rpcInvokeCount: 0,
      kvOpCount: 0,
      d1OpCount: 0,
      r2OpCount: 0,
      execCtxCount: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}

function makeConnectedRealAdapter(env: RealAdapterEnv): HonoAdapter {
  const trace: TraceEvent[] = [];
  const noteEnv: TraceEvent = {
    op: 'connect',
    ok: false,
    errorKind: 'HONO_LIVE_NOT_IMPLEMENTED',
    detail: { cfAccountId: env.cfAccountId },
  };
  trace.push(noteEnv);
  function unsupported<T>(op: string): T {
    trace.push({
      op,
      ok: false,
      errorKind: 'HONO_LIVE_NOT_IMPLEMENTED',
      detail: { cfAccountId: env.cfAccountId },
    });
    throw new SkippedError(op);
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    driveRoute: async (_method: HonoMethod, _path: string) =>
      unsupported<RouteSnapshot>('driveRoute'),
    driveRpc: async (_method: HonoMethod, _path: string) =>
      unsupported<RpcSnapshot>('driveRpc'),
    driveKv: async () => unsupported<KvObservation>('driveKv'),
    driveD1: async () => unsupported<D1Observation>('driveD1'),
    driveR2: async () => unsupported<R2Observation>('driveR2'),
    driveExecutionCtx: async () =>
      unsupported<ExecutionCtxObservation>('driveExecutionCtx'),
    metrics: () => ({
      latencySamplesMs: [],
      routeInvokeCount: 0,
      rpcInvokeCount: 0,
      kvOpCount: 0,
      d1OpCount: 0,
      r2OpCount: 0,
      execCtxCount: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}
