<script setup lang="ts">
// RP callback page — the OP redirects the browser here with `?code=&state=`.
// The page defers the token exchange to the server route `/api/callback`,
// then either navigates to `/?signed_in=1` (success) or renders the error
// banner + Return-to-home link.
//
// Sub-Issue v1.22-3 (GH #889) extends the v1.21-4c skeleton with structured
// error states — `invalid_grant` / `expired_token` / `user_cancel` all map
// onto canonical accessible error messages, plus a fallback path for any
// other reason. The template markup is 1:1 with the DOM string
// `renderCallback` in `rp/lib/pages-templates.ts` produces so the a11y
// verdict from the vitest spec transfers.

type CallbackErrorKind =
  | 'invalid_grant'
  | 'expired_token'
  | 'user_cancel'
  | 'other';

const status = ref<'exchanging' | 'success' | 'error'>('exchanging');
const errorKind = ref<CallbackErrorKind>('other');
const errorDetail = ref<string>('');

const errorMessage = computed<string>(() => {
  switch (errorKind.value) {
    case 'invalid_grant':
      return 'The authorization code is no longer valid. Please sign in again.';
    case 'expired_token':
      return 'The sign-in link has expired. Please sign in again.';
    case 'user_cancel':
      return 'Sign-in was cancelled. You can try again from the home page.';
    default:
      return 'Sign-in failed.';
  }
});

// Narrow a free-form reason string to one of the canonical error kinds so
// the template picks a stable canonical message. Falls back to `other` so
// unknown reasons still render an accessible banner.
function classifyReason(reason: string): CallbackErrorKind {
  const lower = reason.toLowerCase();
  if (lower.includes('invalid_grant')) return 'invalid_grant';
  if (lower.includes('expired')) return 'expired_token';
  if (lower.includes('cancel')) return 'user_cancel';
  return 'other';
}

onMounted(async () => {
  const url = new URL(window.location.href);
  const opError = url.searchParams.get('error');
  if (opError !== null && opError.length > 0) {
    // The OP itself rejected the request — no code + state to exchange.
    // Common values (RFC 6749 §4.1.2.1): `access_denied` (user cancel),
    // `invalid_request`, `unauthorized_client`. Map onto the RP error kinds.
    status.value = 'error';
    if (opError === 'access_denied') {
      errorKind.value = 'user_cancel';
    } else {
      errorKind.value = classifyReason(opError);
    }
    errorDetail.value = url.searchParams.get('error_description') ?? '';
    return;
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (code === null || state === null) {
    status.value = 'error';
    errorKind.value = 'other';
    errorDetail.value = 'The callback URL is missing the code or state parameter.';
    return;
  }

  try {
    await $fetch('/api/callback', {
      method: 'POST',
      body: { code, state },
    });
    status.value = 'success';
    await navigateTo('/?signed_in=1');
  } catch (err) {
    status.value = 'error';
    const reason = err instanceof Error ? err.message : String(err);
    errorKind.value = classifyReason(reason);
    errorDetail.value = reason;
  }
});
</script>

<template>
  <main aria-labelledby="callback-title">
    <h1 id="callback-title">OIDC callback</h1>
    <p v-if="status === 'exchanging'" role="status" aria-live="polite">
      Exchanging authorization code for id_token...
    </p>
    <p v-else-if="status === 'success'" role="status" aria-live="polite">
      Success — redirecting to home.
    </p>
    <div v-else role="alert" aria-live="assertive" class="error-banner">
      <p>{{ errorMessage }}{{ errorDetail ? ` ${errorDetail}` : '' }}</p>
      <p><a href="/" id="home-link">Return to the home page</a></p>
    </div>
  </main>
</template>
