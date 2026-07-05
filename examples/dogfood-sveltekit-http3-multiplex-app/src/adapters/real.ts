/**
 * Real adapter — drives an nginx-quic HTTP/3 testcontainer when both env keys
 * are set. On any system without the container image (which is every
 * non-integration environment by default), the adapter refuses to run and
 * every method reports `KIWA_HTTP3_ENV_MISSING`. Downstream tests inspect
 * {@link Http3MultiplexAdapter.mode} + the trace to skip real assertions on
 * those systems.
 *
 * The full nginx-quic wiring is deferred to a follow-up when the
 * testcontainers image ships with QUIC keys pre-installed. Sub-Issue #974
 * (this one) lands the env-detect skeleton + trace so the fidelity harness
 * can uniformly drive both adapters even when only the mock has an actual
 * body. The pattern is the same as
 * `dogfood-nuxt-webtransport-stream-app/src/adapters/real.ts` (Sub-Issue #973)
 * — env detection reports which key is missing so the downstream release-gate
 * row can distinguish "not configured" from "ran and diverged".
 */

import type {
  CloseStreamResult,
  ConcurrentSendResult,
  Http3MultiplexAdapter,
  HpackInsertResult,
  OpenConnectionResult,
  OpenStreamResult,
  ReadStreamResult,
  ResumeZeroRttResult,
  TraceEvent,
  WriteStreamResult,
} from './interface.js';

const MISSING_ENV_ERROR = 'KIWA_HTTP3_ENV_MISSING';

/**
 * Report whether the current process can talk to a real nginx-quic HTTP/3
 * server. Returns `null` on capable systems, or a short reason string when
 * the env is missing (used to populate `TraceEvent.errorKind`).
 *
 * The gate is intentionally strict — nginx-quic requires a UDP-bound QUIC
 * port + a self-signed cert exchange + a testcontainers boot, all of which
 * cost seconds to provision. The default answer is "skip real" so unit test
 * workflows stay fast and hermetic.
 */
export function detectRealEnvMissing(): string | null {
  // KIWA_MODE=mock is the explicit "please stay mock" toggle used by tests
  // that want to compare mock-vs-mock without touching nginx-quic.
  if (process.env['KIWA_MODE'] === 'mock') return 'KIWA_MODE=mock';
  // HTTP3_KEY=1 opts in to real ceremonies once the nginx-quic
  // testcontainers wiring is in place. Until it is set every ceremony errors
  // out with MISSING_ENV_ERROR — a follow-up milestone ships the container
  // driver.
  if (process.env['HTTP3_KEY'] === '1') return null;
  return MISSING_ENV_ERROR;
}

export function makeRealAdapter(): Http3MultiplexAdapter {
  const trace: TraceEvent[] = [];

  function record(op: TraceEvent['op'], ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function envError(op: TraceEvent['op']): Error {
    const reason = detectRealEnvMissing() ?? MISSING_ENV_ERROR;
    record(op, false, { errorKind: reason });
    return new Error(`makeRealAdapter.${op}: ${reason}`);
  }

  return {
    mode: 'real',
    traces: () => [...trace],

    async openConnection(_input): Promise<OpenConnectionResult> {
      throw envError('openConnection');
    },

    async closeConnection(_input): Promise<void> {
      // closeConnection is idempotent — on a missing env we record and return
      // so downstream harnesses observe the same "cleanup succeeded" shape as
      // the mock adapter. The fidelity harness treats env-missing traces as
      // divergences separately from the ratio.
      record('closeConnection', false, {
        errorKind: detectRealEnvMissing() ?? MISSING_ENV_ERROR,
      });
    },

    async openStream(_input): Promise<OpenStreamResult> {
      throw envError('openStream');
    },

    async concurrentSend(_input): Promise<ConcurrentSendResult> {
      throw envError('concurrentSend');
    },

    async writeStream(_input): Promise<WriteStreamResult> {
      throw envError('writeStream');
    },

    async readStream(_input): Promise<ReadStreamResult> {
      throw envError('readStream');
    },

    async closeStream(_input): Promise<CloseStreamResult> {
      throw envError('closeStream');
    },

    async insertHpackHeader(_input): Promise<HpackInsertResult> {
      throw envError('insertHpackHeader');
    },

    async resumeZeroRtt(_input): Promise<ResumeZeroRttResult> {
      throw envError('resumeZeroRtt');
    },

    metrics() {
      return {
        connectionsOpened: 0,
        connectionsClosed: 0,
        streamsOpened: 0,
        streamsClosed: 0,
        writesTotal: 0,
        readsTotal: 0,
        concurrentSendsTotal: 0,
        hpackInserts: 0,
        zeroRttUses: 0,
        zeroRttEarlyDataAccepted: 0,
        openConnectionLatencySamplesMs: [],
        openStreamLatencySamplesMs: [],
        writeLatencySamplesMs: [],
        concurrentSendLatencySamplesMs: [],
        hpackTableSize: 0,
        hpackCompressionRatio: 0,
        requests: 0,
      };
    },

    async reset(): Promise<void> {
      trace.length = 0;
      record('reset', true);
    },
  };
}
