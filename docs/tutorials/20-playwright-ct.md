# Playwright CT for 5 form patterns in 12 min

## What you'll build

A vitest test file that drives **5 SaaS form patterns** (login / signup / checkout / profile / search) through the `@kiwa-lab/component` Playwright Component Testing mock. Each form runs the 3-tuple that real Playwright CT enforces — `mount(render, args) → locator`, `getByRole('button', { name }).click()`, `expect(await locator.getByRole(...).textContent()).toBe(...)`. The mock runs in-process (no browser), tracks `activeMounts()` for leak detection, and matches the Playwright API 1:1 so the same test file works against a real driver later.

## Prerequisites

- Node.js ≥ 20 on your PATH
- `pnpm` (npm works too)
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-form-ct && cd kiwa-form-ct
pnpm init -y
pnpm add -D vitest typescript @types/node @kiwa-lab/component
```

Set `type: module` + test script in `package.json`:

```json
{
  "type": "module",
  "scripts": { "test": "vitest run" }
}
```

Add `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "es2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node", "vitest/globals"]
  }
}
```

Create `src/forms.ts` — 5 forms via the built-in `buildForm` fixture:

```ts
import { buildForm } from '@kiwa-lab/component';
import type { FormArgs } from '@kiwa-lab/component';

export const loginForm: FormArgs = {
  title: 'Sign in',
  fields: [
    { id: 'email', label: 'Email', type: 'email', required: true },
    { id: 'password', label: 'Password', type: 'password', required: true },
  ],
  submitLabel: 'Sign in',
};

export const signupForm: FormArgs = {
  title: 'Create account',
  fields: [
    { id: 'email', label: 'Email', type: 'email', required: true },
    { id: 'password', label: 'Password', type: 'password', required: true },
    { id: 'passwordConfirm', label: 'Confirm password', type: 'password', required: true },
  ],
  submitLabel: 'Create account',
};

export const checkoutForm: FormArgs = {
  title: 'Checkout',
  fields: [
    { id: 'fullName', label: 'Full name', required: true },
    { id: 'address', label: 'Address', required: true },
    { id: 'city', label: 'City', required: true },
    { id: 'postalCode', label: 'Postal code', required: true },
    { id: 'cardNumber', label: 'Card number', required: true },
  ],
  submitLabel: 'Pay',
};

export const profileForm: FormArgs = {
  title: 'Edit profile',
  fields: [
    { id: 'displayName', label: 'Display name', required: true },
    { id: 'bio', label: 'Bio' },
    { id: 'websiteUrl', label: 'Website' },
  ],
  submitLabel: 'Save',
};

export const searchForm: FormArgs = {
  title: 'Search',
  fields: [
    { id: 'query', label: 'Query', required: true },
    { id: 'filterCategory', label: 'Category' },
  ],
  submitLabel: 'Search',
};

export { buildForm };
```

## Test — mount + validation + submit + a11y (5 forms × 4 axes)

Create `tests/forms.test.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest';
import {
  createPlaywrightCTMock,
  fireEvent,
} from '@kiwa-lab/component';
import {
  buildForm,
  checkoutForm,
  loginForm,
  profileForm,
  searchForm,
  signupForm,
} from '../src/forms';

const ct = createPlaywrightCTMock();

afterEach(() => {
  ct.unmountAll();
});

describe('Playwright CT — 5 form patterns × 4 axes', () => {
  it('login — mount + fill + submit fires onSubmit with the 2 required fields', async () => {
    const submitted: Array<Record<string, string>> = [];
    const locator = ct.mount(buildForm, {
      ...loginForm,
      onSubmit: (data) => submitted.push(data),
    });

    // Mount axis — the submit button is present with the expected accessible name
    const submit = locator.getByRole('button', { name: 'Sign in' });
    expect(await submit.textContent()).toBe('Sign in');

    // Validation axis — click without filling anything, nothing submitted
    await submit.click();
    expect(submitted).toEqual([]);

    // Fill axis — populate both required fields
    const emailInput = locator.canvas.querySelector('input[name="email"]')!;
    fireEvent(emailInput, {
      type: 'input',
      target: emailInput,
      value: 'ada@example.com',
    });
    const passwordInput = locator.canvas.querySelector('input[name="password"]')!;
    fireEvent(passwordInput, {
      type: 'input',
      target: passwordInput,
      value: 'hunter2!',
    });

    // Submit axis — now the form fires onSubmit with the 2 required fields
    await submit.click();
    expect(submitted).toHaveLength(1);
    expect(submitted[0]).toMatchObject({
      email: 'ada@example.com',
      password: 'hunter2!',
    });
  });

  it('signup — validation stops submit when passwordConfirm is missing', async () => {
    const submitted: Array<Record<string, string>> = [];
    const locator = ct.mount(buildForm, {
      ...signupForm,
      onSubmit: (data) => submitted.push(data),
    });

    // fill email + password but not confirm
    const fill = (name: string, value: string) => {
      const node = locator.canvas.querySelector(`input[name="${name}"]`)!;
      fireEvent(node, { type: 'input', target: node, value });
    };
    fill('email', 'ada@example.com');
    fill('password', 'hunter2!');

    const submit = locator.getByRole('button', { name: 'Create account' });
    await submit.click();
    expect(submitted).toEqual([]); // validation blocked

    fill('passwordConfirm', 'hunter2!');
    await submit.click();
    expect(submitted).toHaveLength(1); // now it goes through
  });

  it('checkout — mounts 5 fields + submits when all populated', async () => {
    const submitted: Array<Record<string, string>> = [];
    const locator = ct.mount(buildForm, {
      ...checkoutForm,
      onSubmit: (data) => submitted.push(data),
    });

    const inputs = locator.canvas.querySelectorAll('input');
    expect(inputs).toHaveLength(5);

    for (const field of checkoutForm.fields) {
      const node = locator.canvas.querySelector(`input[name="${field.id}"]`)!;
      fireEvent(node, { type: 'input', target: node, value: `x-${field.id}` });
    }
    await locator.getByRole('button', { name: 'Pay' }).click();
    expect(submitted).toHaveLength(1);
    expect(Object.keys(submitted[0])).toHaveLength(5);
  });

  it('profile — only displayName is required; the 2 optional fields can be blank', async () => {
    const submitted: Array<Record<string, string>> = [];
    const locator = ct.mount(buildForm, {
      ...profileForm,
      onSubmit: (data) => submitted.push(data),
    });

    const displayName = locator.canvas.querySelector('input[name="displayName"]')!;
    fireEvent(displayName, { type: 'input', target: displayName, value: 'Ada' });
    await locator.getByRole('button', { name: 'Save' }).click();
    expect(submitted).toHaveLength(1);
    expect(submitted[0].displayName).toBe('Ada');
    expect(submitted[0].bio).toBe('');
    expect(submitted[0].websiteUrl).toBe('');
  });

  it('search — leak detection catches an unmounted form', async () => {
    const before = ct.activeMounts();
    ct.mount(buildForm, searchForm);
    expect(ct.activeMounts()).toBe(before + 1);
    // afterEach's unmountAll() will drain — a real test would call locator.unmount()
  });
});
```

## Run it

```bash
pnpm test
```

You should see 5 passing tests. If a form skips validation, `submitted` stays empty; if fill wires up correctly, `submitted[0]` carries the populated field map. `activeMounts()` is the leak counter — call `locator.unmount()` in your own `afterEach` (or let `unmountAll()` drain like this tutorial does).

## The 4-op CT surface

The mock's `PlaywrightCTMock` interface exposes exactly what real Playwright CT exposes at the mount boundary.

1. `mount(render, args)` — render into an in-memory canvas, return a `ComponentLocator` with `getByRole` / `getByText` / `unmount`
2. `getByRole(role, { name })` — return a `NodeLocator` with `click()` / `fill(value)` / `textContent()` / `count()`
3. `click()` — fires the click handler bound at render time via `fireEvent`
4. `unmount()` — clears event handlers and removes the mount from `activeMounts()`

The `NodeLocator` methods are all async (return `Promise<void>` / `Promise<string | null>`), matching real Playwright — you always `await` them.

## What the mock does not model

The mock does not open a browser, so it does not run.

- **CSS layout** — flexbox / grid positioning is not computed. A component that visually breaks its layout under a Tailwind config change is not caught by the mock; the fidelity harness catches it via the Chromatic markup hash.
- **Network intercepts** — `page.route()` and `page.fulfill()` are not modelled. Use `@kiwa-lab/msw` or a dedicated network mock for XHR / fetch intercepts.
- **Keyboard focus traversal** — `Tab` / `Shift+Tab` cycles are not simulated. A11y checks are heuristic only (button-name / image-alt / label).

Real Playwright CT covers all 3 through Chromium. Set `PW_CT_ENDPOINT` when running the v1.16-3 dogfood app to promote the report from mock-only to real vs mock.

## Next steps — real Playwright CT adapter

The v1.16-3 dogfood app (`examples/dogfood-form-ct/`) ships a `makeRealAdapter()` that env-gates on `PW_CT_ENDPOINT`. When the env var is set, the fidelity harness runs the same 5-form × 4-axis matrix through real `@playwright/experimental-ct-react` and produces a `runFidelityCheck` report.

```bash
PW_CT_ENDPOINT=http://localhost:3100 pnpm --filter dogfood-form-ct test
```

## Related

- [Tutorial 19 — Storybook 8 design system in 12 min](./19-storybook-design-system)
- [Tutorial 21 — Visual regression baseline / diff / accept in 12 min](./21-visual-regression)
- [Concept — Component testing (story + CT + visual diff)](../concepts/component-testing)
- [Migration guide — v1.15 → v1.16](../migrations/v1.15-to-v1.16)
- v1.16 milestone parent [#762](https://github.com/cardene777/kiwa/issues/762), sub-issues [#765](https://github.com/cardene777/kiwa/issues/765) / [#767](https://github.com/cardene777/kiwa/issues/767)
