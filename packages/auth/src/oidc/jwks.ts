import { generateKeyPairSync } from 'node:crypto';
import type { KeyObject } from 'node:crypto';
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
 * A minted key — the public half that goes into the JWKS document an RP
 * downloads, paired with the private half the signer keeps.
 */
interface MintedKey {
  publicJwk: JwksKey;
  privateKey: KeyObject;
}

/**
 * Build a fresh JWKS keypair. `alg` selects RS256 (RSA-2048) or ES256
 * (EC P-256).
 *
 * The key material is real. An RP that downloads the JWKS can reconstruct the
 * public key with `crypto.createPublicKey({ format: 'jwk' })` and verify a
 * signature the signer produced, which is what makes the mock usable as a
 * stand-in for a real OP in a verification path.
 *
 * `export({ format: 'jwk' })` emits exactly the RFC 7517 members the
 * {@link JwksKey} shape declares — `kty`/`n`/`e` for RSA, `kty`/`crv`/`x`/`y`
 * for EC — so the JWKS document carries no synthesised fields.
 */
function createKey(alg: 'RS256' | 'ES256'): MintedKey {
  kidCounter += 1;
  const kid = `k${kidCounter.toString().padStart(3, '0')}`;

  if (alg === 'RS256') {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    const jwk = publicKey.export({ format: 'jwk' });
    return {
      publicJwk: {
        kid,
        alg,
        kty: 'RSA',
        n: jwk.n as string,
        e: jwk.e as string,
        use: 'sig',
      },
      privateKey,
    };
  }

  const { publicKey, privateKey } = generateKeyPairSync('ec', {
    namedCurve: 'P-256',
  });
  const jwk = publicKey.export({ format: 'jwk' });
  return {
    publicJwk: {
      kid,
      alg,
      kty: 'EC',
      crv: 'P-256',
      x: jwk.x as string,
      y: jwk.y as string,
      use: 'sig',
    },
    privateKey,
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

  let activeMinted: MintedKey = createKey(initialAlg);
  let active: JwksKey = activeMinted.publicJwk;
  const retired: JwksKey[] = [];

  /**
   * Private halves by kid. Signing draws from here; the public JWKS document
   * never exposes it. Entries are dropped alongside their public key when the
   * retention window closes, so a kid the JWKS no longer advertises cannot be
   * signed with either.
   */
  const privateKeys = new Map<string, KeyObject>([
    [activeMinted.publicJwk.kid, activeMinted.privateKey],
  ]);

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
        // The private half outlives nothing the public key does — dropping it
        // here keeps the two registries from drifting apart.
        privateKeys.delete(key.kid);
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
    activeMinted = createKey(active.alg);
    active = activeMinted.publicJwk;
    privateKeys.set(active.kid, activeMinted.privateKey);
    return { ...active };
  }

  function activeKey(): JwksKey {
    return { ...active };
  }

  function allKeys(): readonly JwksKey[] {
    pruneRetired();
    return [active, ...retired].map((key) => ({ ...key }));
  }

  function signingKeyFor(kid: string): KeyObject | undefined {
    pruneRetired();
    return privateKeys.get(kid);
  }

  return {
    url,
    fetch,
    rotate,
    activeKey,
    allKeys,
    signingKeyFor,
  };
}
