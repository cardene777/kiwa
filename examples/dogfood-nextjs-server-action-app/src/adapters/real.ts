/**
 * Real adapter — drives a Playwright + Chromium headless session against
 * the Next.js 15.4 dev server when both env keys are set. On any system
 * without those, the adapter refuses to run and every method reports
 * `KIWA_SERVER_ACTION_ENV_MISSING`. Downstream tests inspect
 * {@link ServerActionAdapter.mode} + the trace to skip real assertions on
 * those systems.
 *
 * The full Playwright ceremony is deferred to a follow-up milestone once
 * the Chromium binary is available in the CI worker image. This milestone
 * (v1.34-3, Sub-Issue CAR-786) lands the env-detect skeleton + trace so
 * the fidelity harness can uniformly drive both adapters even when only
 * the mock has an actual body. The pattern follows
 * `dogfood-nextjs-rsc-streaming-app/src/adapters/real.ts` (v1.34-2) — env
 * detection reports which key is missing so the downstream release-gate
 * row can distinguish "not configured" from "ran and diverged".
 */

import type {
  RunLikeResult,
  RunLoginResult,
  ServerActionAdapter,
  SubmitSubscribeResult,
  TraceEvent,
} from './interface.js';

const MISSING_ENV_ERROR = 'KIWA_SERVER_ACTION_ENV_MISSING';

/**
 * Report whether the current process can talk to a real Playwright + Chromium
 * pair. Returns `null` on capable systems, or a short reason string when the
 * env is missing (used to populate `TraceEvent.errorKind`).
 *
 * The gate is intentionally strict — Chromium requires a native binary + the
 * Next.js dev server needs to boot, both of which cost seconds to provision.
 * The default answer is "skip real" so unit test workflows stay fast and
 * hermetic.
 */
export function detectRealEnvMissing(): string | null {
  // KIWA_MODE=mock is the explicit "please stay mock" toggle used by tests
  // that want to compare mock-vs-mock without spinning up Chromium.
  if (process.env['KIWA_MODE'] === 'mock') return 'KIWA_MODE=mock';
  // SERVER_ACTION_BROWSER_READY=1 opts in to real ceremonies once the
  // Chromium binary is available. Until it is set every ceremony errors
  // out with MISSING_ENV_ERROR — a follow-up milestone ships the browser
  // driver.
  if (process.env['SERVER_ACTION_BROWSER_READY'] === '1') return null;
  return MISSING_ENV_ERROR;
}

export function makeRealAdapter(): ServerActionAdapter {
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

    async submitSubscribe(_input): Promise<SubmitSubscribeResult> {
      throw envError('submitSubscribe');
    },

    async runLike(_input): Promise<RunLikeResult> {
      throw envError('submitLike');
    },

    async runLogin(_input): Promise<RunLoginResult> {
      throw envError('submitLogin');
    },

    metrics() {
      return {
        subscribesSubmitted: 0,
        likesSubmitted: 0,
        loginsSubmitted: 0,
        pathRevalidations: 0,
        tagRevalidations: 0,
        redirects: 0,
        optimisticApplied: 0,
        formsResolved: 0,
        formsRejected: 0,
        progressiveEnhancements: 0,
        subscribeLatencySamplesMs: [],
        likeLatencySamplesMs: [],
        loginLatencySamplesMs: [],
        requests: 0,
      };
    },

    async reset(): Promise<void> {
      trace.length = 0;
      record('reset', true);
    },
  };
}
