/**
 * "Real" adapter — targets a real Deno Deploy runtime via the Deno Deploy
 * sandbox (or, when `DENO_DEPLOY_KEY=1` is set, a `deno task dev`
 * subprocess). When `KIWA_MODE=real` is not set or `DENO_DEPLOY_KEY` is
 * missing the adapter returns a `skipped` variant whose every method
 * records `KIWA_DENO_DEPLOY_ENV_MISSING` and throws a distinguished error.
 * Tests use this behaviour to short-circuit gracefully — the fidelity
 * report captures "environment absent" rather than failing the whole
 * suite in local dev.
 *
 * The real driving is intentionally lazy — we do not eagerly import the
 * Deno Deploy sandbox or spawn `deno` because the workspace does not
 * need them for the mock path. When both env gates are satisfied, the
 * connected implementation would spawn a Deno Deploy sandbox with the
 * same Fresh handlers as the mock adapter and mirror the trace shape.
 *
 * v1.24-4 (this Sub-Issue) ships the skip path only — a follow-up
 * milestone hooks a real Deno Deploy sandbox when the caller opts in, so
 * the fidelity harness's env-gate converges on the same 2-line detect
 * logic across all v1.24 dogfoods.
 */

import type {
  CronCompletionSnapshot,
  CronFailureSnapshot,
  CronScheduleSnapshot,
  DenoDeployAdapter,
  GeoPrimaryWriteSnapshot,
  GeoReplicaSyncSnapshot,
  GeoRouteSnapshot,
  KvRangeQuerySnapshot,
  KvWriteSnapshot,
  ReadYourWritesSnapshot,
  TraceEvent,
} from './deno-adapter.js';

const MISSING_ENV_ERROR = 'KIWA_DENO_DEPLOY_ENV_MISSING';

export interface RealAdapterEnv {
  kiwaMode: 'real';
  denoDeployKey: boolean;
}

/**
 * Detect whether the current process can drive a real Deno Deploy runtime.
 * Returns `null` when at least one env gate fails (skip path); returns
 * the parsed env object when both gates are satisfied.
 *
 * Env gates:
 *  - `KIWA_MODE=real`         — explicit opt-in flag shared across all
 *    v1.24 dogfoods so the same test suite can toggle between mock and
 *    real without spawning a Deno Deploy sandbox in CI runs.
 *  - `DENO_DEPLOY_KEY=1`      — proxy for "deno is installed + a Deno
 *    Deploy access token is available", used because `deno task dev` in
 *    a subprocess plus the Deno Deploy sandbox is expensive to spin up
 *    for every run.
 */
export function detectRealEnv(): RealAdapterEnv | null {
  if (process.env['KIWA_MODE'] !== 'real') return null;
  if (process.env['DENO_DEPLOY_KEY'] !== '1') return null;
  return { kiwaMode: 'real', denoDeployKey: true };
}

/** Distinguished error emitted when the real adapter runs without env. */
export class SkippedError extends Error {
  readonly code = MISSING_ENV_ERROR;
  constructor(op: string) {
    super(
      `SkippedError: cannot execute ${op} because KIWA_MODE=real + DENO_DEPLOY_KEY=1 are not both set (real Deno Deploy runtime requires opt-in)`,
    );
  }
}

export function makeRealAdapter(): DenoDeployAdapter {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter();
  return makeConnectedRealAdapter(env);
}

function makeSkippedRealAdapter(): DenoDeployAdapter {
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
    driveKvWrite: async () => unsupported<KvWriteSnapshot>('driveKvWrite'),
    driveKvRangeQuery: async () =>
      unsupported<KvRangeQuerySnapshot>('driveKvRangeQuery'),
    driveReadYourWrites: async () =>
      unsupported<ReadYourWritesSnapshot>('driveReadYourWrites'),
    driveCronSchedule: async () =>
      unsupported<CronScheduleSnapshot>('driveCronSchedule'),
    driveCronComplete: async () =>
      unsupported<CronCompletionSnapshot | CronFailureSnapshot>('driveCronComplete'),
    metrics: () => ({
      latencySamplesMs: [],
      geoRouteCount: 0,
      geoPrimaryWriteCount: 0,
      geoReplicaSyncCount: 0,
      kvWriteCount: 0,
      kvRangeQueryCount: 0,
      readYourWritesCount: 0,
      cronScheduleCount: 0,
      cronCompleteCount: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}

function makeConnectedRealAdapter(env: RealAdapterEnv): DenoDeployAdapter {
  const trace: TraceEvent[] = [];
  const noteEnv: TraceEvent = {
    op: 'connect',
    ok: false,
    errorKind: 'KIWA_DENO_DEPLOY_LIVE_NOT_IMPLEMENTED',
    detail: { kiwaMode: env.kiwaMode, denoDeployKey: env.denoDeployKey },
  };
  trace.push(noteEnv);
  function unsupported<T>(op: string): T {
    trace.push({
      op,
      ok: false,
      errorKind: 'KIWA_DENO_DEPLOY_LIVE_NOT_IMPLEMENTED',
      detail: { kiwaMode: env.kiwaMode, denoDeployKey: env.denoDeployKey },
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
    driveKvWrite: async () => unsupported<KvWriteSnapshot>('driveKvWrite'),
    driveKvRangeQuery: async () =>
      unsupported<KvRangeQuerySnapshot>('driveKvRangeQuery'),
    driveReadYourWrites: async () =>
      unsupported<ReadYourWritesSnapshot>('driveReadYourWrites'),
    driveCronSchedule: async () =>
      unsupported<CronScheduleSnapshot>('driveCronSchedule'),
    driveCronComplete: async () =>
      unsupported<CronCompletionSnapshot | CronFailureSnapshot>('driveCronComplete'),
    metrics: () => ({
      latencySamplesMs: [],
      geoRouteCount: 0,
      geoPrimaryWriteCount: 0,
      geoReplicaSyncCount: 0,
      kvWriteCount: 0,
      kvRangeQueryCount: 0,
      readYourWritesCount: 0,
      cronScheduleCount: 0,
      cronCompleteCount: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}
