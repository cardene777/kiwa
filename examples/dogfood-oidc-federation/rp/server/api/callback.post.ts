// RP `/callback` endpoint — invoked by the callback page after the OP
// redirects the browser back with `?code=&state=`. The route —
//
//   1. matches `state` against the cookie stored on `/authorize` (CSRF gate);
//   2. exchanges the code for an access_token + id_token via the OP's
//      `/token` endpoint (PKCE `code_verifier` from cookie);
//   3. verifies the id_token via `src/lib/id-token.ts` — enforcing the four
//      fidelity axes (JWS signature, claims, nonce, hash chain);
//   4. calls `/userinfo` with the access_token to fetch the RP's user profile;
//   5. checks the userinfo `sub` against the verified id_token `sub`
//      (OIDC Core §5.3.2);
//   6. stores the userinfo in the RP session so the index page can read it.
//
// Every failure between step 1 and step 5 returns 4xx and stores nothing. The
// verification in step 3 runs against the JWKS the OP publishes, so it holds
// against a real OP and not only the mock.

import type { JwksDocument } from '@kiwa-lab/auth';

import { runCallback } from '../../../src/lib/rp-callback.js';

interface CallbackRequest {
  code: string;
  state: string;
}

interface TokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

interface UserinfoResponse {
  sub: string;
  name?: string;
  email?: string;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const body = await readBody<CallbackRequest>(event);
  const cookieVerifier = getCookie(event, 'rp_code_verifier');

  // The decision logic lives in `runCallback` so a test can execute it; this
  // handler only supplies the I/O and maps the outcome onto an HTTP response.
  const outcome = await runCallback(
    {
      code: body.code,
      state: body.state,
      cookieState: getCookie(event, 'rp_state'),
      cookieNonce: getCookie(event, 'rp_nonce'),
      cookieVerifier,
      issuer: config.opIssuer,
      clientId: config.rpClientId,
    },
    {
      // The JWKS is fetched per callback rather than cached. A stale cache
      // would keep verifying a rotated-away key, which fails open.
      fetchJwks: () => $fetch<JwksDocument>(`${config.opIssuer}/jwks`),
      exchangeCode: () =>
        $fetch<TokenResponse>(`${config.opIssuer}/token`, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: body.code,
            redirect_uri: config.rpRedirectUri,
            client_id: config.rpClientId,
            code_verifier: cookieVerifier ?? '',
          }).toString(),
        }),
      fetchUserinfo: (accessToken: string) =>
        $fetch<UserinfoResponse>(`${config.opIssuer}/userinfo`, {
          headers: { authorization: `Bearer ${accessToken}` },
        }),
    },
  );

  if (!outcome.ok) {
    throw createError({
      statusCode: outcome.status,
      statusMessage: outcome.message,
    });
  }

  const userinfo = outcome.userinfo;

  // Persist userinfo in the RP session so `/api/userinfo` can serve it. The
  // full session-store wiring lands in Sub-Issue v1.21-4d; the skeleton uses
  // a signed cookie to keep the payload small.
  setCookie(event, 'rp_userinfo', JSON.stringify(userinfo), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 3600,
  });

  // Clean up the /authorize cookies so a replayed callback fails the state
  // gate.
  deleteCookie(event, 'rp_state');
  deleteCookie(event, 'rp_nonce');
  deleteCookie(event, 'rp_code_verifier');

  return { ok: true };
});
