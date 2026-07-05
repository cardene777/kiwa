/**
 * Real adapter — drives a mediasoup SFU + coturn TURN pair (via
 * testcontainers) when both env keys are set. On any system without those
 * containers (which is every non-integration environment by default), the
 * adapter refuses to run and every method reports
 * `KIWA_WEBRTC_ENV_MISSING`. Downstream tests inspect
 * {@link VideoCallAdapter.mode} + the trace to skip real assertions on
 * those systems.
 *
 * The full mediasoup / coturn wiring is deferred to a follow-up when the
 * testcontainers Node image ships. Sub-Issue #972 (this one) lands the
 * env-detect skeleton + trace so the fidelity harness can uniformly drive
 * both adapters even when only the mock has an actual body. The pattern is
 * the same as `dogfood-webauthn-passkey-app/src/adapters/real.ts`
 * (Sub-Issue #856) — env detection reports which key is missing so the
 * downstream release-gate row can distinguish "not configured" from "ran
 * and diverged".
 */

import type {
  IceRestartResult,
  JoinRoomResult,
  PublishTrackResult,
  SelectLayerResult,
  ToggleMuteResult,
  TraceEvent,
  VideoCallAdapter,
} from './interface.js';

const MISSING_ENV_ERROR = 'KIWA_WEBRTC_ENV_MISSING';

/**
 * Report whether the current process can talk to a real mediasoup SFU + coturn
 * TURN pair. Returns `null` on capable systems, or a short reason string when
 * the env is missing (used to populate `TraceEvent.errorKind`).
 *
 * The gate is intentionally strict — mediasoup requires a native worker
 * binary + coturn requires a UDP relay port, both of which cost minutes to
 * provision. The default answer is "skip real" so unit test workflows stay
 * fast and hermetic.
 */
export function detectRealEnvMissing(): string | null {
  // KIWA_MODE=mock is the explicit "please stay mock" toggle used by tests
  // that want to compare mock-vs-mock without touching the SFU.
  if (process.env['KIWA_MODE'] === 'mock') return 'KIWA_MODE=mock';
  // WEBRTC_MEDIASOUP_READY=1 opts in to real ceremonies once the
  // testcontainers wiring is in place. Until it is set every ceremony errors
  // out with MISSING_ENV_ERROR — a follow-up milestone ships the container
  // driver.
  if (process.env['WEBRTC_MEDIASOUP_READY'] === '1') return null;
  return MISSING_ENV_ERROR;
}

export function makeRealAdapter(): VideoCallAdapter {
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

    async joinRoom(_input): Promise<JoinRoomResult> {
      throw envError('joinRoom');
    },

    async leaveRoom(_input): Promise<void> {
      // leaveRoom is idempotent — on a missing env we record and return so
      // downstream harnesses observe the same "cleanup succeeded" shape as
      // the mock adapter. The fidelity harness treats env-missing traces as
      // divergences separately from the ratio.
      record('leaveRoom', false, { errorKind: detectRealEnvMissing() ?? MISSING_ENV_ERROR });
    },

    async publishTrack(_input): Promise<PublishTrackResult> {
      throw envError('publishTrack');
    },

    async unpublishTrack(_input): Promise<void> {
      record('unpublishTrack', false, {
        errorKind: detectRealEnvMissing() ?? MISSING_ENV_ERROR,
      });
    },

    async muteTrack(_input): Promise<ToggleMuteResult> {
      throw envError('muteTrack');
    },

    async unmuteTrack(_input): Promise<ToggleMuteResult> {
      throw envError('unmuteTrack');
    },

    async selectLayer(_input): Promise<SelectLayerResult> {
      throw envError('selectLayer');
    },

    async iceRestart(_input): Promise<IceRestartResult> {
      throw envError('iceRestart');
    },

    metrics() {
      return {
        joinCount: 0,
        publishCount: 0,
        tracksPublished: 0,
        tracksUnpublished: 0,
        mutes: 0,
        unmutes: 0,
        layerSwitches: 0,
        iceRestarts: 0,
        joinLatencySamplesMs: [],
        publishLatencySamplesMs: [],
        iceRestartLatencySamplesMs: [],
        requests: 0,
      };
    },

    async reset(): Promise<void> {
      trace.length = 0;
      record('reset', true);
    },
  };
}
