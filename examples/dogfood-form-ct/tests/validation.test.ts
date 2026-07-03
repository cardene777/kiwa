import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { FormCTAdapter } from '../src/adapters/interface.js';
import { validateAllForms } from '../src/flows/form-flows.js';
import { FORM_SPECS } from '../src/forms/index.js';

let adapter: FormCTAdapter;

beforeEach(() => {
  adapter = makeMockAdapter();
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-form-ct — validation-error axis (all 5 form patterns)', () => {
  it('T-DFFC-VAL-001 validateAllForms returns 5 outcomes with error != null', async () => {
    const outcomes = await validateAllForms(adapter);
    expect(outcomes).toHaveLength(5);
    for (const o of outcomes) {
      expect(o.error, `${o.kind} error`).not.toBeNull();
    }
  });

  it('T-DFFC-VAL-002 submitCallbackCount is 0 for every validation-block case', async () => {
    const outcomes = await validateAllForms(adapter);
    for (const o of outcomes) {
      expect(o.submitCallbackCount, `${o.kind} submitCount`).toBe(0);
    }
  });

  it('T-DFFC-VAL-003 login validation reports missingFieldIds=["password"]', async () => {
    const outcome = await adapter.interactValidation(
      'login',
      FORM_SPECS.login.validationArgs(),
    );
    expect(outcome.error?.missingFieldIds).toEqual(['password']);
  });

  it('T-DFFC-VAL-004 signup validation reports passwordConfirm mismatch', async () => {
    const outcome = await adapter.interactValidation(
      'signup',
      FORM_SPECS.signup.validationArgs(),
    );
    expect(outcome.error?.missingFieldIds).toContain('passwordConfirm');
  });

  it('T-DFFC-VAL-005 checkout validation reports cardNumber for malformed input', async () => {
    const outcome = await adapter.interactValidation(
      'checkout',
      FORM_SPECS.checkout.validationArgs(),
    );
    expect(outcome.error?.missingFieldIds).toContain('cardNumber');
  });

  it('T-DFFC-VAL-006 profile validation reports websiteUrl for malformed URL', async () => {
    const outcome = await adapter.interactValidation(
      'profile',
      FORM_SPECS.profile.validationArgs(),
    );
    expect(outcome.error?.missingFieldIds).toContain('websiteUrl');
  });

  it('T-DFFC-VAL-007 search validation reports missingFieldIds=["query"]', async () => {
    const outcome = await adapter.interactValidation(
      'search',
      FORM_SPECS.search.validationArgs(),
    );
    expect(outcome.error?.missingFieldIds).toEqual(['query']);
  });

  it('T-DFFC-VAL-008 errorText is present in the DOM for every validation block', async () => {
    const outcomes = await validateAllForms(adapter);
    for (const o of outcomes) {
      expect(o.errorText, `${o.kind} errorText`).not.toBeNull();
      expect((o.errorText ?? '').length, `${o.kind} errorText length`).toBeGreaterThan(0);
    }
  });

  it('T-DFFC-VAL-009 interactValidation trace records ok=true 5 times', async () => {
    await validateAllForms(adapter);
    const traces = adapter
      .traces()
      .filter((t) => t.op === 'interactValidation');
    expect(traces).toHaveLength(5);
    expect(traces.every((t) => t.ok)).toBe(true);
  });

  it('T-DFFC-VAL-010 metrics.validationInvocations tracks each validation run', async () => {
    await validateAllForms(adapter);
    expect(adapter.metrics().validationInvocations).toBe(5);
  });

  it('T-DFFC-VAL-011 metrics.handlersInvoked = 5 (exactly 1 onValidationError per form)', async () => {
    // Tight equality — a regression where the submit path fires
    // onValidationError *and* onSubmit for the same click would inflate
    // handlersInvoked, and a greater-than-or-equal assertion would miss it.
    await validateAllForms(adapter);
    expect(adapter.metrics().handlersInvoked).toBe(5);
  });
});
