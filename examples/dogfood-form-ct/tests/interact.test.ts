import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createPlaywrightCTMock,
  fireEvent,
  type PlaywrightCTMock,
} from '@kiwa-test/component';
import {
  buildLoginForm,
  buildSearchForm,
  buildSignupForm,
  type FormSubmitPayload,
  type FormValidationError,
} from '../src/forms/index.js';

/**
 * Interaction tests exercise the input-level event wiring inside the shared
 * builders — `buildField.onInput` / `buildCheckbox.onChange` /
 * `buildSelect.onChange`. Without these tests, the 4-axis flows only ever
 * pre-populate `args` at construction and never fire an `input` event, so
 * bugs in the `values` Map fan-out or the `input.attrs['checked']` state
 * mutation would silently pass the 49-test suite in the other files.
 *
 * The 3 forms chosen (login / signup / search) cover 3 distinct builder
 * combinations — text field + checkbox toggle (login), text field +
 * required checkbox (signup), text field + select change (search). If any
 * builder's handler wiring regresses, at least 1 test here breaks.
 *
 * Event firing follows the same pattern used by the v1.16-2
 * dogfood-storybook-design-system play functions — direct `fireEvent(node,
 * { type: 'input', target: node, value: '...' })` on a `querySelector`'d
 * node. The mock's `implicitRole` treats `<input type='email'/'password'/
 * 'search'>` all as `textbox` and does not compute the accessible name from
 * an associated `<label for=...>`, so `getByRole` is not the right primitive
 * for this test — the label association exists at the a11y-check level and
 * is asserted separately in `a11y.test.ts`.
 */

let ct: PlaywrightCTMock;

beforeEach(() => {
  ct = createPlaywrightCTMock();
});

afterEach(() => {
  ct.unmountAll();
});

describe('dogfood-form-ct — input interaction wiring (builders + form submit fan-out)', () => {
  it('T-DFFC-INT-001 login fill(email) + fill(password) → submit fires with typed values', async () => {
    let payload: FormSubmitPayload | null = null;
    const locator = ct.mount(buildLoginForm, {
      formId: 'login-int-1',
      onSubmit: (p) => {
        payload = p;
      },
    });
    // Blank submit first — asserts the required check catches the empty
    // form. Then type into email + password and re-submit.
    await locator.getByRole('button', { name: 'Sign in' }).click();
    expect(payload).toBeNull();

    const emailInput = locator.canvas.querySelector('input#email');
    const passwordInput = locator.canvas.querySelector('input#password');
    expect(emailInput).not.toBeNull();
    expect(passwordInput).not.toBeNull();
    fireEvent(emailInput!, {
      type: 'input',
      target: emailInput!,
      value: 'typed@example.com',
    });
    fireEvent(passwordInput!, {
      type: 'input',
      target: passwordInput!,
      value: 'typed-pw',
    });
    await locator.getByRole('button', { name: 'Sign in' }).click();

    expect(payload).not.toBeNull();
    expect((payload as unknown as FormSubmitPayload).values['email']).toBe(
      'typed@example.com',
    );
    expect((payload as unknown as FormSubmitPayload).values['password']).toBe(
      'typed-pw',
    );
  });

  it('T-DFFC-INT-002 signup blank password fields → onValidationError reports 3 missing', async () => {
    let captured: FormValidationError | null = null;
    const locator = ct.mount(buildSignupForm, {
      formId: 'signup-int-1',
      onValidationError: (err) => {
        captured = err;
      },
    });
    // Fill only email; leave password fields empty. Then click submit.
    const emailInput = locator.canvas.querySelector('input#email');
    expect(emailInput).not.toBeNull();
    fireEvent(emailInput!, {
      type: 'input',
      target: emailInput!,
      value: 'typed@example.com',
    });
    await locator.getByRole('button', { name: 'Sign up' }).click();
    expect(captured).not.toBeNull();
    // password + passwordConfirm + acceptedTerms are all missing at this
    // point. Verifying at least those 3 entries proves the builder's input
    // event wiring did not accidentally toggle other fields.
    const missing = (captured as unknown as FormValidationError).missingFieldIds;
    expect(missing).toContain('password');
    expect(missing).toContain('passwordConfirm');
    expect(missing).toContain('acceptedTerms');
    expect(missing).not.toContain('email');
  });

  it('T-DFFC-INT-003 search fill(query) then submit fires with typed query + default filter', async () => {
    let payload: FormSubmitPayload | null = null;
    const locator = ct.mount(buildSearchForm, {
      formId: 'search-int-1',
      onSubmit: (p) => {
        payload = p;
      },
    });
    // Blank submit first — asserts required check catches empty query.
    await locator.getByRole('button', { name: 'Search' }).click();
    expect(payload).toBeNull();

    const queryInput = locator.canvas.querySelector('input#query');
    expect(queryInput).not.toBeNull();
    fireEvent(queryInput!, {
      type: 'input',
      target: queryInput!,
      value: 'databases',
    });
    await locator.getByRole('button', { name: 'Search' }).click();

    expect(payload).not.toBeNull();
    expect((payload as unknown as FormSubmitPayload).values['query']).toBe(
      'databases',
    );
    // filterCategory default should be 'all' when the user did not touch
    // the select. This asserts the builder's `spec.value ?? spec.options[0]`
    // default flows into the values map on construction.
    expect(
      (payload as unknown as FormSubmitPayload).values['filterCategory'],
    ).toBe('all');
  });

  it('T-DFFC-INT-004 search select onChange updates filterCategory on submit', async () => {
    let payload: FormSubmitPayload | null = null;
    const locator = ct.mount(buildSearchForm, {
      formId: 'search-int-2',
      query: 'default query',
      onSubmit: (p) => {
        payload = p;
      },
    });
    // Change the select via a synthesised input event on the <select> node.
    // The buildSelect wiring listens on the 'input' event to update the
    // shared values Map (same wire the browser uses for user selection).
    const selectNode = locator.canvas.querySelector('select#filterCategory');
    expect(selectNode).not.toBeNull();
    fireEvent(selectNode!, {
      type: 'input',
      target: selectNode!,
      value: 'electronics',
    });
    await locator.getByRole('button', { name: 'Search' }).click();
    expect(payload).not.toBeNull();
    expect(
      (payload as unknown as FormSubmitPayload).values['filterCategory'],
    ).toBe('electronics');
  });

  it('T-DFFC-INT-005 login checkbox toggle updates rememberMe on submit', async () => {
    let payload: FormSubmitPayload | null = null;
    const locator = ct.mount(buildLoginForm, {
      formId: 'login-int-2',
      email: 'ada@example.com',
      password: 'hunter2!',
      onSubmit: (p) => {
        payload = p;
      },
    });
    // Toggle checkbox on via synthesised input event with value='on'.
    // buildCheckbox listens on 'input' and translates the value to a
    // boolean by comparing to 'on' (browser checkbox emit convention).
    const cbNode = locator.canvas.querySelector('input#rememberMe');
    expect(cbNode).not.toBeNull();
    fireEvent(cbNode!, {
      type: 'input',
      target: cbNode!,
      value: 'on',
    });
    await locator.getByRole('button', { name: 'Sign in' }).click();
    expect(payload).not.toBeNull();
    expect(
      (payload as unknown as FormSubmitPayload).values['rememberMe'],
    ).toBe('on');
  });
});
