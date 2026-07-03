import { FORM_KINDS, FORM_SPECS } from '../forms/index.js';
import type { FormKind } from '../forms/index.js';
import type {
  FormA11yOutcome,
  FormCTAdapter,
  FormMountSummary,
  FormSubmitOutcome,
  FormValidationOutcome,
} from '../adapters/interface.js';

/**
 * User-facing flow implementations — the "what the app actually does" that
 * both mock and real adapters must satisfy. Each flow drives 1 op across all
 * 5 forms and returns the per-form outcome so tests + fidelity harness can
 * assert on the aggregate without re-implementing the adapter contract in-line.
 *
 * The 4 flows exercise the 4 axes named in Issue #765 AC — mount / validation
 * error / submit success / a11y violation count = 0 — 1 flow per axis. All
 * 4 are invoked in sequence for a full CT round-trip.
 */

/** Flow 1 — mount every form kind with its neutral `mountArgs` and return the
 *  per-form summary. Callers assert the field count matches per-form expected
 *  values (login=3, signup=4, checkout=5, profile=3, search=2). */
export async function mountAllForms(
  adapter: FormCTAdapter,
): Promise<FormMountSummary[]> {
  const out: FormMountSummary[] = [];
  for (const kind of FORM_KINDS) {
    const spec = FORM_SPECS[kind];
    const summary = await adapter.mount(kind, spec.mountArgs());
    out.push(summary);
  }
  return out;
}

/** Flow 2 — drive the validation branch for every form kind and return the
 *  per-form outcome. Callers assert `error` is non-null (validation reported)
 *  and `submitCallbackCount` is 0 (submit did not fire). */
export async function validateAllForms(
  adapter: FormCTAdapter,
): Promise<FormValidationOutcome[]> {
  const out: FormValidationOutcome[] = [];
  for (const kind of FORM_KINDS) {
    const spec = FORM_SPECS[kind];
    const outcome = await adapter.interactValidation(kind, spec.validationArgs());
    out.push(outcome);
  }
  return out;
}

/** Flow 3 — drive the happy path for every form kind and return the per-form
 *  outcome. Callers assert `submit` is non-null and `validationErrorCount` is
 *  0. */
export async function submitAllForms(
  adapter: FormCTAdapter,
): Promise<FormSubmitOutcome[]> {
  const out: FormSubmitOutcome[] = [];
  for (const kind of FORM_KINDS) {
    const spec = FORM_SPECS[kind];
    const outcome = await adapter.interactSubmit(kind, spec.submitArgs());
    out.push(outcome);
  }
  return out;
}

/** Flow 4 — a11y check every form kind (with default mount args) and return
 *  the per-form outcome. Callers assert `violations.length === 0` on every
 *  form because the shared builders wire label[for], aria-label on the submit
 *  button, and aria-live on the error region so the heuristic checker in
 *  `@kiwa-test/component` finds nothing to report. */
export async function a11yAllForms(
  adapter: FormCTAdapter,
): Promise<FormA11yOutcome[]> {
  const out: FormA11yOutcome[] = [];
  for (const kind of FORM_KINDS) {
    const spec = FORM_SPECS[kind];
    const outcome = await adapter.checkA11y(kind, spec.mountArgs());
    out.push(outcome);
  }
  return out;
}

/** Convenience for the fidelity harness — drives all 4 flows and returns them
 *  as an object. Failures propagate so a mock-side regression cannot silently
 *  pass the release gate. */
export async function runAllForms(adapter: FormCTAdapter): Promise<{
  mount: FormMountSummary[];
  validation: FormValidationOutcome[];
  submit: FormSubmitOutcome[];
  a11y: FormA11yOutcome[];
}> {
  const mount = await mountAllForms(adapter);
  const validation = await validateAllForms(adapter);
  const submit = await submitAllForms(adapter);
  const a11y = await a11yAllForms(adapter);
  return { mount, validation, submit, a11y };
}

/** Number of forms in the fixture — exposed as a helper so tests / reports
 *  keep the count wired into the SSOT. */
export function totalFormCount(): number {
  return FORM_KINDS.length;
}

/** Expected per-form field counts. Used by tests to assert the mount summary
 *  matches the DOM shape without duplicating the builder wiring. */
export const EXPECTED_FIELD_COUNTS: Record<FormKind, number> = {
  login: 3, // email + password + rememberMe
  signup: 4, // email + password + passwordConfirm + acceptedTerms
  checkout: 5, // fullName + address + city + postalCode + cardNumber
  profile: 3, // displayName + bio + websiteUrl
  search: 2, // query + filterCategory
};
