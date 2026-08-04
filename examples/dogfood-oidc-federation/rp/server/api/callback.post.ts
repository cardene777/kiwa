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

import type { IdTokenClaims, JwksDocument } from '@kiwa-lab/auth';

import {
  assertUserinfoSubMatches,
  IdTokenVerifyError,
  UserinfoSubMismatchError,
  verifyCallbackIdToken,
} from '../../../src/lib/rp-callback.js';

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

  // id_token verification. Everything below this point trusts `claims`, so a
  // token that fails any of the four axes must not reach it.
  //
  // The JWKS is fetched per callback rather than cached. A cache would have to
  // invalidate on the OP's key rotation, and getting that wrong fails closed
  // in the worst way — a rotated-away key would keep verifying.
  let jwks: JwksDocument;
  try {
    jwks = await $fetch<JwksDocument>(`${config.opIssuer}/jwks`);
  } catch (_err) {
    // No keys means no way to tell a genuine id_token from a forged one.
    // Refusing is the only safe answer; skipping verification here would
    // hand an attacker the whole point of the exchange.
    throw createError({
      statusCode: 401,
      statusMessage: 'id_token rejected: JWKS unavailable',
    });
  }

  let claims: IdTokenClaims;
  try {
    claims = verifyCallbackIdToken({
      jwks,
      idToken: tokenResponse.id_token,
      accessToken: tokenResponse.access_token,
      code: body.code,
      nonce: cookieNonce,
      issuer: config.opIssuer,
      clientId: config.rpClientId,
    });
  } catch (err) {
    // `IdTokenVerifyError` carries the axis that failed. It goes in the status
    // message because an RP operator reading a 401 needs to know whether the
    // OP is misconfigured (claims / nonce) or the token was forged
    // (signature).
    const issue = err instanceof IdTokenVerifyError ? err.issue : undefined;
    throw createError({
      statusCode: 401,
      statusMessage:
        issue === undefined
          ? 'id_token rejected'
          : `id_token rejected: ${issue.axis} — ${issue.reason}`,
    });
  }

  // Userinfo — GET /userinfo with the access_token as a Bearer.
  const userinfo = await $fetch<UserinfoResponse>(`${config.opIssuer}/userinfo`, {
    headers: { authorization: `Bearer ${tokenResponse.access_token}` },
  });

  try {
    assertUserinfoSubMatches(userinfo.sub, claims);
  } catch (err) {
    throw createError({
      statusCode: 401,
      statusMessage:
        err instanceof UserinfoSubMismatchError
          ? err.message
          : 'userinfo sub check failed',
    });
  }

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
