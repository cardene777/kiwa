/**
 * @vitest-environment jsdom
 *
 * Sub-Issue v1.22-3 (GH #889) — Nuxt 3 RP full-flow a11y gate.
 *
 * Runs axe-core (WCAG 2.1 AA + WAI-ARIA authoring practice, the two default
 * best-practice tag sets) against every visible state of the Nuxt 3 RP
 * pages. The Vue SFCs in `rp/pages/*.vue` are 1:1 with the DOM string
 * `rp/lib/pages-templates.ts` produces — the a11y verdict transfers as
 * long as that pairing holds. A separate regression spec in
 * `rp-vue-template-parity.spec.ts` would guard the pairing; here we
 * assert on the renderer directly.
 *
 * Coverage — the login journey has five visible states:
 *
 *   1. `/` signed-out — heading + sign-in button + no error banner.
 *   2. `/` signed-out with error — heading + sign-in button + `role="alert"`
 *      error banner (three canonical kinds: invalid_grant / expired_token /
 *      user_cancel).
 *   3. `/` signed-in — heading + userinfo <dl> + sign-out button.
 *   4. `/callback` exchanging — heading + `role="status"` live region.
 *   5. `/callback` error — heading + `role="alert"` banner + Return-to-home
 *      link (three canonical error kinds).
 *
 * Every state must exit axe with zero violations at impact >= minor
 * (WCAG 2.1 AA lower bound).
 */

import { describe, expect, it } from 'vitest';
import { expectNoViolations, runAxe } from '@kiwa/a11y';
import {
  describeIndexError,
  escapeHtml,
  renderCallback,
  renderIndex,
} from '../rp/lib/pages-templates.js';

// axe-core ruleset — the four WCAG 2.1 A/AA tag sets + WAI-ARIA best-practice.
// The color-contrast rule needs a real canvas backend, which jsdom does not
// implement (Chromium is the intended runtime for a real deployment). We
// disable it here so the noise does not drown out the actual violations;
// the fidelity report calls out contrast as a Playwright-native gate that
// runs in browser env when the RP CI has one available.
const AXE_OPTIONS = {
  runOptions: {
    runOnly: {
      type: 'tag' as const,
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
    },
    rules: {
      'color-contrast': { enabled: false },
    },
  },
};

/**
 * Load a full HTML document into jsdom and return the <main> element as the
 * axe scan context. axe-core exercises the ancestor axes (landmark rules,
 * region rules, etc.) when it scans the whole document; the scoped scan
 * gives us the same coverage as loading each page in a real browser tab.
 */
function loadIntoJsdom(html: string): Element {
  // Replace the whole document. Using document.open()/write() keeps the
  // jsdom parser in sync so subsequent DOM queries see the new tree.
  document.open();
  document.write(html);
  document.close();
  const main = document.querySelector('main');
  if (main === null) {
    throw new Error('loadIntoJsdom: rendered HTML missing <main> landmark');
  }
  return main;
}

describe('escapeHtml — DOM safety', () => {
  it('escapes ampersand + angle brackets + quotes so injected reason strings cannot break the DOM', () => {
    const raw = `<script>alert("x&y")</script>'`;
    const escaped = escapeHtml(raw);
    expect(escaped).toBe(
      '&lt;script&gt;alert(&quot;x&amp;y&quot;)&lt;/script&gt;&#39;',
    );
  });

  it('leaves plain-text alphanumeric strings untouched', () => {
    expect(escapeHtml('hello world 42')).toBe('hello world 42');
  });
});

describe('describeIndexError — canonical error banner messages', () => {
  it('surfaces a canonical message for invalid_grant', () => {
    expect(describeIndexError('invalid_grant')).toMatch(/no longer valid/i);
  });

  it('surfaces a canonical message for expired_token', () => {
    expect(describeIndexError('expired_token')).toMatch(/expired/i);
  });

  it('surfaces a canonical message for user_cancel', () => {
    expect(describeIndexError('user_cancel')).toMatch(/cancelled/i);
  });

  it('falls back to a generic message for unknown kinds', () => {
    expect(describeIndexError('bogus_reason')).toMatch(/failed/i);
  });
});

describe('renderIndex — DOM structure', () => {
  it('renders the H1 identifying the OP + the main landmark labelled by it', () => {
    const html = renderIndex({
      opDisplayName: 'kiwa dogfood OP',
      state: 'signed-out',
    });
    const main = loadIntoJsdom(html);
    const h1 = document.getElementById('rp-title');
    expect(h1).not.toBeNull();
    expect(h1?.textContent).toBe('kiwa dogfood OP');
    expect(main.getAttribute('aria-labelledby')).toBe('rp-title');
  });

  it('renders the sign-in button with an accessible name that includes the OP display name', () => {
    const html = renderIndex({
      opDisplayName: 'kiwa dogfood OP',
      state: 'signed-out',
    });
    loadIntoJsdom(html);
    const button = document.getElementById('signin-button');
    expect(button).not.toBeNull();
    expect(button?.getAttribute('type')).toBe('button');
    expect(button?.getAttribute('aria-label')).toBe(
      'Sign in with kiwa dogfood OP',
    );
  });

  it('renders the error banner with role=alert + aria-live=assertive when errorMessage is present', () => {
    const html = renderIndex({
      opDisplayName: 'kiwa dogfood OP',
      state: 'signed-out',
      errorMessage: 'The authorization code is no longer valid.',
    });
    loadIntoJsdom(html);
    const alert = document.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert?.getAttribute('aria-live')).toBe('assertive');
    expect(alert?.textContent).toMatch(/no longer valid/);
  });

  it('hides the error banner when errorMessage is undefined', () => {
    const html = renderIndex({
      opDisplayName: 'kiwa dogfood OP',
      state: 'signed-out',
    });
    loadIntoJsdom(html);
    expect(document.querySelector('[role="alert"]')).toBeNull();
  });

  it('hides the error banner when errorMessage is the empty string', () => {
    const html = renderIndex({
      opDisplayName: 'kiwa dogfood OP',
      state: 'signed-out',
      errorMessage: '',
    });
    loadIntoJsdom(html);
    expect(document.querySelector('[role="alert"]')).toBeNull();
  });

  it('renders the signed-in userinfo <dl> with paired <dt>/<dd> for sub / name / email', () => {
    const html = renderIndex({
      opDisplayName: 'kiwa dogfood OP',
      state: 'signed-in',
      userinfo: { sub: 'user-42', name: 'Alice', email: 'alice@example.test' },
    });
    loadIntoJsdom(html);
    const dts = Array.from(document.querySelectorAll('dt')).map(
      (n) => n.textContent,
    );
    const dds = Array.from(document.querySelectorAll('dd')).map(
      (n) => n.textContent,
    );
    expect(dts).toEqual(['Subject', 'Name', 'Email']);
    expect(dds).toEqual(['user-42', 'Alice', 'alice@example.test']);
  });

  it('renders the sign-out button with an accessible label describing the action', () => {
    const html = renderIndex({
      opDisplayName: 'kiwa dogfood OP',
      state: 'signed-in',
      userinfo: { sub: 'user-42' },
    });
    loadIntoJsdom(html);
    const button = document.getElementById('signout-button');
    expect(button).not.toBeNull();
    expect(button?.getAttribute('type')).toBe('button');
    expect(button?.getAttribute('aria-label')).toBe(
      'Sign out of the RP session',
    );
  });

  it('substitutes the "no name claim" / "no email claim" placeholders when the claim is absent', () => {
    const html = renderIndex({
      opDisplayName: 'kiwa dogfood OP',
      state: 'signed-in',
      userinfo: { sub: 'user-42' },
    });
    loadIntoJsdom(html);
    const dds = Array.from(document.querySelectorAll('dd')).map(
      (n) => n.textContent,
    );
    expect(dds[1]).toBe('(no name claim)');
    expect(dds[2]).toBe('(no email claim)');
  });

  it('throws when the signed-in state is asked for without userinfo (developer error)', () => {
    expect(() =>
      renderIndex({ opDisplayName: 'kiwa dogfood OP', state: 'signed-in' }),
    ).toThrow(/userinfo/);
  });
});

describe('renderCallback — DOM structure', () => {
  it('renders the H1 + main landmark labelled by it', () => {
    const html = renderCallback({ status: 'exchanging' });
    const main = loadIntoJsdom(html);
    expect(main.getAttribute('aria-labelledby')).toBe('callback-title');
    expect(document.getElementById('callback-title')?.textContent).toBe(
      'OIDC callback',
    );
  });

  it('renders the exchanging status with role=status + aria-live=polite', () => {
    const html = renderCallback({ status: 'exchanging' });
    loadIntoJsdom(html);
    const status = document.querySelector('[role="status"]');
    expect(status).not.toBeNull();
    expect(status?.getAttribute('aria-live')).toBe('polite');
    expect(status?.textContent).toMatch(/Exchanging/);
  });

  it('renders the success status with role=status + aria-live=polite', () => {
    const html = renderCallback({ status: 'success' });
    loadIntoJsdom(html);
    const status = document.querySelector('[role="status"]');
    expect(status).not.toBeNull();
    expect(status?.textContent).toMatch(/Success/);
  });

  it('renders the error banner with role=alert + aria-live=assertive + Return-to-home link', () => {
    const html = renderCallback({ status: 'error', errorKind: 'invalid_grant' });
    loadIntoJsdom(html);
    const alert = document.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert?.getAttribute('aria-live')).toBe('assertive');
    const link = document.getElementById('home-link');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toBe('/');
    expect(link?.textContent).toBe('Return to the home page');
  });

  it('surfaces canonical messages for each error kind', () => {
    for (const kind of ['invalid_grant', 'expired_token', 'user_cancel'] as const) {
      const html = renderCallback({ status: 'error', errorKind: kind });
      loadIntoJsdom(html);
      const alert = document.querySelector('[role="alert"]');
      expect(alert).not.toBeNull();
      const text = alert?.textContent ?? '';
      if (kind === 'invalid_grant') expect(text).toMatch(/no longer valid/);
      if (kind === 'expired_token') expect(text).toMatch(/expired/);
      if (kind === 'user_cancel') expect(text).toMatch(/cancelled/);
    }
  });

  it('appends an optional errorDetail after the canonical message', () => {
    const html = renderCallback({
      status: 'error',
      errorKind: 'invalid_grant',
      errorDetail: 'server said no',
    });
    loadIntoJsdom(html);
    const alert = document.querySelector('[role="alert"]');
    expect(alert?.textContent).toMatch(/no longer valid.*server said no/);
  });

  it('renders the "other" fallback error kind with a generic message', () => {
    const html = renderCallback({ status: 'error', errorKind: 'other' });
    loadIntoJsdom(html);
    const alert = document.querySelector('[role="alert"]');
    expect(alert?.textContent).toMatch(/Sign-in failed/);
  });
});

describe('axe-core — WCAG 2.1 AA a11y verdict', () => {
  it('signed-out index page passes axe (no error banner)', async () => {
    const html = renderIndex({
      opDisplayName: 'kiwa dogfood OP',
      state: 'signed-out',
    });
    loadIntoJsdom(html);
    const results = await runAxe(AXE_OPTIONS);
    expectNoViolations(
      results,
      expect as unknown as Parameters<typeof expectNoViolations>[1],
      { maxImpact: 'minor' },
    );
  });

  it('signed-out index page with invalid_grant error banner passes axe', async () => {
    const html = renderIndex({
      opDisplayName: 'kiwa dogfood OP',
      state: 'signed-out',
      errorMessage: describeIndexError('invalid_grant'),
    });
    loadIntoJsdom(html);
    const results = await runAxe(AXE_OPTIONS);
    expectNoViolations(
      results,
      expect as unknown as Parameters<typeof expectNoViolations>[1],
      { maxImpact: 'minor' },
    );
  });

  it('signed-out index page with expired_token error banner passes axe', async () => {
    const html = renderIndex({
      opDisplayName: 'kiwa dogfood OP',
      state: 'signed-out',
      errorMessage: describeIndexError('expired_token'),
    });
    loadIntoJsdom(html);
    const results = await runAxe(AXE_OPTIONS);
    expectNoViolations(
      results,
      expect as unknown as Parameters<typeof expectNoViolations>[1],
      { maxImpact: 'minor' },
    );
  });

  it('signed-out index page with user_cancel error banner passes axe', async () => {
    const html = renderIndex({
      opDisplayName: 'kiwa dogfood OP',
      state: 'signed-out',
      errorMessage: describeIndexError('user_cancel'),
    });
    loadIntoJsdom(html);
    const results = await runAxe(AXE_OPTIONS);
    expectNoViolations(
      results,
      expect as unknown as Parameters<typeof expectNoViolations>[1],
      { maxImpact: 'minor' },
    );
  });

  it('signed-in index page passes axe (userinfo panel with all claims)', async () => {
    const html = renderIndex({
      opDisplayName: 'kiwa dogfood OP',
      state: 'signed-in',
      userinfo: {
        sub: 'user-42',
        name: 'Alice',
        email: 'alice@example.test',
      },
    });
    loadIntoJsdom(html);
    const results = await runAxe(AXE_OPTIONS);
    expectNoViolations(
      results,
      expect as unknown as Parameters<typeof expectNoViolations>[1],
      { maxImpact: 'minor' },
    );
  });

  it('signed-in index page passes axe (userinfo panel with only sub claim)', async () => {
    const html = renderIndex({
      opDisplayName: 'kiwa dogfood OP',
      state: 'signed-in',
      userinfo: { sub: 'user-42' },
    });
    loadIntoJsdom(html);
    const results = await runAxe(AXE_OPTIONS);
    expectNoViolations(
      results,
      expect as unknown as Parameters<typeof expectNoViolations>[1],
      { maxImpact: 'minor' },
    );
  });

  it('callback exchanging page passes axe (live status region)', async () => {
    const html = renderCallback({ status: 'exchanging' });
    loadIntoJsdom(html);
    const results = await runAxe(AXE_OPTIONS);
    expectNoViolations(
      results,
      expect as unknown as Parameters<typeof expectNoViolations>[1],
      { maxImpact: 'minor' },
    );
  });

  it('callback success page passes axe (transient success message)', async () => {
    const html = renderCallback({ status: 'success' });
    loadIntoJsdom(html);
    const results = await runAxe(AXE_OPTIONS);
    expectNoViolations(
      results,
      expect as unknown as Parameters<typeof expectNoViolations>[1],
      { maxImpact: 'minor' },
    );
  });

  it('callback error page (invalid_grant) passes axe', async () => {
    const html = renderCallback({ status: 'error', errorKind: 'invalid_grant' });
    loadIntoJsdom(html);
    const results = await runAxe(AXE_OPTIONS);
    expectNoViolations(
      results,
      expect as unknown as Parameters<typeof expectNoViolations>[1],
      { maxImpact: 'minor' },
    );
  });

  it('callback error page (expired_token) passes axe', async () => {
    const html = renderCallback({ status: 'error', errorKind: 'expired_token' });
    loadIntoJsdom(html);
    const results = await runAxe(AXE_OPTIONS);
    expectNoViolations(
      results,
      expect as unknown as Parameters<typeof expectNoViolations>[1],
      { maxImpact: 'minor' },
    );
  });

  it('callback error page (user_cancel) passes axe', async () => {
    const html = renderCallback({ status: 'error', errorKind: 'user_cancel' });
    loadIntoJsdom(html);
    const results = await runAxe(AXE_OPTIONS);
    expectNoViolations(
      results,
      expect as unknown as Parameters<typeof expectNoViolations>[1],
      { maxImpact: 'minor' },
    );
  });

  it('callback error page (other / fallback) passes axe', async () => {
    const html = renderCallback({
      status: 'error',
      errorKind: 'other',
      errorDetail: 'network refused',
    });
    loadIntoJsdom(html);
    const results = await runAxe(AXE_OPTIONS);
    expectNoViolations(
      results,
      expect as unknown as Parameters<typeof expectNoViolations>[1],
      { maxImpact: 'minor' },
    );
  });
});
