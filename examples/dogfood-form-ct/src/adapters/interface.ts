import type { A11yViolation } from '@kiwa-lab/component';
import type {
  FormArgsMap,
  FormKind,
  FormSubmitPayload,
  FormValidationError,
} from '../forms/index.js';

/**
 * Provider-neutral Playwright Component Testing adapter for the 5 form CT
 * dogfood. The app talks to Playwright CT only through this interface. Two
 * implementations exist —
 *
 * - `makeMockAdapter` (backed by `@kiwa-lab/component`
 *   `createPlaywrightCTMock`)
 * - `makeRealAdapter` (drives `@playwright/experimental-ct-react` when
 *   `PW_CT_ENDPOINT` is set, else returns a `skipped` variant whose every
 *   method records a `PW_CT_REAL_ENV_MISSING` trace)
 *
 * Both satisfy the same contract so behavioural fidelity between real vs
 * mock can be measured side-by-side and fed to `@kiwa-lab/quality-metrics`
 * 7-axis release gate. Ops match the AC in Issue #765 — mount + validation
 * error + submit success + a11y violation count = 0, generalised across the
 * 5 form kinds.
 */

/** DOM-shape summary returned by `mount` — used by tests to assert the field
 *  count without walking the whole tree. */
export interface FormMountSummary {
  formId: string;
  kind: FormKind;
  fieldCount: number;
  submitButtonLabel: string;
  hasFormElement: boolean;
}

/** Return shape of `interactValidation`. */
export interface FormValidationOutcome {
  formId: string;
  kind: FormKind;
  error: FormValidationError | null;
  errorText: string | null;
  /** Number of `onSubmit` callbacks fired — must be 0 for a validation block. */
  submitCallbackCount: number;
}

/** Return shape of `interactSubmit`. */
export interface FormSubmitOutcome {
  formId: string;
  kind: FormKind;
  submit: FormSubmitPayload | null;
  submitCallbackCount: number;
  /** Number of `onValidationError` callbacks fired — must be 0 on a happy path. */
  validationErrorCount: number;
}

/** Return shape of `checkA11y`. */
export interface FormA11yOutcome {
  formId: string;
  kind: FormKind;
  violations: A11yViolation[];
}

/** Trace event — every adapter method appends one entry to a shared trace
 *  buffer. Downstream tests diff the trace across the two adapters to detect
 *  behavioural divergences (fidelity harness input). */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

export interface FormCTAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  /**
   * Mount a single form kind with the given args and return a light summary
   * so callers can assert the field count / submit label reached the DOM.
   */
  mount<K extends FormKind>(
    kind: K,
    args: FormArgsMap[K],
  ): Promise<FormMountSummary>;

  /**
   * Drive the validation branch — populate the form so at least one required
   * field or format check fails, click submit, capture the reported error.
   * Callers assert `error` is non-null and `submitCallbackCount` is 0.
   */
  interactValidation<K extends FormKind>(
    kind: K,
    args: FormArgsMap[K],
  ): Promise<FormValidationOutcome>;

  /**
   * Drive the happy path — populate every required field with valid values,
   * click submit, capture the resulting payload. Callers assert `submit` is
   * non-null and `validationErrorCount` is 0.
   */
  interactSubmit<K extends FormKind>(
    kind: K,
    args: FormArgsMap[K],
  ): Promise<FormSubmitOutcome>;

  /**
   * Run the a11y checker for 1 form (mock uses the heuristic checker in
   * `@kiwa-lab/component`; real would call axe-core through the Playwright
   * CT preview). Callers assert `violations.length === 0`.
   */
  checkA11y<K extends FormKind>(
    kind: K,
    args: FormArgsMap[K],
  ): Promise<FormA11yOutcome>;

  metrics(): {
    latencySamplesMs: number[];
    mountInvocations: number;
    validationInvocations: number;
    submitInvocations: number;
    a11yInvocations: number;
    handlersInvoked: number;
  };

  reset(): Promise<void>;
}
