import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { FormCTAdapter } from '../src/adapters/interface.js';
import { a11yAllForms } from '../src/flows/form-flows.js';
import { FORM_KINDS, FORM_SPECS } from '../src/forms/index.js';

let adapter: FormCTAdapter;

beforeEach(() => {
  adapter = makeMockAdapter();
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-form-ct — a11y-violation axis (all 5 form patterns)', () => {
  it('T-DFFC-A11Y-001 a11yAllForms returns 5 outcomes with 0 violations each', async () => {
    const outcomes = await a11yAllForms(adapter);
    expect(outcomes).toHaveLength(5);
    for (const o of outcomes) {
      expect(o.violations, `${o.kind} violations`).toHaveLength(0);
    }
  });

  it('T-DFFC-A11Y-002 login form a11y is clean (labels wired, submit has aria-label)', async () => {
    const outcome = await adapter.checkA11y('login', FORM_SPECS.login.mountArgs());
    expect(outcome.violations).toHaveLength(0);
  });

  it('T-DFFC-A11Y-003 signup form a11y is clean (labels wired for all 4 fields)', async () => {
    const outcome = await adapter.checkA11y(
      'signup',
      FORM_SPECS.signup.mountArgs(),
    );
    expect(outcome.violations).toHaveLength(0);
  });

  it('T-DFFC-A11Y-004 checkout form a11y is clean (5 fields with proper labels)', async () => {
    const outcome = await adapter.checkA11y(
      'checkout',
      FORM_SPECS.checkout.mountArgs(),
    );
    expect(outcome.violations).toHaveLength(0);
  });

  it('T-DFFC-A11Y-005 profile form a11y is clean (displayName input has label)', async () => {
    // The heuristic checker inside `@kiwa-lab/component` walks <input>
    // elements — <textarea> and <select> are not currently in scope, so this
    // test verifies the input-level rule specifically. Widening the checker
    // to cover textarea / select is a follow-up in the component package.
    const outcome = await adapter.checkA11y(
      'profile',
      FORM_SPECS.profile.mountArgs(),
    );
    expect(outcome.violations).toHaveLength(0);
  });

  it('T-DFFC-A11Y-006 search form a11y is clean (query input has label)', async () => {
    // Same scope note as T-DFFC-A11Y-005 — the heuristic checker only walks
    // <input>, so the <select> for filterCategory is not enforced here.
    const outcome = await adapter.checkA11y(
      'search',
      FORM_SPECS.search.mountArgs(),
    );
    expect(outcome.violations).toHaveLength(0);
  });

  it('T-DFFC-A11Y-007 metrics.a11yInvocations tracks each a11y check', async () => {
    await a11yAllForms(adapter);
    expect(adapter.metrics().a11yInvocations).toBe(FORM_KINDS.length);
  });

  it('T-DFFC-A11Y-008 checkA11y trace records ok=true for each form', async () => {
    await a11yAllForms(adapter);
    const traces = adapter.traces().filter((t) => t.op === 'checkA11y');
    expect(traces).toHaveLength(FORM_KINDS.length);
    expect(traces.every((t) => t.ok)).toBe(true);
  });

  it('T-DFFC-A11Y-009 a11y outcomes echo the input formId', async () => {
    for (const kind of FORM_KINDS) {
      const args = FORM_SPECS[kind].mountArgs();
      const outcome = await adapter.checkA11y(kind, args);
      expect(outcome.formId, `${kind} formId echo`).toBe(args.formId);
    }
  });
});
