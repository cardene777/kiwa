// RP `/callback` endpoint — invoked by the callback page after the OP
// redirects the browser back with `?code=&state=`. The route —
//
//   1. matches `state` against the cookie stored on `/authorize` (CSRF gate);
//   2. exchanges the code for an access_token + id_token via the OP's
//      `/token` endpoint (PKCE `code_verifier` from cookie);
//   3. verifies the id_token via `src/lib/id-token.ts` — enforcing the four
//      fidelity axes (JWS signature, claims, nonce, hash chain);
//   4. calls `/userinfo` with the access_token to fetch the RP's user profile;
//   5. stores the userinfo in the RP session so the index page can read it.
//
// Sub-Issue v1.21-4c (this state) lands the skeleton wiring — the routes are
// typed + serialize the right envelope shapes, but the id_token verification
// is deferred to Sub-Issue v1.21-4d which wires the JWKS discovery + rotation
// e2e against a running OP.

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

  if (typeof body.code !== 'string' || typeof body.state !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'callback body missing code or state',
    });
  }

  const cookieState = getCookie(event, 'rp_state');
  const cookieNonce = getCookie(event, 'rp_nonce');
  const cookieVerifier = getCookie(event, 'rp_code_verifier');
  if (cookieState === undefined || cookieState !== body.state) {
    throw createError({
      statusCode: 400,
      statusMessage: 'state mismatch (CSRF gate)',
    });
  }
  if (cookieVerifier === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'code_verifier cookie missing',
    });
  }
  if (cookieNonce === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'nonce cookie missing',
    });
  }

  // Token exchange — POST /token with authorization_code + code_verifier.
  // The OP validates the code + PKCE + returns access_token + id_token.
  // Sub-Issue v1.21-4d wires this against a running OP; the skeleton
  // route uses `$fetch` so the wire shape is fixed today.
  const tokenResponse = await $fetch<TokenResponse>(`${config.opIssuer}/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: body.code,
      redirect_uri: config.rpRedirectUri,
      client_id: config.rpClientId,
      code_verifier: cookieVerifier,
    }).toString(),
  });

  // TODO(v1.21-4d) — invoke `src/lib/id-token.ts`'s `mustVerifyIdToken` here
  // once the RP has JWKS discovery wired in. For the skeleton state the
  // token exchange itself is enough to prove the flow shape; the verifier
  // path is exercised in `tests/id-token-verify.spec.ts` against the mock.

  // Userinfo — GET /userinfo with the access_token as a Bearer.
  const userinfo = await $fetch<UserinfoResponse>(`${config.opIssuer}/userinfo`, {
    headers: { authorization: `Bearer ${tokenResponse.access_token}` },
  });

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
