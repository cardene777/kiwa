import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { FormCTAdapter } from '../src/adapters/interface.js';
import { submitAllForms } from '../src/flows/form-flows.js';
import { FORM_SPECS } from '../src/forms/index.js';

let adapter: FormCTAdapter;

beforeEach(() => {
  adapter = makeMockAdapter();
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-form-ct — submit-success axis (all 5 form patterns)', () => {
  it('T-DFFC-SUB-001 submitAllForms returns 5 outcomes with submit != null', async () => {
    const outcomes = await submitAllForms(adapter);
    expect(outcomes).toHaveLength(5);
    for (const o of outcomes) {
      expect(o.submit, `${o.kind} submit`).not.toBeNull();
    }
  });

  it('T-DFFC-SUB-002 validationErrorCount is 0 for every happy-path submit', async () => {
    const outcomes = await submitAllForms(adapter);
    for (const o of outcomes) {
      expect(o.validationErrorCount, `${o.kind} validationErrors`).toBe(0);
    }
  });

  it('T-DFFC-SUB-003 login submit carries email + password + rememberMe', async () => {
    const outcome = await adapter.interactSubmit(
      'login',
      FORM_SPECS.login.submitArgs(),
    );
    expect(outcome.submit?.values['email']).toBe('user@example.com');
    expect(outcome.submit?.values['password']).toBe('hunter2!');
    expect(outcome.submit?.values['rememberMe']).toBe('on');
  });

  it('T-DFFC-SUB-004 signup submit carries matching password + passwordConfirm', async () => {
    const outcome = await adapter.interactSubmit(
      'signup',
      FORM_SPECS.signup.submitArgs(),
    );
    expect(outcome.submit?.values['password']).toBe('hunter2!');
    expect(outcome.submit?.values['passwordConfirm']).toBe('hunter2!');
    expect(outcome.submit?.values['acceptedTerms']).toBe('on');
  });

  it('T-DFFC-SUB-005 checkout submit carries all 5 order fields', async () => {
    const outcome = await adapter.interactSubmit(
      'checkout',
      FORM_SPECS.checkout.submitArgs(),
    );
    expect(outcome.submit?.values['fullName']).toBe('Ada Lovelace');
    expect(outcome.submit?.values['cardNumber']).toBe('4242424242424242');
  });

  it('T-DFFC-SUB-006 profile submit carries a well-formed URL', async () => {
    const outcome = await adapter.interactSubmit(
      'profile',
      FORM_SPECS.profile.submitArgs(),
    );
    expect(outcome.submit?.values['websiteUrl']).toBe(
      'https://ada.example.com',
    );
  });

  it('T-DFFC-SUB-007 search submit carries query + filterCategory', async () => {
    const outcome = await adapter.interactSubmit(
      'search',
      FORM_SPECS.search.submitArgs(),
    );
    expect(outcome.submit?.values['query']).toBe(
      'introduction to computing',
    );
    expect(outcome.submit?.values['filterCategory']).toBe('books');
  });

  it('T-DFFC-SUB-008 interactSubmit trace records ok=true 5 times', async () => {
    await submitAllForms(adapter);
    const traces = adapter.traces().filter((t) => t.op === 'interactSubmit');
    expect(traces).toHaveLength(5);
    expect(traces.every((t) => t.ok)).toBe(true);
  });

  it('T-DFFC-SUB-009 metrics.submitInvocations tracks each submit run', async () => {
    await submitAllForms(adapter);
    expect(adapter.metrics().submitInvocations).toBe(5);
  });

  it('T-DFFC-SUB-010 metrics.handlersInvoked >= 5 (1 onSubmit per form)', async () => {
    await submitAllForms(adapter);
    expect(adapter.metrics().handlersInvoked).toBeGreaterThanOrEqual(5);
  });

  it('T-DFFC-SUB-011 submit payload formId echoes the input args.formId', async () => {
    const outcomes = await submitAllForms(adapter);
    for (const o of outcomes) {
      expect(o.submit?.formId, `${o.kind} payload formId`).toBe(o.formId);
    }
  });
});
