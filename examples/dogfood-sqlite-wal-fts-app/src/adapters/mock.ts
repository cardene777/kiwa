/**
 * Mock adapter — drives the orm v0.10 SQLite WAL + FTS5 semantics + the
 * bun-style edge deployment simulator into a single deterministic surface.
 * Every op appends 1 latency sample + 1 trace event so the fidelity
 * harness never reads as 0-sample.
 */

import { driveWalJourney } from '../wal/index.js';
import { driveFts5Journey } from '../fts5/index.js';
import { driveEdgeRoundtripFlow } from '../edge/index.js';
import type {
  AdapterMetrics,
  EdgeObservation,
  Fts5Observation,
  SqliteWalFtsAdapter,
  TestcontainersProbeObservation,
  TraceEvent,
  WalObservation,
} from './interface.js';
import { OPS_UNDER_TEST } from './interface.js';

/** Deterministic mock endpoints exposed by `driveTestcontainersProbe`. */
export const MOCK_SQLITE_URL = 'file:sqlite-mock.db';
export const SQLITE_IMAGE_DEFAULT = 'sqlite:3.45';
export const LIBSQL_IMAGE_DEFAULT = 'ghcr.io/tursodatabase/libsql-server:latest';

export interface MockAdapterOptions {
  readonly databasePath?: string;
  readonly defaultTableName?: string;
}

export function makeMockAdapter(opts: MockAdapterOptions = {}): SqliteWalFtsAdapter {
  const config = {
    databasePath: opts.databasePath ?? '/var/lib/kiwa/notebook.db',
    defaultTableName: opts.defaultTableName ?? 'notebook_fts',
  };

  const trace: TraceEvent[] = [];
  const metricsAgg: AdapterMetrics = {
    latencySamplesMs: [],
    walJourneySteps: 0,
    fts5JourneySteps: 0,
    edgeInvocations: 0,
    testcontainersProbes: 0,
  };

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  async function timed<T>(op: string, run: () => T | Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await run();
      metricsAgg.latencySamplesMs.push(performance.now() - start);
      return result;
    } catch (err) {
      metricsAgg.latencySamplesMs.push(performance.now() - start);
      record(op, false, {
        errorKind: 'SQLITE_MOCK_ERROR',
        detail: { message: err instanceof Error ? err.message : String(err) },
      });
      throw err;
    }
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async driveWalFullJourney(input): Promise<WalObservation> {
      return timed('driveWalFullJourney', async () => {
        const result = driveWalJourney({
          databasePath: config.databasePath,
          thresholdBytes: input?.thresholdBytes ?? 4 * 1024 * 1024,
          walSizeBytes: input?.walSizeBytes ?? 8 * 1024 * 1024,
          checkpointMode: input?.checkpointMode ?? 'TRUNCATE',
          regionBytes: input?.regionBytes ?? 32 * 1024,
        });
        metricsAgg.walJourneySteps += result.session.history.length;
        const observation: WalObservation = {
          finalJournalMode: 'WAL',
          checkpointCount: result.checkpointCount,
          walSizeBytes: result.walSizeBytes,
          sharedMemoryBytes: result.sharedMemoryBytes,
          finalState: 'shared-memory-mapped',
        };
        record('driveWalFullJourney', true, {
          detail: {
            finalJournalMode: observation.finalJournalMode,
            checkpointCount: observation.checkpointCount,
            walSizeBytes: observation.walSizeBytes,
            sharedMemoryBytes: observation.sharedMemoryBytes,
            finalState: observation.finalState,
          },
        });
        return observation;
      });
    },

    async driveFts5FullJourney(input): Promise<Fts5Observation> {
      return timed('driveFts5FullJourney', async () => {
        const result = driveFts5Journey({
          tableName: input?.tableName ?? config.defaultTableName,
          columns: input?.columns ?? ['title', 'body'],
          tokenizer: input?.tokenizer ?? 'unicode61',
          document:
            input?.document ??
            'kiwa notebook full text index sqlite fts5 wal edge deployment',
          query: input?.query ?? 'sqlite AND (wal OR fts5)',
          rank: input?.rank ?? -3.14,
          vocabTerm: input?.vocabTerm ?? 'sqlite',
          vocabOccurrences: input?.vocabOccurrences ?? 2,
        });
        metricsAgg.fts5JourneySteps += result.session.history.length;
        const observation: Fts5Observation = {
          tableName: result.tableName,
          tokenizer: result.tokenizer,
          tokenCount: result.tokenCount,
          matchRank: result.matchRank,
          vocabTerm: result.vocabTerm,
          vocabOccurrences: result.vocabOccurrences,
          finalState: 'vocab-inspected',
        };
        record('driveFts5FullJourney', true, {
          detail: {
            tableName: observation.tableName,
            tokenizer: observation.tokenizer,
            tokenCount: observation.tokenCount,
            matchRank: observation.matchRank,
            vocabTerm: observation.vocabTerm,
            finalState: observation.finalState,
          },
        });
        return observation;
      });
    },

    async driveEdgeRoundtrip(input): Promise<EdgeObservation> {
      return timed('driveEdgeRoundtrip', async () => {
        const result = driveEdgeRoundtripFlow({
          region: input?.region ?? 'iad',
          runtime: input?.runtime ?? 'bun',
          requests: input?.requests ?? 10,
        });
        metricsAgg.edgeInvocations += result.requestsHandled;
        const observation: EdgeObservation = {
          region: result.region,
          runtime: result.runtime,
          coldStartMs: result.coldStartMs,
          warmSamplesMs: result.warmSamplesMs,
          warmMeanMs: result.warmMeanMs,
          requestsHandled: result.requestsHandled,
        };
        record('driveEdgeRoundtrip', true, {
          detail: {
            region: observation.region,
            runtime: observation.runtime,
            coldStartMs: observation.coldStartMs,
            warmMeanMs: observation.warmMeanMs,
            requestsHandled: observation.requestsHandled,
          },
        });
        return observation;
      });
    },

    async driveTestcontainersProbe(): Promise<TestcontainersProbeObservation> {
      return timed('driveTestcontainersProbe', async () => {
        metricsAgg.testcontainersProbes += 1;
        const observation: TestcontainersProbeObservation = {
          sqliteUrl: MOCK_SQLITE_URL,
          sqliteImage: SQLITE_IMAGE_DEFAULT,
          libsqlImage: LIBSQL_IMAGE_DEFAULT,
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
      });
    },

    async emitFidelity(): Promise<void> {
      return timed('emitFidelity', async () => {
        record('emitFidelity', true, {
          detail: { opsUnderTest: OPS_UNDER_TEST.length },
        });
      });
    },

    metrics(): AdapterMetrics {
      return {
        ...metricsAgg,
        latencySamplesMs: [...metricsAgg.latencySamplesMs],
      };
    },

    async reset(): Promise<void> {
      trace.length = 0;
      metricsAgg.latencySamplesMs.length = 0;
      metricsAgg.walJourneySteps = 0;
      metricsAgg.fts5JourneySteps = 0;
      metricsAgg.edgeInvocations = 0;
      metricsAgg.testcontainersProbes = 0;
    },
  };
}
