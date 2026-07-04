<script setup lang="ts">
// RP callback page — the OP redirects the browser here with `?code=&state=`.
// The page defers the token exchange to the server route
// `/api/callback` (which needs the RP client secret + PKCE verifier from the
// server-side session), then bounces to `/?signed_in=1` on success or `/?error=`
// on refusal.

const status = ref<'exchanging' | 'success' | 'error'>('exchanging');
const errorReason = ref<string>('');

onMounted(async () => {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (code === null || state === null) {
    status.value = 'error';
    errorReason.value = 'callback missing code or state';
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
    errorReason.value = err instanceof Error ? err.message : String(err);
  }
});
</script>

<template>
  <main>
    <h1>OIDC callback</h1>
    <p v-if="status === 'exchanging'">Exchanging authorization code for id_token...</p>
    <p v-else-if="status === 'success'">Success — redirecting to home.</p>
    <p v-else>Sign-in failed: {{ errorReason }}</p>
  </main>
</template>
