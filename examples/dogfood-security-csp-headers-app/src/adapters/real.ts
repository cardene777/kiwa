/**
 * Real adapter — drives a Playwright + Chromium headless session against
 * the Next.js 15.4 dev server when both env keys are set. On any system
 * without those, the adapter refuses to run and every method reports
 * `KIWA_CSP_ENV_MISSING`. Downstream tests inspect
 * {@link SecurityAdapter.mode} + the trace to skip real assertions on
 * those systems.
 *
 * The full Playwright ceremony is deferred to a follow-up milestone once
 * the Chromium binary is available in the CI worker image. This milestone
 * (v1.37-2, Sub-Issue CAR-826) lands the env-detect skeleton + trace so
 * the fidelity harness can uniformly drive both adapters even when only
 * the mock has an actual body. The pattern follows
 * `dogfood-nextjs-server-action-app/src/adapters/real.ts` (v1.34-3) — env
 * detection reports which key is missing so the downstream release-gate
 * row can distinguish "not configured" from "ran and diverged".
 */

import type {
  BuildCspResult,
  BuildHeadersResult,
  ReportViolationResult,
  SecurityAdapter,
  TraceEvent,
} from './interface.js';

const MISSING_ENV_ERROR = 'KIWA_CSP_ENV_MISSING';

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
  // CSP_BROWSER_READY=1 opts in to real ceremonies once the Chromium binary
  // is available. Until it is set every ceremony errors out with
  // MISSING_ENV_ERROR — a follow-up milestone ships the browser driver.
  if (process.env['CSP_BROWSER_READY'] === '1') return null;
  return MISSING_ENV_ERROR;
}

export function makeRealAdapter(): SecurityAdapter {
  const trace: TraceEvent[] = [];

  function record(
    op: TraceEvent['op'],
    ok: boolean,
    extra?: Partial<TraceEvent>,
  ): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function refuse(op: TraceEvent['op']): void {
    const missing = detectRealEnvMissing() ?? MISSING_ENV_ERROR;
    record(op, false, { errorKind: missing });
  }

  return {
    mode: 'real',

    async startCsp() {
      refuse('startCsp');
      throw new Error(MISSING_ENV_ERROR);
    },
    async attachNonce() {
      refuse('attachNonce');
      throw new Error(MISSING_ENV_ERROR);
    },
    async attachHash() {
      refuse('attachHash');
      throw new Error(MISSING_ENV_ERROR);
    },
    async applyStrictDynamic() {
      refuse('applyStrictDynamic');
      throw new Error(MISSING_ENV_ERROR);
    },
    async applyTrustedTypes() {
      refuse('applyTrustedTypes');
      throw new Error(MISSING_ENV_ERROR);
    },
    async emitCspHeader(): Promise<BuildCspResult> {
      refuse('emitCspHeader');
      throw new Error(MISSING_ENV_ERROR);
    },
    async startViolation() {
      refuse('startViolation');
      throw new Error(MISSING_ENV_ERROR);
    },
    async ingestViolation(): Promise<ReportViolationResult> {
      refuse('ingestViolation');
      throw new Error(MISSING_ENV_ERROR);
    },
    async recordViolationEvent() {
      refuse('recordViolationEvent');
      throw new Error(MISSING_ENV_ERROR);
    },
    async closeViolation() {
      refuse('closeViolation');
      throw new Error(MISSING_ENV_ERROR);
    },
    async startHeaders() {
      refuse('startHeaders');
      throw new Error(MISSING_ENV_ERROR);
    },
    async applyHsts() {
      refuse('applyHsts');
      throw new Error(MISSING_ENV_ERROR);
    },
    async applyReferrerPolicy() {
      refuse('applyReferrerPolicy');
      throw new Error(MISSING_ENV_ERROR);
    },
    async applyPermissionsPolicy() {
      refuse('applyPermissionsPolicy');
      throw new Error(MISSING_ENV_ERROR);
    },
    async emitHeaderBundle(): Promise<BuildHeadersResult> {
      refuse('emitHeaderBundle');
      throw new Error(MISSING_ENV_ERROR);
    },

    traces() {
      return trace;
    },
    async reset() {
      trace.length = 0;
    },
  };
}
