import { createHash, createPublicKey, sign, verify } from 'node:crypto';
import type { JsonWebKey, KeyObject } from 'node:crypto';
import type { JwksDocument, JwksEndpoint, JwksKey } from './types.js';
import type {
  IdToken,
  IdTokenClaims,
  SignIdTokenInput,
  VerifyIdTokenOptions,
  VerifyIdTokenResult,
} from './types.js';

/**
 * Reset any module-scope state carried by the signer. Called by
 * `setupOidcEnv` when preparing a fresh env so repeated env constructions
 * produce identical output. Kept as a no-op today — the signer holds no
 * module state of its own, since the keys live on the JWKS endpoint — so
 * future additions have a stable reset seam.
 */
export function __resetIdTokenCounter(): void {
  // Intentionally empty — the signer keeps no module-scope state.
}

/**
 * Base64url-encode a `Buffer`.
 */
function base64UrlEncode(input: Buffer): string {
  return input
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Base64url-decode a string to raw bytes.
 */
function base64UrlDecodeToBuffer(input: string): Buffer {
  const pad = 4 - (input.length % 4);
  const padded = input + (pad === 4 ? '' : '='.repeat(pad));
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

/**
 * Base64url-decode a string.
 */
function base64UrlDecode(input: string): string {
  return base64UrlDecodeToBuffer(input).toString('utf-8');
}

/**
 * Compute the OIDC Core §3.1.3.6 hash (at_hash / c_hash). Left half of the
 * SHA-256 of the ASCII string, base64url-encoded. For RS256 / ES256 the
 * spec says "left half" — for a SHA-256 digest that's 16 bytes.
 */
export function computeTokenHash(input: string): string {
  const hash = createHash('sha256').update(input).digest();
  return base64UrlEncode(hash.subarray(0, 16));
}

/**
 * JWS signing input per RFC 7515 §5.1 — the ASCII `header.payload`, with the
 * signature computed over exactly those bytes.
 */
function signingInput(headerB64: string, payloadB64: string): Buffer {
  return Buffer.from(`${headerB64}.${payloadB64}`, 'ascii');
}

/**
 * ECDSA signatures must be the fixed-width R||S concatenation RFC 7518 §3.4
 * requires, not the DER wrapper Node emits by default. RSA takes no such
 * option.
 */
function signatureOptions(alg: 'RS256' | 'ES256'): { dsaEncoding?: 'ieee-p1363' } {
  return alg === 'ES256' ? { dsaEncoding: 'ieee-p1363' } : {};
}

/**
 * Sign the JWS input with the private half of the JWKS key behind `kid`.
 *
 * Both algorithms digest with SHA-256 — `RS256` is RSASSA-PKCS1-v1_5 and
 * `ES256` is ECDSA on P-256, and Node picks between them from the key type.
 */
function computeSignature(
  headerB64: string,
  payloadB64: string,
  alg: 'RS256' | 'ES256',
  privateKey: KeyObject,
): string {
  const signature = sign(
    'sha256',
    signingInput(headerB64, payloadB64),
    { key: privateKey, ...signatureOptions(alg) },
  );
  return base64UrlEncode(signature);
}

/**
 * Rebuild the public key from a JWKS entry the way an RP would, then check the
 * signature against it.
 *
 * Verification runs off the public JWK alone — the same bytes `fetch()` hands
 * out — so a token that verifies here verifies for any RP holding the JWKS.
 */
function verifySignature(
  headerB64: string,
  payloadB64: string,
  signatureB64: string,
  key: JwksKey,
): boolean {
  // `alg` must agree with the key type it is declared against. Node picks the
  // signature scheme from the key, not from `alg`, so an entry advertising
  // `alg: "ES256"` over RSA material would verify an RSA signature while the
  // header claimed ECDSA — the caller's `header.alg === key.alg` check reads
  // as an algorithm policy but enforces nothing on its own (RFC 7518 §3.1
  // binds each `alg` to one key type).
  if (key.alg === 'RS256' && key.kty !== 'RSA') {
    return false;
  }
  if (key.alg === 'ES256' && key.kty !== 'EC') {
    return false;
  }

  // Only the RFC 7517 members go to `createPublicKey`. `kid` / `use` /
  // `retiredAt` are JWKS bookkeeping and are not key material.
  //
  // The members are optional on {@link JwksKey} because one shape declares
  // both algorithms. An entry missing the material for its own `kty` carries
  // no key to check against, so nothing can verify under it.
  let jwk: JsonWebKey;
  if (key.kty === 'RSA') {
    if (key.n === undefined || key.e === undefined) {
      return false;
    }
    jwk = { kty: 'RSA', n: key.n, e: key.e };
  } else {
    // ES256 is the only EC algorithm this signer emits, and RFC 7518 §3.4
    // binds it to P-256. Any other curve is outside the declared policy.
    if (key.crv !== 'P-256' || key.x === undefined || key.y === undefined) {
      return false;
    }
    jwk = { kty: 'EC', crv: key.crv, x: key.x, y: key.y };
  }

  let publicKey: KeyObject;
  try {
    publicKey = createPublicKey({ key: jwk, format: 'jwk' });
  } catch {
    return false;
  }

  let signature: Buffer;
  try {
    signature = base64UrlDecodeToBuffer(signatureB64);
  } catch {
    return false;
  }

  try {
    return verify(
      'sha256',
      signingInput(headerB64, payloadB64),
      { key: publicKey, ...signatureOptions(key.alg) },
      signature,
    );
  } catch {
    // A malformed signature (wrong width for ES256, wrong length for RSA)
    // throws rather than returning false. Either way the token is not valid.
    return false;
  }
}

export interface CreateIdTokenSignerOptions {
  /** Issuer to embed in every id_token by default. */
  issuer: string;
  /** JWKS endpoint the signer draws the active key from. */
  jwks: JwksEndpoint;
  /** Default id_token lifetime in seconds. Defaults to 3600. */
  defaultLifetimeSec?: number;
  /** Deterministic clock. */
  now?: () => number;
}

export interface IdTokenSigner {
  sign(input: SignIdTokenInput): IdToken;
  verify(jwt: string, options: VerifyIdTokenOptions): VerifyIdTokenResult;
}

/**
 * Build the id_token signer + verifier. Owns the JWKS endpoint reference so
 * signing always uses the currently-active key + verification looks up the
 * kid across the full JWKS (active + retained-retired keys, within the
 * retention window).
 */
export function createIdTokenSigner(options: CreateIdTokenSignerOptions): IdTokenSigner {
  const defaultLifetime = options.defaultLifetimeSec ?? 3600;
  const now = options.now ?? (() => Date.now());

  function currentSeconds(): number {
    return Math.floor(now() / 1000);
  }

  function sign(input: SignIdTokenInput): IdToken {
    const iat = currentSeconds();
    const lifetime = input.lifetimeSec ?? defaultLifetime;
    const exp = iat + lifetime;

    const activeKey = options.jwks.activeKey();
    const alg = activeKey.alg;
    const kid = activeKey.kid;

    const claims: IdTokenClaims = {
      iss: input.iss ?? options.issuer,
      sub: input.sub,
      aud: input.aud,
      exp,
      iat,
      ...(input.nonce === undefined ? {} : { nonce: input.nonce }),
      ...(input.accessToken === undefined
        ? {}
        : { at_hash: computeTokenHash(input.accessToken) }),
      ...(input.code === undefined ? {} : { c_hash: computeTokenHash(input.code) }),
      ...(input.extraClaims ?? {}),
    };

    const header = {
      alg,
      typ: 'JWT' as const,
      kid,
    };
    const headerB64 = base64UrlEncode(Buffer.from(JSON.stringify(header)));
    const payloadB64 = base64UrlEncode(Buffer.from(JSON.stringify(claims)));

    const privateKey = options.jwks.signingKeyFor(kid);
    if (privateKey === undefined) {
      // `activeKey()` just handed us this kid, so the registries disagreeing
      // means the endpoint pruned mid-call. Failing loudly beats emitting a
      // token nothing can verify.
      throw new Error(`id_token: no signing key registered for kid "${kid}"`);
    }

    const signature = computeSignature(headerB64, payloadB64, alg, privateKey);
    const jwt = `${headerB64}.${payloadB64}.${signature}`;

    return {
      jwt,
      header,
      claims,
    };
  }

  function verify(jwt: string, opts: VerifyIdTokenOptions): VerifyIdTokenResult {
    const parts = jwt.split('.');
    if (parts.length !== 3) {
      return {
        valid: false,
        reason: `id_token: expected 3 dot-separated segments, got ${parts.length}`,
      };
    }
    // Explicit non-null unpack — `parts.length === 3` guarantees every index
    // is defined but TS `noUncheckedIndexedAccess` still surfaces `undefined`
    // through the destructuring. We assert here so the rest of the function
    // treats them as `string`.
    const headerB64 = parts[0] as string;
    const payloadB64 = parts[1] as string;
    const signature = parts[2] as string;

    let header: { alg: 'RS256' | 'ES256'; typ: 'JWT'; kid: string };
    let claims: IdTokenClaims;
    try {
      header = JSON.parse(base64UrlDecode(headerB64));
    } catch (err) {
      return { valid: false, reason: `id_token: header parse failed — ${(err as Error).message}` };
    }
    try {
      claims = JSON.parse(base64UrlDecode(payloadB64));
    } catch (err) {
      return { valid: false, reason: `id_token: payload parse failed — ${(err as Error).message}` };
    }

    // JWS signature verification. The mock re-computes the deterministic
    // signature from the JWT parts + the kid the header points to; if the
    // supplied signature diverges, the token was tampered with.
    const jwksKeys = options.jwks.allKeys();
    const matchingKey = jwksKeys.find((key) => key.kid === header.kid);
    if (matchingKey === undefined) {
      return {
        valid: false,
        reason: `id_token: kid "${header.kid}" not found in JWKS`,
      };
    }
    if (matchingKey.alg !== header.alg) {
      return {
        valid: false,
        reason: `id_token: header alg "${header.alg}" does not match JWKS entry alg "${matchingKey.alg}"`,
      };
    }
    // Check the signature against the public key the JWKS advertises for this
    // kid. Any edit to the header or payload changes the signing input, so a
    // tampered token fails here regardless of which field was touched.
    if (!verifySignature(headerB64, payloadB64, signature, matchingKey)) {
      return { valid: false, reason: 'id_token: signature verification failed' };
    }

    // iss check. OIDC Core §3.1.3.7 mandates issuer match.
    if (claims.iss !== opts.expectedIssuer) {
      return {
        valid: false,
        reason: `id_token: iss mismatch — expected "${opts.expectedIssuer}", got "${claims.iss}"`,
      };
    }

    // aud check. OIDC Core §3.1.3.7 mandates audience match.
    if (claims.aud !== opts.expectedAudience) {
      return {
        valid: false,
        reason: `id_token: aud mismatch — expected "${opts.expectedAudience}", got "${claims.aud}"`,
      };
    }

    // exp check. Skew tolerance follows the caller-provided clockSkewSec or
    // the default 60 s (matches DPoP skew default in the OAuth 2.1 adapter).
    const skew = opts.clockSkewSec ?? 60;
    const nowSec = Math.floor((opts.now ?? now)() / 1000);
    if (typeof claims.exp !== 'number' || claims.exp + skew < nowSec) {
      return {
        valid: false,
        reason: `id_token: exp expired — exp=${claims.exp}, now=${nowSec}, skew=${skew}`,
      };
    }

    // iat check. `iat` in the future beyond skew is a clock-drift attack
    // vector — a real RP treats it as an attempted replay from an
    // out-of-sync OP.
    if (typeof claims.iat !== 'number' || claims.iat > nowSec + skew) {
      return {
        valid: false,
        reason: `id_token: iat in the future — iat=${claims.iat}, now=${nowSec}, skew=${skew}`,
      };
    }

    // nonce check. Only enforced when the caller supplies an
    // `expectedNonce`. Absent claim + non-absent expectation is a
    // replay-attack indicator.
    if (opts.expectedNonce !== undefined) {
      if (claims.nonce !== opts.expectedNonce) {
        return {
          valid: false,
          reason: `id_token: nonce mismatch — expected "${opts.expectedNonce}", got "${String(claims.nonce)}"`,
        };
      }
    }

    // at_hash check. Only enforced when the caller supplies
    // `expectedAccessToken`. Computed as OIDC Core §3.1.3.6 dictates —
    // left half of SHA-256, base64url.
    if (opts.expectedAccessToken !== undefined) {
      const expectedAtHash = computeTokenHash(opts.expectedAccessToken);
      if (claims.at_hash !== expectedAtHash) {
        return {
          valid: false,
          reason: `id_token: at_hash mismatch — expected "${expectedAtHash}", got "${String(claims.at_hash)}"`,
        };
      }
    }

    // c_hash check. Only enforced when the caller supplies `expectedCode`.
    if (opts.expectedCode !== undefined) {
      const expectedCHash = computeTokenHash(opts.expectedCode);
      if (claims.c_hash !== expectedCHash) {
        return {
          valid: false,
          reason: `id_token: c_hash mismatch — expected "${expectedCHash}", got "${String(claims.c_hash)}"`,
        };
      }
    }

    return { valid: true, claims };
  }

  return { sign, verify };
}

/**
 * Wrap a downloaded JWKS document in the read-only slice of
 * {@link JwksEndpoint} that verification touches.
 *
 * An RP holds a document it fetched over HTTP, not the OP's live endpoint. It
 * can never sign or rotate, so those members throw rather than pretending to
 * work — reaching them would mean the verify path had started mutating state
 * it does not own.
 *
 * Retention pruning is the OP's job and is already reflected in the document
 * it served, so `fetch()` and `allKeys()` return the keys as received.
 */
function documentBackedEndpoint(document: JwksDocument): JwksEndpoint {
  const snapshot = document.keys.map((key) => ({ ...key }));
  const unavailable = (member: string): never => {
    throw new Error(`jwks: ${member} is unavailable on a fetched JWKS document`);
  };
  return {
    url: '',
    fetch: () => ({ keys: snapshot.map((key) => ({ ...key })) }),
    rotate: () => unavailable('rotate'),
    activeKey: () => unavailable('activeKey'),
    allKeys: () => snapshot.map((key) => ({ ...key })),
    signingKeyFor: () => undefined,
  };
}

/**
 * Build an id_token verifier from a JWKS document an RP downloaded from the
 * OP's `jwks_uri`.
 *
 * This is the verifier a Relying Party uses in its callback: it enforces the
 * same four axes the OP-side verifier does (JWS signature, claims, nonce echo,
 * hash chain) using only the public keys, so it needs no access to the OP's
 * internals.
 *
 * The returned function is synchronous — signature checking runs through
 * `node:crypto`'s synchronous `verify`, not WebCrypto — so it satisfies
 * callers that treat verification as a pure step inside a request handler.
 */
export function createJwksDocumentVerifier(
  document: JwksDocument,
  now?: () => number,
): (jwt: string, options: VerifyIdTokenOptions) => VerifyIdTokenResult {
  const signer = createIdTokenSigner({
    // `issuer` seeds signing defaults only; verification compares against
    // `options.expectedIssuer`, which the caller supplies per token.
    issuer: '',
    jwks: documentBackedEndpoint(document),
    ...(now === undefined ? {} : { now }),
  });
  return (jwt, options) => signer.verify(jwt, options);
}
