<script setup lang="ts">
// RP index page — surfaces a "Sign in" button that walks the user through the
// OIDC authorization code flow. Sub-Issue v1.21-4c (this state) wires the
// button + userinfo panel; the authorize + callback plumbing lives under
// `server/api/`.

const config = useRuntimeConfig();
const state = ref<'signed-out' | 'signed-in'>('signed-out');
const userinfo = ref<{ sub: string; name?: string; email?: string } | null>(null);

async function signIn(): Promise<void> {
  // The server route builds the full authorization URL (issuer + state +
  // nonce + PKCE challenge). The RP redirects the browser to it; the OP
  // bounces back to `/callback` with `code + state`.
  const target = await $fetch<{ authorizeUrl: string }>('/api/authorize');
  window.location.href = target.authorizeUrl;
}

// Bootstrap — if the page loads with `?signed_in=1` (set by the callback
// route after a successful token exchange), fetch the userinfo the callback
// stored in the RP session and flip the UI into signed-in state.
onMounted(async () => {
  const url = new URL(window.location.href);
  if (url.searchParams.get('signed_in') === '1') {
    try {
      const info = await $fetch<{ sub: string; name?: string; email?: string }>(
        '/api/userinfo',
      );
      userinfo.value = info;
      state.value = 'signed-in';
    } catch {
      // Silent — the userinfo lookup can fail if the session expired.
      state.value = 'signed-out';
    }
  }
});
</script>

<template>
  <main>
    <h1>{{ config.public.opDisplayName }}</h1>
    <section v-if="state === 'signed-out'">
      <p>Sign in with the dogfood OpenID Provider.</p>
      <button type="button" @click="signIn">Sign in</button>
    </section>
    <section v-else>
      <p>Signed in as <strong>{{ userinfo?.sub }}</strong></p>
      <dl v-if="userinfo">
        <dt>name</dt>
        <dd>{{ userinfo.name ?? '(no name claim)' }}</dd>
        <dt>email</dt>
        <dd>{{ userinfo.email ?? '(no email claim)' }}</dd>
      </dl>
    </section>
  </main>
</template>
