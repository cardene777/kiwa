import { createHash } from 'node:crypto';
import type { JwksEndpoint } from './types.js';
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
 * produce identical output. Kept as a no-op today (the mock signature is
 * deterministic from `header.payload.kid` without stateful entropy) so
 * future additions have a stable reset seam.
 */
export function __resetIdTokenCounter(): void {
  // Intentionally empty — the mock signer is stateless.
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
 * Base64url-decode a string.
 */
function base64UrlDecode(input: string): string {
  const pad = 4 - (input.length % 4);
  const padded = input + (pad === 4 ? '' : '='.repeat(pad));
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(
    'utf-8',
  );
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
 * Compute the mock signature for an id_token. Real signatures use RS256 /
 * ES256; the mock uses a deterministic SHA-256 over the header + payload +
 * kid so signature tampering trips the verifier without cracking crypto.
 */
function computeSignature(headerB64: string, payloadB64: string, kid: string): string {
  const digest = createHash('sha256')
    .update(`${headerB64}.${payloadB64}.${kid}`)
    .digest();
  return base64UrlEncode(digest);
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
    const signature = computeSignature(headerB64, payloadB64, kid);
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
    // Reconstruct the signature by hashing `header.payload.kid`. If the
    // signature does not match, either the header / payload was tampered
    // with or the caller signed with a different kid.
    const expectedSignature = createHash('sha256')
      .update(`${headerB64}.${payloadB64}.${header.kid}`)
      .digest();
    const expectedSignatureB64 = base64UrlEncode(expectedSignature);
    if (signature !== expectedSignatureB64) {
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
