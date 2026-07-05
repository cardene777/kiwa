/**
 * Real adapter — drives an aioquic HTTP/3 + WebTransport testcontainer when
 * both env keys are set. On any system without the container image (which is
 * every non-integration environment by default), the adapter refuses to run
 * and every method reports `KIWA_WEBTRANSPORT_ENV_MISSING`. Downstream tests
 * inspect {@link WebTransportStreamAdapter.mode} + the trace to skip real
 * assertions on those systems.
 *
 * The full aioquic wiring is deferred to a follow-up when the testcontainers
 * python image ships with WebTransport / HTTP/3 keys pre-installed.
 * Sub-Issue #973 (this one) lands the env-detect skeleton + trace so the
 * fidelity harness can uniformly drive both adapters even when only the mock
 * has an actual body. The pattern is the same as
 * `dogfood-nextjs-webrtc-video-app/src/adapters/real.ts` (Sub-Issue #972) —
 * env detection reports which key is missing so the downstream release-gate
 * row can distinguish "not configured" from "ran and diverged".
 */

import type {
  MigrateConnectionResult,
  OpenBiStreamResult,
  OpenSessionResult,
  OpenUniStreamResult,
  ReadStreamResult,
  ResetStreamResult,
  SendDatagramResult,
  TraceEvent,
  WebTransportStreamAdapter,
  WriteStreamResult,
} from './interface.js';

const MISSING_ENV_ERROR = 'KIWA_WEBTRANSPORT_ENV_MISSING';

/**
 * Report whether the current process can talk to a real aioquic HTTP/3 +
 * WebTransport server. Returns `null` on capable systems, or a short reason
 * string when the env is missing (used to populate `TraceEvent.errorKind`).
 *
 * The gate is intentionally strict — aioquic requires a Python 3 runtime + a
 * UDP-bound QUIC port + a self-signed cert exchange, all of which cost
 * seconds to provision. The default answer is "skip real" so unit test
 * workflows stay fast and hermetic.
 */
export function detectRealEnvMissing(): string | null {
  // KIWA_MODE=mock is the explicit "please stay mock" toggle used by tests
  // that want to compare mock-vs-mock without touching aioquic.
  if (process.env['KIWA_MODE'] === 'mock') return 'KIWA_MODE=mock';
  // WEBTRANSPORT_KEY=1 opts in to real ceremonies once the aioquic
  // testcontainers wiring is in place. Until it is set every ceremony errors
  // out with MISSING_ENV_ERROR — a follow-up milestone ships the container
  // driver.
  if (process.env['WEBTRANSPORT_KEY'] === '1') return null;
  return MISSING_ENV_ERROR;
}

export function makeRealAdapter(): WebTransportStreamAdapter {
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

    async openSession(_input): Promise<OpenSessionResult> {
      throw envError('openSession');
    },

    async closeSession(_input): Promise<void> {
      // closeSession is idempotent — on a missing env we record and return so
      // downstream harnesses observe the same "cleanup succeeded" shape as
      // the mock adapter. The fidelity harness treats env-missing traces as
      // divergences separately from the ratio.
      record('closeSession', false, {
        errorKind: detectRealEnvMissing() ?? MISSING_ENV_ERROR,
      });
    },

    async openUniStream(_input): Promise<OpenUniStreamResult> {
      throw envError('openUniStream');
    },

    async openBiStream(_input): Promise<OpenBiStreamResult> {
      throw envError('openBiStream');
    },

    async writeStream(_input): Promise<WriteStreamResult> {
      throw envError('writeStream');
    },

    async readStream(_input): Promise<ReadStreamResult> {
      throw envError('readStream');
    },

    async resetStream(_input): Promise<ResetStreamResult> {
      throw envError('resetStream');
    },

    async sendDatagram(_input): Promise<SendDatagramResult> {
      throw envError('sendDatagram');
    },

    async migrateConnection(_input): Promise<MigrateConnectionResult> {
      throw envError('migrateConnection');
    },

    metrics() {
      return {
        sessionsOpened: 0,
        sessionsClosed: 0,
        uniStreamsOpened: 0,
        biStreamsOpened: 0,
        writesTotal: 0,
        readsTotal: 0,
        resetsTotal: 0,
        datagramsSent: 0,
        migrations: 0,
        backpressureEvents: 0,
        zeroRttUses: 0,
        openSessionLatencySamplesMs: [],
        openStreamLatencySamplesMs: [],
        writeLatencySamplesMs: [],
        migrationLatencySamplesMs: [],
        requests: 0,
      };
    },

    async reset(): Promise<void> {
      trace.length = 0;
      record('reset', true);
    },
  };
}
