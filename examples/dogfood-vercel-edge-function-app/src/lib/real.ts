/**
 * "Real" adapter — targets a real Vercel Edge runtime via the Vercel Edge
 * sandbox (or, when `VERCEL_KEY=1` is set, a `vercel dev` subprocess).
 * When `KIWA_MODE=real` is not set or `VERCEL_KEY` is missing the adapter
 * returns a `skipped` variant whose every method records
 * `KIWA_VERCEL_EDGE_ENV_MISSING` and throws a distinguished error. Tests
 * use this behaviour to short-circuit gracefully — the fidelity report
 * captures "environment absent" rather than failing the whole suite in
 * local dev.
 *
 * The real driving is intentionally lazy — we do not eagerly import the
 * Vercel Edge sandbox or spawn `vercel` because the workspace does not
 * need them for the mock path. When both env gates are satisfied, the
 * connected implementation would spawn a Vercel Edge sandbox with the
 * same middleware + edge route handlers as the mock adapter and mirror
 * the trace shape.
 *
 * v1.24-3 (this Sub-Issue) ships the skip path only — a follow-up
 * milestone hooks a real Vercel Edge sandbox when the caller opts in, so
 * the fidelity harness's env-gate converges on the same 2-line detect
 * logic across all v1.24 dogfoods.
 */

import type {
  GeoPrimaryWriteSnapshot,
  GeoReplicaSyncSnapshot,
  GeoRouteSnapshot,
  KvRangeQuerySnapshot,
  KvReadSnapshot,
  KvWriteSnapshot,
  SseBackpressureSnapshot,
  SseOpenSnapshot,
  TraceEvent,
  VercelEdgeAdapter,
} from './vercel-adapter.js';

const MISSING_ENV_ERROR = 'KIWA_VERCEL_EDGE_ENV_MISSING';

export interface RealAdapterEnv {
  kiwaMode: 'real';
  vercelKey: boolean;
}

/**
 * Detect whether the current process can drive a real Vercel Edge runtime.
 * Returns `null` when at least one env gate fails (skip path); returns
 * the parsed env object when both gates are satisfied.
 *
 * Env gates:
 *  - `KIWA_MODE=real`  — explicit opt-in flag shared across all v1.24
 *    dogfoods so the same test suite can toggle between mock and real
 *    without spawning a Vercel Edge sandbox in CI runs.
 *  - `VERCEL_KEY=1`    — proxy for "vercel is installed + authorized",
 *    used because `vercel dev` in a subprocess is expensive.
 */
export function detectRealEnv(): RealAdapterEnv | null {
  if (process.env['KIWA_MODE'] !== 'real') return null;
  if (process.env['VERCEL_KEY'] !== '1') return null;
  return { kiwaMode: 'real', vercelKey: true };
}

/** Distinguished error emitted when the real adapter runs without env. */
export class SkippedError extends Error {
  readonly code = MISSING_ENV_ERROR;
  constructor(op: string) {
    super(
      `SkippedError: cannot execute ${op} because KIWA_MODE=real + VERCEL_KEY=1 are not both set (real Vercel Edge runtime requires opt-in)`,
    );
  }
}

export function makeRealAdapter(): VercelEdgeAdapter {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter();
  return makeConnectedRealAdapter(env);
}

function makeSkippedRealAdapter(): VercelEdgeAdapter {
  const trace: TraceEvent[] = [];

  function unsupported<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: MISSING_ENV_ERROR });
    throw new SkippedError(op);
  }

  return {
    mode: 'real',
    traces: () => [...trace],
    driveGeoRoute: async () => unsupported<GeoRouteSnapshot>('driveGeoRoute'),
    driveGeoPrimaryWrite: async () =>
      unsupported<GeoPrimaryWriteSnapshot>('driveGeoPrimaryWrite'),
    driveGeoReplicaSync: async () =>
      unsupported<GeoReplicaSyncSnapshot>('driveGeoReplicaSync'),
    driveKvRead: async () => unsupported<KvReadSnapshot>('driveKvRead'),
    driveKvWrite: async () => unsupported<KvWriteSnapshot>('driveKvWrite'),
    driveKvRangeQuery: async () =>
      unsupported<KvRangeQuerySnapshot>('driveKvRangeQuery'),
    driveSseOpen: async () => unsupported<SseOpenSnapshot>('driveSseOpen'),
    driveSseBackpressure: async () =>
      unsupported<SseBackpressureSnapshot>('driveSseBackpressure'),
    metrics: () => ({
      latencySamplesMs: [],
      geoRouteCount: 0,
      geoPrimaryWriteCount: 0,
      geoReplicaSyncCount: 0,
      kvReadCount: 0,
      kvWriteCount: 0,
      kvRangeQueryCount: 0,
      sseOpenCount: 0,
      sseBackpressureCount: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}

function makeConnectedRealAdapter(env: RealAdapterEnv): VercelEdgeAdapter {
  const trace: TraceEvent[] = [];
  const noteEnv: TraceEvent = {
    op: 'connect',
    ok: false,
    errorKind: 'KIWA_VERCEL_EDGE_LIVE_NOT_IMPLEMENTED',
    detail: { kiwaMode: env.kiwaMode, vercelKey: env.vercelKey },
  };
  trace.push(noteEnv);
  function unsupported<T>(op: string): T {
    trace.push({
      op,
      ok: false,
      errorKind: 'KIWA_VERCEL_EDGE_LIVE_NOT_IMPLEMENTED',
      detail: { kiwaMode: env.kiwaMode, vercelKey: env.vercelKey },
    });
    throw new SkippedError(op);
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    driveGeoRoute: async () => unsupported<GeoRouteSnapshot>('driveGeoRoute'),
    driveGeoPrimaryWrite: async () =>
      unsupported<GeoPrimaryWriteSnapshot>('driveGeoPrimaryWrite'),
    driveGeoReplicaSync: async () =>
      unsupported<GeoReplicaSyncSnapshot>('driveGeoReplicaSync'),
    driveKvRead: async () => unsupported<KvReadSnapshot>('driveKvRead'),
    driveKvWrite: async () => unsupported<KvWriteSnapshot>('driveKvWrite'),
    driveKvRangeQuery: async () =>
      unsupported<KvRangeQuerySnapshot>('driveKvRangeQuery'),
    driveSseOpen: async () => unsupported<SseOpenSnapshot>('driveSseOpen'),
    driveSseBackpressure: async () =>
      unsupported<SseBackpressureSnapshot>('driveSseBackpressure'),
    metrics: () => ({
      latencySamplesMs: [],
      geoRouteCount: 0,
      geoPrimaryWriteCount: 0,
      geoReplicaSyncCount: 0,
      kvReadCount: 0,
      kvWriteCount: 0,
      kvRangeQueryCount: 0,
      sseOpenCount: 0,
      sseBackpressureCount: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}
