/**
 * Real adapter — connects to a running Postgres 16 + pgvector + Redis 7
 * broker via `VECTOR_KEY` (`postgres://` DSN or `host:port`). When the
 * env var is missing, the adapter reports every op as
 * `VECTOR_ENV_MISSING` so the fidelity harness records the gap.
 *
 * Even when `VECTOR_KEY` is set, the v1.26-4 scope only wires the
 * connectivity aliveness probe + a `REAL_ADAPTER_NOT_IMPLEMENTED`
 * marker for higher-level ops. The point of this milestone is fidelity
 * harness bring-up + testcontainers hand-off, not a production Kysely
 * + pgvector migration runner. A future v1.26-6 publish milestone can
 * extend `makeConnectedRealAdapter` with an actual `pg` + Kysely +
 * pgvector-managed IVFFlat / HNSW index build once the harness is
 * proved on mock.
 */

import type {
  AdapterMetrics,
  CacheHitRateObservation,
  HybridSearchObservation,
  IndexBuildObservation,
  SemanticSearchObservation,
  TraceEvent,
  VectorSearchAdapter,
} from './interface.js';

export interface RealEnv {
  readonly bootstrap: string;
  readonly clientId: string;
}

export function detectRealEnv(): RealEnv | null {
  const bootstrap = process.env.VECTOR_KEY;
  if (!bootstrap) return null;
  const clientId = process.env.VECTOR_CLIENT_ID ?? 'dogfood-vector-search-app';
  return { bootstrap, clientId };
}

export class SkippedError extends Error {
  readonly code = 'VECTOR_ENV_MISSING';
  constructor(op: string) {
    super(`SkippedError: cannot execute ${op} because VECTOR_KEY is not set`);
  }
}

export async function makeRealAdapter(): Promise<VectorSearchAdapter> {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter();
  return makeConnectedRealAdapter(env);
}

function emptyMetrics(): AdapterMetrics {
  return {
    latencySamplesMs: [],
    documentsIndexed: 0,
    semanticSearches: 0,
    hybridSearches: 0,
    cacheLookups: 0,
    cacheHits: 0,
  };
}

function makeSkippedRealAdapter(): VectorSearchAdapter {
  const trace: TraceEvent[] = [];

  function fail<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: 'VECTOR_ENV_MISSING' });
    throw new SkippedError(op);
  }

  return {
    mode: 'real',
    traces: () => [...trace],
    driveIndexBuild: async () => fail<IndexBuildObservation>('driveIndexBuild'),
    driveSemanticSearch: async () => fail<SemanticSearchObservation>('driveSemanticSearch'),
    driveHybridSearch: async () => fail<HybridSearchObservation>('driveHybridSearch'),
    driveCacheHitRate: async () => fail<CacheHitRateObservation>('driveCacheHitRate'),
    async emitFidelity() {
      trace.push({ op: 'emitFidelity', ok: false, errorKind: 'VECTOR_ENV_MISSING' });
    },
    metrics: () => emptyMetrics(),
    async reset() {
      trace.length = 0;
    },
  };
}

/**
 * Connected variant — probes the bootstrap string and records a
 * `probe.ok` trace when the string looks valid (`postgres://` /
 * `postgresql://` URL or `host:port`), then reports every higher-level
 * op as `REAL_ADAPTER_NOT_IMPLEMENTED` so the fidelity harness records
 * a well-defined divergence.
 */
function makeConnectedRealAdapter(env: RealEnv): VectorSearchAdapter {
  const trace: TraceEvent[] = [];
  const probeOk = /^(?:postgres(?:ql)?:\/\/|[\w.-]+:\d+)/.test(env.bootstrap);
  trace.push({
    op: 'probe',
    ok: probeOk,
    detail: { bootstrap: env.bootstrap, clientId: env.clientId },
  });

  function notImplemented<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: 'REAL_ADAPTER_NOT_IMPLEMENTED' });
    throw new Error(`${op}: REAL_ADAPTER_NOT_IMPLEMENTED in v1.26-4 scope`);
  }

  const metrics: AdapterMetrics = emptyMetrics();

  return {
    mode: 'real',
    traces: () => [...trace],

    driveIndexBuild: async () => notImplemented<IndexBuildObservation>('driveIndexBuild'),
    driveSemanticSearch: async () =>
      notImplemented<SemanticSearchObservation>('driveSemanticSearch'),
    driveHybridSearch: async () => notImplemented<HybridSearchObservation>('driveHybridSearch'),
    driveCacheHitRate: async () => notImplemented<CacheHitRateObservation>('driveCacheHitRate'),
    async emitFidelity() {
      trace.push({ op: 'emitFidelity', ok: false, errorKind: 'REAL_ADAPTER_NOT_IMPLEMENTED' });
    },
    metrics: () => ({ ...metrics, latencySamplesMs: [...metrics.latencySamplesMs] }),
    async reset() {
      trace.length = 0;
    },
  };
}
