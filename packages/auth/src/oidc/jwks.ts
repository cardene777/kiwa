import { randomBytes } from 'node:crypto';
import type { JwksDocument, JwksEndpoint, JwksKey } from './types.js';

/**
 * Module-scoped monotonic counter so `kid` values are reproducible within a
 * single test process. `k001`, `k002`, ... — matches the id style of PKCE
 * verifiers so grepping test output for `k00` yields every issued kid.
 */
let kidCounter = 0;

/**
 * Reset the kid counter. Called by `setupOidcEnv` when preparing a fresh env
 * so repeated env constructions produce identical output.
 */
export function __resetJwksCounter(): void {
  kidCounter = 0;
}

/**
 * Base64url-encode a `Buffer`. RFC 7636 §4.1 requires base64url without
 * padding — every mock key material uses the same encoding for grep-friendly
 * output.
 */
function base64Url(input: Buffer): string {
  return input
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Build a fresh JWKS key. `alg` selects RS256 (RSA) or ES256 (EC P-256). The
 * mock does not actually generate RSA / ECDSA key material — the fields are
 * base64url-encoded placeholders sized to match the algorithms so a real
 * JWK parser could ingest the shape without cracking the cryptographic
 * invariants.
 */
function createKey(alg: 'RS256' | 'ES256'): JwksKey {
  kidCounter += 1;
  const kid = `k${kidCounter.toString().padStart(3, '0')}`;
  if (alg === 'RS256') {
    return {
      kid,
      alg,
      kty: 'RSA',
      // 2048-bit modulus placeholder (256 bytes → 342 base64url chars). The
      // mock keeps the shape so a real JWK parser accepts it.
      n: base64Url(randomBytes(256)),
      e: 'AQAB',
      use: 'sig',
    };
  }
  return {
    kid,
    alg,
    kty: 'EC',
    crv: 'P-256',
    x: base64Url(randomBytes(32)),
    y: base64Url(randomBytes(32)),
    use: 'sig',
  };
}

export interface CreateJwksEndpointOptions {
  /** URL the JWKS document is fetched from. Discovery advertises this. */
  url: string;
  /** Algorithm the initial active key uses. Defaults to `RS256`. */
  initialAlg?: 'RS256' | 'ES256';
  /**
   * Retention window for retired keys in seconds. Once rotated, a key stays
   * in the JWKS for `retentionSec` so tokens signed by the retired key still
   * verify — this matches how real OPs handle rotation to avoid tearing
   * down in-flight sessions.
   */
  retentionSec?: number;
  /** Deterministic clock. When omitted uses `Date.now()`. */
  now?: () => number;
}

/**
 * Build the JWKS endpoint. Owns the current active signing key + the retired
 * key registry with retention windows.
 *
 * Rotation semantics matches Auth0 / Google-style OPs: on `rotate()` the
 * current key is retired with a retention deadline (`retentionSec` from now),
 * a fresh key becomes active, and `fetch()` returns both until the retired
 * key's deadline passes. Tokens signed by the retired key verify until the
 * deadline — after that, `activeKey()` still resolves but the retired kid is
 * dropped from the JWKS document.
 */
export function createJwksEndpoint(
  options: CreateJwksEndpointOptions,
): JwksEndpoint {
  const url = options.url;
  const initialAlg = options.initialAlg ?? 'RS256';
  const retentionSec = options.retentionSec ?? 86400;
  const now = options.now ?? (() => Date.now());

  let active: JwksKey = createKey(initialAlg);
  const retired: JwksKey[] = [];

  function currentSeconds(): number {
    return Math.floor(now() / 1000);
  }

  /**
   * Drop retired keys past their retention window. Called on every read /
   * mutation so `fetch()` never returns stale keys. Real OPs run a similar
   * background sweep — the mock does it inline for determinism.
   */
  function pruneRetired(): void {
    const cutoff = currentSeconds();
    for (let i = retired.length - 1; i >= 0; i -= 1) {
      // `i` is bounded by `retired.length` so `retired[i]` is defined; assert
      // to satisfy `noUncheckedIndexedAccess`.
      const key = retired[i] as JwksKey;
      // `retiredAt` is set at rotation time; if it's undefined the key
      // should never have been in `retired` (defensive guard).
      if (key.retiredAt === undefined || key.retiredAt <= cutoff) {
        retired.splice(i, 1);
      }
    }
  }

  function fetch(): JwksDocument {
    pruneRetired();
    // Clone active + retired so callers cannot mutate the internal state.
    return {
      keys: [active, ...retired].map((key) => ({ ...key })),
    };
  }

  function rotate(): JwksKey {
    // Deadline for the retiring key. Real OPs push this out well past the
    // longest expected token lifetime.
    const retiredAt = currentSeconds() + retentionSec;
    retired.push({ ...active, retiredAt });
    active = createKey(active.alg);
    return { ...active };
  }

  function activeKey(): JwksKey {
    return { ...active };
  }

  function allKeys(): readonly JwksKey[] {
    pruneRetired();
    return [active, ...retired].map((key) => ({ ...key }));
  }

  return {
    url,
    fetch,
    rotate,
    activeKey,
    allKeys,
  };
}
