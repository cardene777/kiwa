<script setup lang="ts">
// RP index page — surfaces the full OIDC login journey UI: signed-out
// panel with a sign-in button, signed-in panel with the userinfo <dl> and a
// sign-out button, plus a `role="alert"` error banner when the callback
// route bounces back with `?error=<kind>`.
//
// Sub-Issue v1.22-3 (GH #889) escalates the v1.21-4c skeleton into a full
// journey. The template markup is intentionally 1:1 with the DOM string
// `renderIndex` in `rp/lib/pages-templates.ts` produces — the a11y test
// spec asserts on that renderer + the Vue SFC must stay in lock-step so
// the WCAG 2.1 AA verdict transfers.
//
// The client:
//   1. On mount, checks the URL for `?signed_in=1` (callback success) or
//      `?error=<kind>` (callback failure) and hydrates the panel state.
//   2. On sign-in click, fetches `/api/authorize` for the OP authorization
//      URL and redirects the browser to it.
//   3. On sign-out click, POSTs `/api/logout` to drop the RP session
//      cookie + flips the panel back to signed-out.

import { describeIndexError } from '../lib/pages-templates.js';

interface UserinfoResponse {
  sub: string;
  name?: string;
  email?: string;
}

const config = useRuntimeConfig();
const state = ref<'signed-out' | 'signed-in'>('signed-out');
const userinfo = ref<UserinfoResponse | null>(null);
const errorMessage = ref<string>('');

async function signIn(): Promise<void> {
  errorMessage.value = '';
  const target = await $fetch<{ authorizeUrl: string }>('/api/authorize');
  window.location.href = target.authorizeUrl;
}

async function signOut(): Promise<void> {
  await $fetch('/api/logout', { method: 'POST' });
  userinfo.value = null;
  state.value = 'signed-out';
  errorMessage.value = '';
  // Strip `?signed_in=1` from the URL so a page refresh does not re-trigger
  // the signed-in hydration path.
  const url = new URL(window.location.href);
  url.searchParams.delete('signed_in');
  window.history.replaceState({}, '', url.toString());
}

onMounted(async () => {
  const url = new URL(window.location.href);
  const errorParam = url.searchParams.get('error');
  if (errorParam !== null && errorParam.length > 0) {
    errorMessage.value = describeIndexError(errorParam);
    // Strip the query so a refresh does not re-surface the banner.
    url.searchParams.delete('error');
    window.history.replaceState({}, '', url.toString());
    return;
  }
  if (url.searchParams.get('signed_in') === '1') {
    try {
      const info = await $fetch<UserinfoResponse>('/api/userinfo');
      userinfo.value = info;
      state.value = 'signed-in';
    } catch {
      // Silent — a stale `?signed_in=1` from a bookmark can trip this. Flip
      // back to signed-out; the sign-in button re-drives the flow.
      state.value = 'signed-out';
    }
  }
});
</script>

<template>
  <main aria-labelledby="rp-title">
    <h1 id="rp-title">{{ config.public.opDisplayName }}</h1>
    <div
      v-if="errorMessage.length > 0"
      role="alert"
      aria-live="assertive"
      class="error-banner"
    >
      <p>{{ errorMessage }}</p>
    </div>
    <section v-if="state === 'signed-out'" aria-labelledby="signed-out-heading">
      <h2 id="signed-out-heading">Sign in</h2>
      <p>Sign in with the dogfood OpenID Provider.</p>
      <button
        type="button"
        id="signin-button"
        :aria-label="`Sign in with ${config.public.opDisplayName}`"
        @click="signIn"
      >
        Sign in
      </button>
    </section>
    <section v-else aria-labelledby="signed-in-heading">
      <h2 id="signed-in-heading">Signed in</h2>
      <p>Signed in as <strong>{{ userinfo?.sub }}</strong></p>
      <dl v-if="userinfo">
        <dt>Subject</dt>
        <dd>{{ userinfo.sub }}</dd>
        <dt>Name</dt>
        <dd>{{ userinfo.name ?? '(no name claim)' }}</dd>
        <dt>Email</dt>
        <dd>{{ userinfo.email ?? '(no email claim)' }}</dd>
      </dl>
      <button
        type="button"
        id="signout-button"
        aria-label="Sign out of the RP session"
        @click="signOut"
      >
        Sign out
      </button>
    </section>
  </main>
</template>
