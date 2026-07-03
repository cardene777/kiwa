import type {
  FormA11yOutcome,
  FormCTAdapter,
  FormMountSummary,
  FormSubmitOutcome,
  FormValidationOutcome,
  TraceEvent,
} from './interface.js';

/**
 * "Real" adapter — targets a real `@playwright/experimental-ct-react` runner
 * via HTTP + preview channel messages. When `PW_CT_ENDPOINT` is not set the
 * adapter returns a `skipped` variant whose every method records a
 * `PW_CT_REAL_ENV_MISSING` trace and throws a distinguished error. Tests use
 * this behaviour to short-circuit gracefully — the fidelity report captures
 * "environment absent" rather than failing the whole suite in local dev.
 *
 * The real driving is intentionally lazy — we do not eagerly install
 * `@playwright/experimental-ct-react` (or a browser runtime) because the
 * workspace does not need one for the mock path. When
 * `PW_CT_ENDPOINT=<component runner base>` is set, the connected
 * implementation would forward each op to the runner via the CT preview
 * iframe channel, mirroring the trace shape.
 *
 * The v0.1 dogfood ships the skip path only — a follow-up "live" perf harness
 * hooks a real CT runner when the caller sets the env, so the perf and
 * fidelity paths converge on the same env-detect logic.
 */

export interface RealAdapterEnv {
  ctEndpoint: string;
  ctBrowser?: string | undefined;
}

const DEFAULT_ENDPOINT_ENV = 'PW_CT_ENDPOINT';

export function detectRealEnv(): RealAdapterEnv | null {
  const endpoint = process.env[DEFAULT_ENDPOINT_ENV];
  if (!endpoint) return null;
  return {
    ctEndpoint: endpoint,
    ctBrowser: process.env['PW_CT_BROWSER'],
  };
}

/** Distinguished error emitted when the real adapter is asked to run without
 *  the required environment. Callers should catch it and let the fidelity
 *  harness record the divergence rather than aborting the whole suite. */
export class SkippedError extends Error {
  readonly code = 'PW_CT_REAL_ENV_MISSING';
  constructor(op: string) {
    super(
      `SkippedError: cannot execute ${op} because PW_CT_ENDPOINT is not set (real Playwright Component Testing runner requires a running preview endpoint)`,
    );
  }
}

export function makeRealAdapter(): FormCTAdapter {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter();
  return makeConnectedRealAdapter(env);
}

function makeSkippedRealAdapter(): FormCTAdapter {
  const trace: TraceEvent[] = [];
  function unsupported<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: 'PW_CT_REAL_ENV_MISSING' });
    throw new SkippedError(op);
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    mount: async () => unsupported<FormMountSummary>('mount'),
    interactValidation: async () =>
      unsupported<FormValidationOutcome>('interactValidation'),
    interactSubmit: async () => unsupported<FormSubmitOutcome>('interactSubmit'),
    checkA11y: async () => unsupported<FormA11yOutcome>('checkA11y'),
    metrics: () => ({
      latencySamplesMs: [],
      mountInvocations: 0,
      validationInvocations: 0,
      submitInvocations: 0,
      a11yInvocations: 0,
      handlersInvoked: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}

/**
 * Connected real-mode driver — v0.1 ships as a placeholder that records a
 * `PW_CT_LIVE_NOT_IMPLEMENTED` trace event so the fidelity harness reads the
 * divergence. The intent is to swap this for a real
 * `@playwright/experimental-ct-react` preview channel driver in a follow-up
 * milestone once the caller opts in with `PW_CT_ENDPOINT` and the workspace
 * hosts a browser runtime.
 *
 * The trace shape is intentionally identical to the skip path (mode='real',
 * errorKind on every trace) so the release-gate divergence count reports the
 * same "absent" signal without a shape-level noise diff.
 */
function makeConnectedRealAdapter(env: RealAdapterEnv): FormCTAdapter {
  const trace: TraceEvent[] = [];
  const noteEnv: TraceEvent = {
    op: 'connect',
    ok: false,
    errorKind: 'PW_CT_LIVE_NOT_IMPLEMENTED',
    detail: { ctEndpoint: env.ctEndpoint },
  };
  trace.push(noteEnv);
  function unsupported<T>(op: string): T {
    trace.push({
      op,
      ok: false,
      errorKind: 'PW_CT_LIVE_NOT_IMPLEMENTED',
      detail: { ctEndpoint: env.ctEndpoint },
    });
    throw new SkippedError(op);
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    mount: async () => unsupported<FormMountSummary>('mount'),
    interactValidation: async () =>
      unsupported<FormValidationOutcome>('interactValidation'),
    interactSubmit: async () => unsupported<FormSubmitOutcome>('interactSubmit'),
    checkA11y: async () => unsupported<FormA11yOutcome>('checkA11y'),
    metrics: () => ({
      latencySamplesMs: [],
      mountInvocations: 0,
      validationInvocations: 0,
      submitInvocations: 0,
      a11yInvocations: 0,
      handlersInvoked: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}
