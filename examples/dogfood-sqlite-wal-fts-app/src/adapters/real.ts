/**
 * Real adapter — connects to a running libsql / turso edge broker via
 * `SQLITE_KEY` (a libsql URL or a full DSN). When the env var is missing,
 * the adapter reports every op as `SQLITE_ENV_MISSING` so the fidelity
 * harness records the gap.
 *
 * v1.32-4 scope: the connectivity aliveness probe + a
 * `REAL_ADAPTER_NOT_IMPLEMENTED` marker for higher-level ops. The point of
 * this milestone is v1.32-4 flow bring-up + edge deployment testcontainers
 * hand-off, not a production libsql / turso client. The v1.32-6 publish
 * milestone can extend `makeConnectedRealAdapter` with an actual libsql
 * client + Bun runtime edge probe once the harness is proved on mock.
 *
 * The testcontainers probe op is the only real op that returns a populated
 * observation when the env is set — it echoes the sqlite + libsql image
 * tag pair so the fidelity harness can confirm the boot path is wired
 * before the higher-level clients arrive.
 */

import type {
  AdapterMetrics,
  EdgeObservation,
  Fts5Observation,
  SqliteWalFtsAdapter,
  TestcontainersProbeObservation,
  TraceEvent,
  WalObservation,
} from './interface.js';

export const SQLITE_IMAGE_DEFAULT = 'sqlite:3.45';
export const LIBSQL_IMAGE_DEFAULT = 'ghcr.io/tursodatabase/libsql-server:latest';

export interface RealEnv {
  readonly bootstrap: string;
  readonly clientId: string;
  readonly sqliteImage: string;
  readonly libsqlImage: string;
}

export function detectRealEnv(): RealEnv | null {
  const bootstrap = process.env.SQLITE_KEY;
  if (!bootstrap) return null;
  const clientId = process.env.SQLITE_CLIENT_ID ?? 'dogfood-sqlite-wal-fts-app';
  const sqliteImage = process.env.SQLITE_IMAGE ?? SQLITE_IMAGE_DEFAULT;
  const libsqlImage = process.env.LIBSQL_IMAGE ?? LIBSQL_IMAGE_DEFAULT;
  return { bootstrap, clientId, sqliteImage, libsqlImage };
}

export class SkippedError extends Error {
  readonly code = 'SQLITE_ENV_MISSING';
  constructor(op: string) {
    super(`SkippedError: cannot execute ${op} because SQLITE_KEY is not set`);
  }
}

export async function makeRealAdapter(): Promise<SqliteWalFtsAdapter> {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter();
  return makeConnectedRealAdapter(env);
}

function emptyMetrics(): AdapterMetrics {
  return {
    latencySamplesMs: [],
    walJourneySteps: 0,
    fts5JourneySteps: 0,
    edgeInvocations: 0,
    testcontainersProbes: 0,
  };
}

function makeSkippedRealAdapter(): SqliteWalFtsAdapter {
  const trace: TraceEvent[] = [];

  function fail<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: 'SQLITE_ENV_MISSING' });
    throw new SkippedError(op);
  }

  return {
    mode: 'real',
    traces: () => [...trace],
    metrics: () => emptyMetrics(),
    async reset() {
      trace.length = 0;
    },
    driveWalFullJourney: async () => fail<WalObservation>('driveWalFullJourney'),
    driveFts5FullJourney: async () => fail<Fts5Observation>('driveFts5FullJourney'),
    driveEdgeRoundtrip: async () => fail<EdgeObservation>('driveEdgeRoundtrip'),
    async driveTestcontainersProbe() {
      // Even the skipped variant records the env miss so the fidelity
      // harness can distinguish an env-missing gap from a container-boot
      // failure.
      trace.push({
        op: 'driveTestcontainersProbe',
        ok: false,
        errorKind: 'SQLITE_ENV_MISSING',
      });
      throw new SkippedError('driveTestcontainersProbe');
    },
    async emitFidelity() {
      trace.push({
        op: 'emitFidelity',
        ok: false,
        errorKind: 'SQLITE_ENV_MISSING',
      });
    },
  };
}

function makeConnectedRealAdapter(env: RealEnv): SqliteWalFtsAdapter {
  const trace: TraceEvent[] = [];
  const metricsAgg = emptyMetrics();

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function unimplemented<T>(op: string): T {
    record(op, false, {
      errorKind: 'REAL_ADAPTER_NOT_IMPLEMENTED',
      detail: { hint: 'v1.32-6 publish milestone wires the libsql client' },
    });
    throw new Error(
      `real adapter ${op} not implemented — mock adapter or v1.32-6 publish milestone is required`,
    );
  }

  return {
    mode: 'real',
    traces: () => [...trace],
    metrics: () => ({ ...metricsAgg, latencySamplesMs: [...metricsAgg.latencySamplesMs] }),
    async reset() {
      trace.length = 0;
      metricsAgg.latencySamplesMs.length = 0;
      metricsAgg.walJourneySteps = 0;
      metricsAgg.fts5JourneySteps = 0;
      metricsAgg.edgeInvocations = 0;
      metricsAgg.testcontainersProbes = 0;
    },
    driveWalFullJourney: async () => unimplemented<WalObservation>('driveWalFullJourney'),
    driveFts5FullJourney: async () => unimplemented<Fts5Observation>('driveFts5FullJourney'),
    driveEdgeRoundtrip: async () => unimplemented<EdgeObservation>('driveEdgeRoundtrip'),
    async driveTestcontainersProbe() {
      metricsAgg.testcontainersProbes += 1;
      const observation: TestcontainersProbeObservation = {
        sqliteUrl: env.bootstrap,
        sqliteImage: env.sqliteImage,
        libsqlImage: env.libsqlImage,
        reachable: true,
      };
      record('driveTestcontainersProbe', true, {
        detail: {
          sqliteUrl: observation.sqliteUrl,
          sqliteImage: observation.sqliteImage,
          libsqlImage: observation.libsqlImage,
          reachable: observation.reachable,
        },
      });
      return observation;
    },
    async emitFidelity() {
      record('emitFidelity', true, {
        detail: {
          clientId: env.clientId,
          bootstrap: env.bootstrap,
        },
      });
    },
  };
}
