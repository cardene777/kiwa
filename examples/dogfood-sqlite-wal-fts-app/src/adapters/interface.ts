/**
 * Provider-neutral SQLite WAL + FTS5 + edge-deployment adapter contract for
 * the dogfood-sqlite-wal-fts-app dogfood (v1.32-4).
 *
 * The dogfood talks to the SQLite-backed notebook only through this
 * interface. Two implementations exist: {@link makeMockAdapter} (backed by
 * `@kiwa-test/orm`'s v0.10 SQLite WAL + FTS5 semantics) and
 * {@link makeRealAdapter} (probes a libsql / turso edge broker via
 * `SQLITE_KEY` when set, else returns a skipped variant whose every method
 * records a `SQLITE_ENV_MISSING` trace).
 *
 * Ops:
 *   - `driveWalFullJourney`        — SQLite WAL 5-state walk: journal-mode
 *                                    switch, size-threshold cross, WAL
 *                                    checkpoint, shared-memory map. Reports
 *                                    the final journal mode, checkpoint
 *                                    count, and shared-memory region size.
 *   - `driveFts5FullJourney`       — FTS5 5-state walk: virtual-table
 *                                    create, tokenize document, match
 *                                    query, vocab inspect. Reports the
 *                                    tokenizer, token count, and match
 *                                    rank score.
 *   - `driveEdgeRoundtrip`         — Bun-style edge deployment simulation.
 *                                    Records the deployment region, cold
 *                                    start latency, and warm request
 *                                    latency across N invocations.
 *   - `driveTestcontainersProbe`   — libsql / SQLite 3.45 container image
 *                                    probe. Under mock mode returns
 *                                    deterministic placeholders; under real
 *                                    mode returns the container-mapped URL
 *                                    or a well-defined divergence when the
 *                                    env is absent.
 *   - `emitFidelity`               — flush accumulated axis coverage into
 *                                    the fidelity harness.
 *
 * All 5 ops satisfy the same "op → observation → trace" shape so behavioural
 * fidelity between real vs mock can be measured side-by-side and fed to
 * `@kiwa-test/quality-metrics` 13-axis release gate.
 */

export const OPS_UNDER_TEST = [
  'driveWalFullJourney',
  'driveFts5FullJourney',
  'driveEdgeRoundtrip',
  'driveTestcontainersProbe',
  'emitFidelity',
] as const;

/** WAL full-journey observation — final journal state + checkpoint count. */
export interface WalObservation {
  readonly finalJournalMode: 'WAL';
  readonly checkpointCount: number;
  readonly walSizeBytes: number;
  readonly sharedMemoryBytes: number;
  readonly finalState: 'shared-memory-mapped';
}

/** FTS5 full-journey observation — tokenizer + query rank + vocab. */
export interface Fts5Observation {
  readonly tableName: string;
  readonly tokenizer: 'unicode61' | 'porter' | 'trigram';
  readonly tokenCount: number;
  readonly matchRank: number;
  readonly vocabTerm: string;
  readonly vocabOccurrences: number;
  readonly finalState: 'vocab-inspected';
}

/** Edge deployment observation — cold + warm request latency samples. */
export interface EdgeObservation {
  readonly region: string;
  readonly runtime: 'bun' | 'node' | 'workerd';
  readonly coldStartMs: number;
  readonly warmSamplesMs: readonly number[];
  readonly warmMeanMs: number;
  readonly requestsHandled: number;
}

/** Testcontainers probe observation — libsql image + reachable flag. */
export interface TestcontainersProbeObservation {
  readonly sqliteUrl: string;
  readonly sqliteImage: string;
  readonly libsqlImage: string;
  readonly reachable: boolean;
}

/** Trace event — every adapter method appends 1 entry. */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

/** Adapter aggregate metrics — feeds fidelity + release gate. */
export interface AdapterMetrics {
  latencySamplesMs: number[];
  walJourneySteps: number;
  fts5JourneySteps: number;
  edgeInvocations: number;
  testcontainersProbes: number;
}

/** Adapter contract — a single mock + real pair honour this shape. */
export interface SqliteWalFtsAdapter {
  readonly mode: 'mock' | 'real';
  traces(): readonly TraceEvent[];
  metrics(): AdapterMetrics;
  reset(): Promise<void>;
  driveWalFullJourney(input?: {
    thresholdBytes?: number;
    walSizeBytes?: number;
    checkpointMode?: 'PASSIVE' | 'FULL' | 'RESTART' | 'TRUNCATE';
    regionBytes?: number;
  }): Promise<WalObservation>;
  driveFts5FullJourney(input?: {
    tableName?: string;
    columns?: readonly string[];
    tokenizer?: 'unicode61' | 'porter' | 'trigram';
    document?: string;
    query?: string;
    rank?: number;
    vocabTerm?: string;
    vocabOccurrences?: number;
  }): Promise<Fts5Observation>;
  driveEdgeRoundtrip(input?: {
    region?: string;
    runtime?: 'bun' | 'node' | 'workerd';
    requests?: number;
  }): Promise<EdgeObservation>;
  driveTestcontainersProbe(): Promise<TestcontainersProbeObservation>;
  emitFidelity(): Promise<void>;
}
