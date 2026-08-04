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
