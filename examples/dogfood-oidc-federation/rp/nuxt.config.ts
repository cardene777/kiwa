// Nuxt 3 Relying Party (RP) config for the dogfood-oidc-federation app.
//
// Sub-Issue v1.21-4c (this state) lands a skeleton: the RP boots + serves
// three pages / two API routes that map onto the OIDC authorization code
// flow — `/authorize` builds the request (state + nonce + PKCE),
// `/callback` receives the code + state, and the server route exchanges the
// code for an id_token + userinfo. Sub-Issue v1.21-4d wires the JWKS
// rotation e2e against this skeleton.
//
// The RP intentionally does not import `@kiwa-test/auth` from within Nuxt
// modules to keep the Nuxt Nitro build hermetic — the OP-side helpers live
// under `../src/lib/*.ts` and the RP consumes them through the shared
// `dogfood-oidc-federation` package boundary at test time.

export default defineNuxtConfig({
  compatibilityDate: '2025-12-01',
  devtools: { enabled: false },
  ssr: true,
  runtimeConfig: {
    // Server-only — the OP issuer + RP client credentials the callback route
    // needs to exchange the code + verify the id_token.
    opIssuer: 'https://op.example.test',
    rpClientId: 'rp-client-42',
    rpClientSecret: '',
    rpRedirectUri: 'http://localhost:3000/callback',
    public: {
      // Client-visible flag — the login button uses this to decide whether
      // to prompt "Sign in with mock OP" vs "Sign in with Keycloak".
      opDisplayName: 'kiwa dogfood OP (mock)',
    },
  },
});
