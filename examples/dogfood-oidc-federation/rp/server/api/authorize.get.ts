// RP `/authorize` endpoint — the browser hits this to obtain the full
// authorization URL. The route builds the OIDC authorization request per
// OpenID Connect Core §3.1.2.1 —
//   response_type=code
//   client_id=<rp>
//   redirect_uri=<rp>/callback
//   scope=openid ...
//   state=<random>
//   nonce=<random>
//   code_challenge=<PKCE S256>
//   code_challenge_method=S256
//
// `state` + `nonce` + `code_verifier` are stored server-side (cookie session)
// so the callback route can (a) match `state` for CSRF defence, (b) pass
// `nonce` to the id_token verifier, (c) present `code_verifier` on the token
// exchange.

import { randomBytes, createHash } from 'node:crypto';

// Encode a Buffer as base64url without padding — same recipe as
// `@kiwa-test/auth`'s internal helper. Duplicated here so the Nitro server
// bundle does not need to import the workspace package.
function base64UrlEncode(input: Buffer): string {
  return input
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Generate a PKCE challenge pair. RFC 7636 §4.2 — SHA-256 the verifier +
// base64url-encode. Matches the recipe the `@kiwa-test/auth` mock uses so a
// verifier produced here round-trips through the mock's `/token`.
function derivePkceChallenge(verifier: string): string {
  return base64UrlEncode(createHash('sha256').update(verifier).digest());
}

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);

  const state = base64UrlEncode(randomBytes(24));
  const nonce = base64UrlEncode(randomBytes(24));
  const codeVerifier = base64UrlEncode(randomBytes(48));
  const codeChallenge = derivePkceChallenge(codeVerifier);

  // Persist state / nonce / verifier server-side so the callback can look
  // them up by state. The session cookie is HttpOnly + SameSite=Lax so the
  // browser hands it back on the callback redirect.
  setCookie(event, 'rp_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 300,
  });
  setCookie(event, 'rp_nonce', nonce, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 300,
  });
  setCookie(event, 'rp_code_verifier', codeVerifier, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 300,
  });

  const authorizeUrl = new URL(`${config.opIssuer}/authorize`);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', config.rpClientId);
  authorizeUrl.searchParams.set('redirect_uri', config.rpRedirectUri);
  authorizeUrl.searchParams.set('scope', 'openid profile email');
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('nonce', nonce);
  authorizeUrl.searchParams.set('code_challenge', codeChallenge);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');

  return { authorizeUrl: authorizeUrl.toString() };
});
