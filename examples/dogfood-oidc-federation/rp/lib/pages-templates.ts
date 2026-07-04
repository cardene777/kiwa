/**
 * Pure DOM-string renderers for the Nuxt 3 RP pages — mirrors the Vue SFC
 * templates in `pages/index.vue` + `pages/callback.vue`, but returns an HTML
 * string so vitest + jsdom + axe-core can audit accessibility without
 * spinning up the Nuxt runtime.
 *
 * Sub-Issue v1.22-3 (GH #889) uses these to run WCAG 2.1 AA + WAI-ARIA
 * axe-core scans across every visible state of the full login journey —
 * signed-out (initial) / signed-out (with error banner) / signed-in
 * (userinfo panel) / callback exchanging / callback error. The Vue
 * templates must keep the same element structure, ARIA attributes, and
 * heading order as these renderers so the a11y verdict transfers.
 *
 * The renderers are intentionally 1:1 with the SFC's `<template>` block —
 * every semantic tag / label / ARIA attribute the SFC uses is reproduced
 * here character-for-character. Divergence between the two is the
 * regression signal.
 */

// Escape user-facing text so a callback error message cannot break the DOM
// structure the axe scanner expects. Both templates funnel error strings
// through this helper.
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface UserinfoView {
  sub: string;
  name?: string;
  email?: string;
}

export interface IndexRenderInput {
  /** Display name for the OP — surfaced in the H1. */
  opDisplayName: string;
  /** Signed-out / signed-in — drives which panel is visible. */
  state: 'signed-out' | 'signed-in';
  /** Userinfo — required when state === 'signed-in'. */
  userinfo?: UserinfoView;
  /**
   * Error banner text — populated when the callback route bounces back to
   * `/` with `?error=<kind>` after a failed token exchange (three canonical
   * kinds: `invalid_grant` / `expired_token` / `user_cancel`). Empty string
   * hides the banner.
   */
  errorMessage?: string;
}

export type CallbackStatus = 'exchanging' | 'success' | 'error';

export interface CallbackRenderInput {
  status: CallbackStatus;
  /**
   * Structured error reason — populated when status === 'error'. The three
   * canonical kinds map onto human-readable messages:
   *   - invalid_grant  → "The authorization code is no longer valid..."
   *   - expired_token  → "The sign-in link has expired..."
   *   - user_cancel    → "Sign-in was cancelled..."
   *   - other reason   → "Sign-in failed: <reason>" (fallback)
   */
  errorKind?: 'invalid_grant' | 'expired_token' | 'user_cancel' | 'other';
  /** Free-form detail — appended to the error kind's canonical message. */
  errorDetail?: string;
}

const CALLBACK_ERROR_MESSAGES: Record<
  NonNullable<CallbackRenderInput['errorKind']>,
  string
> = {
  invalid_grant:
    'The authorization code is no longer valid. Please sign in again.',
  expired_token: 'The sign-in link has expired. Please sign in again.',
  user_cancel: 'Sign-in was cancelled. You can try again from the home page.',
  other: 'Sign-in failed.',
};

/**
 * Human-readable error banner for the index page — the callback route
 * bounces back with `?error=<kind>` when the token exchange fails. The
 * banner is `role="alert"` so screen readers announce it as it appears.
 */
export function describeIndexError(kind: string): string {
  switch (kind) {
    case 'invalid_grant':
      return 'The authorization code is no longer valid. Please sign in again.';
    case 'expired_token':
      return 'The sign-in link has expired. Please sign in again.';
    case 'user_cancel':
      return 'Sign-in was cancelled. You can try again below.';
    default:
      return 'Sign-in failed. Please try again.';
  }
}

/**
 * Render the index page as a full HTML document — the Vue SFC template
 * mirrors this markup. Structure:
 *
 *   <main aria-labelledby="rp-title">
 *     <h1 id="rp-title">{opDisplayName}</h1>
 *     [role="alert"] error banner (only when errorMessage is truthy)
 *     signed-out panel — heading + button
 *     signed-in panel — heading + dl + logout button
 *
 * WCAG 2.1 AA coverage — the H1 identifies the page, the main landmark is
 * labelled by the H1, the button carries an explicit label, the userinfo
 * <dl> pairs each field with a <dt> label, and the error banner uses
 * `role="alert"` + `aria-live="assertive"` so it surfaces without focus
 * management on the client.
 */
export function renderIndex(input: IndexRenderInput): string {
  const title = escapeHtml(input.opDisplayName);
  const errorBanner =
    input.errorMessage !== undefined && input.errorMessage.length > 0
      ? `<div role="alert" aria-live="assertive" class="error-banner"><p>${escapeHtml(input.errorMessage)}</p></div>`
      : '';

  let panel: string;
  if (input.state === 'signed-out') {
    panel =
      `<section aria-labelledby="signed-out-heading">` +
      `<h2 id="signed-out-heading">Sign in</h2>` +
      `<p>Sign in with the dogfood OpenID Provider.</p>` +
      `<button type="button" id="signin-button" aria-label="Sign in with ${title}">Sign in</button>` +
      `</section>`;
  } else {
    const userinfo = input.userinfo;
    if (userinfo === undefined) {
      throw new Error('renderIndex: signed-in state requires userinfo');
    }
    const sub = escapeHtml(userinfo.sub);
    const name =
      userinfo.name !== undefined && userinfo.name.length > 0
        ? escapeHtml(userinfo.name)
        : '(no name claim)';
    const email =
      userinfo.email !== undefined && userinfo.email.length > 0
        ? escapeHtml(userinfo.email)
        : '(no email claim)';
    panel =
      `<section aria-labelledby="signed-in-heading">` +
      `<h2 id="signed-in-heading">Signed in</h2>` +
      `<p>Signed in as <strong>${sub}</strong></p>` +
      `<dl>` +
      `<dt>Subject</dt><dd>${sub}</dd>` +
      `<dt>Name</dt><dd>${name}</dd>` +
      `<dt>Email</dt><dd>${email}</dd>` +
      `</dl>` +
      `<button type="button" id="signout-button" aria-label="Sign out of the RP session">Sign out</button>` +
      `</section>`;
  }

  return (
    `<!doctype html>` +
    `<html lang="en">` +
    `<head><meta charset="utf-8" /><title>${title}</title></head>` +
    `<body>` +
    `<main aria-labelledby="rp-title">` +
    `<h1 id="rp-title">${title}</h1>` +
    errorBanner +
    panel +
    `</main>` +
    `</body>` +
    `</html>`
  );
}

/**
 * Render the callback page as a full HTML document — the Vue SFC template
 * mirrors this markup. Three status states —
 *
 *   - exchanging → status text with `aria-live="polite"` so screen readers
 *     announce the progress without stealing focus.
 *   - success    → transient success message before the redirect fires.
 *   - error      → `role="alert"` error banner + link back to the home
 *     page so the user has a recovery path.
 *
 * WCAG 2.1 AA coverage — the main landmark is labelled by the H1, the
 * status message region uses live region roles so state changes are
 * announced, and the error banner offers a text-labelled link to the home
 * page.
 */
export function renderCallback(input: CallbackRenderInput): string {
  let body: string;
  if (input.status === 'exchanging') {
    body =
      `<p role="status" aria-live="polite">Exchanging authorization code for id_token...</p>`;
  } else if (input.status === 'success') {
    body = `<p role="status" aria-live="polite">Success — redirecting to home.</p>`;
  } else {
    const kind = input.errorKind ?? 'other';
    const canonical = CALLBACK_ERROR_MESSAGES[kind];
    const detail =
      input.errorDetail !== undefined && input.errorDetail.length > 0
        ? ` ${escapeHtml(input.errorDetail)}`
        : '';
    body =
      `<div role="alert" aria-live="assertive" class="error-banner">` +
      `<p>${escapeHtml(canonical)}${detail}</p>` +
      `<p><a href="/" id="home-link">Return to the home page</a></p>` +
      `</div>`;
  }

  return (
    `<!doctype html>` +
    `<html lang="en">` +
    `<head><meta charset="utf-8" /><title>OIDC callback</title></head>` +
    `<body>` +
    `<main aria-labelledby="callback-title">` +
    `<h1 id="callback-title">OIDC callback</h1>` +
    body +
    `</main>` +
    `</body>` +
    `</html>`
  );
}
