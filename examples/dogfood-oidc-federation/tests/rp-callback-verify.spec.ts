/**
 * GH #1795 — the RP callback's id_token verification.
 *
 * Before this suite the callback accepted whatever the token endpoint
 * returned. These cases pin that each of the four fidelity axes rejects, that
 * a genuine token still passes, and that the userinfo `sub` must agree with
 * the verified subject.
 *
 * The tokens are minted by the `@kiwa-lab/auth` mock OP, whose signatures are
 * real RS256 / ES256 over the JWKS keypair, so "signature rejected" here means
 * the signature genuinely failed to verify against the published public key.
 */

import { describe, expect, it } from 'vitest';

import { setupOidcEnv } from '@kiwa-lab/auth';
import type { JwksDocument } from '@kiwa-lab/auth';

import {
  assertUserinfoSubMatches,
  IdTokenVerifyError,
  runCallback,
  UserinfoSubMismatchError,
  verifyCallbackIdToken,
} from '../src/lib/rp-callback.js';

const ISSUER = 'https://op.example.test';
const CLIENT_ID = 'rp-client';
const NONCE = 'nonce-abc';
const CODE = 'code-xyz';
const ACCESS_TOKEN = 'access-token-123';
const SUBJECT = 'user-42';

interface Harness {
  jwks: JwksDocument;
  idToken: string;
  rotate: () => void;
  sign: (overrides?: Record<string, unknown>) => string;
  fetchJwks: () => JwksDocument;
}

/**
 * Build a mock OP and mint the id_token a successful callback would receive.
 * `sign` re-mints with overridden claims so a case can bend exactly one axis.
 */
async function harness(): Promise<Harness> {
  const env = await setupOidcEnv({ issuer: ISSUER });

  const sign = (overrides: Record<string, unknown> = {}): string =>
    env.signIdToken({
      sub: SUBJECT,
      aud: CLIENT_ID,
      nonce: NONCE,
      accessToken: ACCESS_TOKEN,
      code: CODE,
      ...overrides,
    }).jwt;

  return {
    jwks: env.jwks.fetch(),
    idToken: sign(),
    rotate: () => {
      env.jwks.rotate();
    },
    sign,
    fetchJwks: () => env.jwks.fetch(),
  };
}

/** Options a callback would pass for a token minted by {@link harness}. */
function inputFor(h: Harness, overrides: Record<string, unknown> = {}) {
  return {
    jwks: h.jwks,
    idToken: h.idToken,
    accessToken: ACCESS_TOKEN,
    code: CODE,
    nonce: NONCE,
    issuer: ISSUER,
    clientId: CLIENT_ID,
    ...overrides,
  };
}

/** Run verification and return the `IdTokenVerifyError` it threw. */
function rejectionOf(input: ReturnType<typeof inputFor>): IdTokenVerifyError {
  try {
    verifyCallbackIdToken(input);
  } catch (err) {
    if (err instanceof IdTokenVerifyError) {
      return err;
    }
    throw err;
  }
  throw new Error('expected verification to reject, but it returned claims');
}

describe('verifyCallbackIdToken — the callback accepts a genuine token', () => {
  it('returns the claims for a token the OP actually signed', async () => {
    const h = await harness();
    const claims = verifyCallbackIdToken(inputFor(h));

    expect(claims.sub).toBe(SUBJECT);
    expect(claims.iss).toBe(ISSUER);
    expect(claims.aud).toBe(CLIENT_ID);
    expect(claims.nonce).toBe(NONCE);
  });

  it('accepts a token signed by a retired key still inside the retention window', async () => {
    const h = await harness();
    // Token minted under the pre-rotation kid; the JWKS still advertises it.
    h.rotate();

    const claims = verifyCallbackIdToken(inputFor(h, { jwks: h.fetchJwks() }));

    expect(claims.sub).toBe(SUBJECT);
  });
});

describe('verifyCallbackIdToken — signature axis', () => {
  it('rejects a token whose payload was edited after signing', async () => {
    const h = await harness();
    const [header, payload, signature] = h.idToken.split('.');
    const tampered = JSON.parse(
      Buffer.from(payload as string, 'base64url').toString('utf-8'),
    );
    tampered.sub = 'attacker';
    const forgedPayload = Buffer.from(JSON.stringify(tampered)).toString(
      'base64url',
    );

    const error = rejectionOf(
      inputFor(h, { idToken: `${header}.${forgedPayload}.${signature}` }),
    );

    expect(error.issue.axis).toBe('signature');
  });

  it('rejects a token signed under a kid the JWKS does not carry', async () => {
    const h = await harness();
    const other = await harness();

    // `other` minted its own keypair, so its kid is absent from `h.jwks`.
    const error = rejectionOf(inputFor(h, { idToken: other.idToken }));

    expect(error.issue.axis).toBe('signature');
    expect(error.issue.reason).toContain('not found in JWKS');
  });

  it('rejects a token whose signature belongs to a different key', async () => {
    const h = await harness();
    const other = await harness();
    const [header, payload] = h.idToken.split('.');
    const foreignSignature = other.idToken.split('.')[2];

    const error = rejectionOf(
      inputFor(h, { idToken: `${header}.${payload}.${foreignSignature}` }),
    );

    expect(error.issue.axis).toBe('signature');
    expect(error.issue.reason).toContain('signature verification failed');
  });

  it('rejects a JWKS entry whose alg does not match its key type', async () => {
    // alg confusion — Node picks the signature scheme from the key, not from
    // `alg`, so an entry advertising ES256 over RSA material used to verify an
    // RSA signature while the header claimed ECDSA.
    const { generateKeyPairSync, sign } = await import('node:crypto');
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    const jwk = publicKey.export({ format: 'jwk' });

    const nowSec = Math.floor(Date.now() / 1000);
    const b64 = (value: string | Buffer): string =>
      Buffer.from(value).toString('base64url');
    const headerB64 = b64(
      JSON.stringify({ alg: 'ES256', typ: 'JWT', kid: 'confused' }),
    );
    const payloadB64 = b64(
      JSON.stringify({
        iss: ISSUER,
        sub: SUBJECT,
        aud: CLIENT_ID,
        exp: nowSec + 3600,
        iat: nowSec,
      }),
    );
    const signature = b64(
      sign('sha256', Buffer.from(`${headerB64}.${payloadB64}`, 'ascii'), privateKey),
    );

    const h = await harness();
    const forged: JwksDocument = {
      keys: [
        {
          kid: 'confused',
          alg: 'ES256',
          kty: 'RSA',
          n: jwk.n as string,
          e: jwk.e as string,
          use: 'sig',
        },
      ],
    };

    const error = rejectionOf(
      inputFor(h, {
        jwks: forged,
        idToken: `${headerB64}.${payloadB64}.${signature}`,
        // The forged token carries no nonce or hashes; the signature axis must
        // reject before those are ever compared.
      }),
    );

    expect(error.issue.axis).toBe('signature');
  });

  it('rejects an alg the signer never emits, even over well-formed RSA material', async () => {
    // `alg` arrives over HTTP, so the TypeScript union does not constrain it.
    // `PS256` is RSA-PSS (RFC 7518 §3.5); without a closed allowlist it would
    // fall through to the RSA branch and be checked as PKCS#1 v1.5.
    const { generateKeyPairSync, sign } = await import('node:crypto');
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    const jwk = publicKey.export({ format: 'jwk' });

    const nowSec = Math.floor(Date.now() / 1000);
    const b64 = (value: string | Buffer): string =>
      Buffer.from(value).toString('base64url');
    const headerB64 = b64(JSON.stringify({ alg: 'PS256', typ: 'JWT', kid: 'ps' }));
    const payloadB64 = b64(
      JSON.stringify({
        iss: ISSUER,
        sub: SUBJECT,
        aud: CLIENT_ID,
        exp: nowSec + 3600,
        iat: nowSec,
      }),
    );
    const signature = b64(
      sign('sha256', Buffer.from(`${headerB64}.${payloadB64}`, 'ascii'), privateKey),
    );

    const h = await harness();
    const forged = {
      keys: [
        {
          kid: 'ps',
          // Outside the declared union — the shape a real JWKS could carry.
          alg: 'PS256' as unknown as 'RS256',
          kty: 'RSA' as const,
          n: jwk.n as string,
          e: jwk.e as string,
          use: 'sig' as const,
        },
      ],
    };

    const error = rejectionOf(
      inputFor(h, {
        jwks: forged,
        idToken: `${headerB64}.${payloadB64}.${signature}`,
      }),
    );

    expect(error.issue.axis).toBe('signature');
  });

  it('rejects when the JWKS carries no key material for the kid', async () => {
    const h = await harness();
    const stripped: JwksDocument = {
      keys: h.jwks.keys.map((key) => {
        const { n: _n, e: _e, x: _x, y: _y, ...rest } = key;
        return rest as typeof key;
      }),
    };

    const error = rejectionOf(inputFor(h, { jwks: stripped }));

    expect(error.issue.axis).toBe('signature');
  });
});

describe('verifyCallbackIdToken — claims axis', () => {
  it('rejects a token from a different issuer', async () => {
    const h = await harness();

    const error = rejectionOf(inputFor(h, { issuer: 'https://evil.example.test' }));

    expect(error.issue.axis).toBe('claims');
    expect(error.issue.reason).toContain('iss mismatch');
  });

  it('rejects a token minted for a different client', async () => {
    const h = await harness();

    const error = rejectionOf(inputFor(h, { clientId: 'someone-else' }));

    expect(error.issue.axis).toBe('claims');
    expect(error.issue.reason).toContain('aud mismatch');
  });

  it('rejects an expired token once it is past the skew window', async () => {
    const h = await harness();
    // Default skew is 60 s; jump well beyond it.
    const wayLater = () => Date.now() + 7200_000;

    const error = rejectionOf(inputFor(h, { now: wayLater }));

    expect(error.issue.axis).toBe('claims');
    expect(error.issue.reason).toContain('exp expired');
  });
});

describe('verifyCallbackIdToken — nonce axis', () => {
  it('rejects a token echoing a nonce the RP never sent', async () => {
    const h = await harness();

    const error = rejectionOf(inputFor(h, { nonce: 'a-different-nonce' }));

    expect(error.issue.axis).toBe('nonce');
  });
});

describe('verifyCallbackIdToken — hash chain axis', () => {
  it('rejects when at_hash does not cover the access_token received', async () => {
    const h = await harness();

    const error = rejectionOf(inputFor(h, { accessToken: 'a-different-token' }));

    expect(error.issue.axis).toBe('hash_chain');
    expect(error.issue.reason).toContain('at_hash');
  });

  it('rejects when c_hash does not cover the code that was redeemed', async () => {
    const h = await harness();

    const error = rejectionOf(inputFor(h, { code: 'a-different-code' }));

    expect(error.issue.axis).toBe('hash_chain');
    expect(error.issue.reason).toContain('c_hash');
  });
});

describe('assertUserinfoSubMatches — OIDC Core §5.3.2', () => {
  it('accepts a userinfo response describing the verified subject', async () => {
    const h = await harness();
    const claims = verifyCallbackIdToken(inputFor(h));

    expect(() => {
      assertUserinfoSubMatches(SUBJECT, claims);
    }).not.toThrow();
  });

  it('rejects a userinfo response describing a different subject', async () => {
    const h = await harness();
    const claims = verifyCallbackIdToken(inputFor(h));

    expect(() => {
      assertUserinfoSubMatches('someone-else', claims);
    }).toThrow(UserinfoSubMismatchError);
  });
});

describe('runCallback — the route wiring', () => {
  /** Deps that succeed, so a case can break exactly one of them. */
  async function goodDeps() {
    const h = await harness();
    const calls = { jwks: 0, token: 0, userinfo: 0 };
    return {
      h,
      calls,
      input: {
        code: CODE,
        state: 'state-1',
        cookieState: 'state-1',
        cookieNonce: NONCE,
        cookieVerifier: 'verifier-1',
        issuer: ISSUER,
        clientId: CLIENT_ID,
      },
      deps: {
        fetchJwks: async () => {
          calls.jwks += 1;
          return h.jwks;
        },
        exchangeCode: async () => {
          calls.token += 1;
          return { access_token: ACCESS_TOKEN, id_token: h.idToken };
        },
        fetchUserinfo: async (_token: string) => {
          calls.userinfo += 1;
          return { sub: SUBJECT, name: 'Test User' };
        },
      },
    };
  }

  it('returns the userinfo when every step passes', async () => {
    const { input, deps } = await goodDeps();

    const outcome = await runCallback(input, deps);

    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.userinfo.sub).toBe(SUBJECT);
      expect(outcome.claims.sub).toBe(SUBJECT);
    }
  });

  it('rejects with 401 and never fetches userinfo when the id_token is forged', async () => {
    const { h, calls, input, deps } = await goodDeps();
    const other = await harness();

    const outcome = await runCallback(input, {
      ...deps,
      exchangeCode: async () => ({
        access_token: ACCESS_TOKEN,
        // Signed by a key `h.jwks` does not carry.
        id_token: other.idToken,
      }),
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.status).toBe(401);
      expect(outcome.message).toContain('id_token rejected');
    }
    // The whole point of verifying first: nothing downstream ran.
    expect(calls.userinfo).toBe(0);
    expect(h.jwks.keys.length).toBeGreaterThan(0);
  });

  it('rejects with 401 when the JWKS cannot be fetched', async () => {
    const { calls, input, deps } = await goodDeps();

    const outcome = await runCallback(input, {
      ...deps,
      fetchJwks: async () => {
        throw new Error('network down');
      },
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.status).toBe(401);
      expect(outcome.message).toContain('JWKS unavailable');
    }
    expect(calls.userinfo).toBe(0);
  });

  it('rejects with 401 when userinfo describes a different subject', async () => {
    const { input, deps } = await goodDeps();

    const outcome = await runCallback(input, {
      ...deps,
      fetchUserinfo: async () => ({ sub: 'someone-else' }),
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.status).toBe(401);
      expect(outcome.message).toContain('does not match');
    }
  });

  it('rejects with 400 before exchanging the code when state does not match', async () => {
    const { calls, input, deps } = await goodDeps();

    const outcome = await runCallback({ ...input, cookieState: 'other' }, deps);

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.status).toBe(400);
      expect(outcome.message).toContain('CSRF gate');
    }
    // The CSRF gate must precede the token exchange.
    expect(calls.token).toBe(0);
  });

  it('rejects with 400 when the nonce cookie is absent', async () => {
    const { input, deps } = await goodDeps();

    const outcome = await runCallback({ ...input, cookieNonce: undefined }, deps);

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.status).toBe(400);
      expect(outcome.message).toContain('nonce cookie missing');
    }
  });
});
