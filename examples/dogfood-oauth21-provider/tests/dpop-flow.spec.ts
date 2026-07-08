/**
 * DPoP-flow fidelity harness (Sub-Issue v1.21-3c — #866).
 *
 * Extends the pkce-flow harness (Sub-Issue v1.21-3b — #865) with
 * DPoP-specific behavioural checks. Four fidelity axes asserted across
 * the mock adapter (always available) plus the real adapter (env-skipped
 * when `OAUTH21_BOOTSTRAP` is unset — matches the pkce-flow pattern).
 *
 *  1. DPoP header alg — RFC 9449 §4.2. Only `alg=ES256` + `typ=dpop+jwt`
 *     are accepted; anything else surfaces as `invalid_dpop_proof`.
 *  2. `htm` + `htu` binding — RFC 9449 §4.3. `htm` (uppercase HTTP
 *     method) + `htu` (absolute URL) must match the request the proof
 *     rides on. Mismatch surfaces as `invalid_dpop_proof` with a kind
 *     that distinguishes htm from htu.
 *  3. `iat` skew tolerance — RFC 9449 §4.3. The AS applies a
 *     configurable window (default 60 s per `SetupOAuth21EnvOptions`);
 *     a proof whose `iat` is outside the window surfaces as
 *     `invalid_dpop_proof` with `payload_iat_skew`.
 *  4. `jti` replay guard — RFC 9449 §4.3. The AS keeps a `seenJtis`
 *     registry. Second use of the same `jti` throws with the
 *     `payload_jti_replay` kind so the client sees
 *     `invalid_dpop_proof` (not `invalid_grant`).
 *
 * Every axis is exercised both at the wrapper layer (`verifyDpopProofBinding`,
 * `parseDpopHeader`, `assertDpopHeaderShape`) and end-to-end through the
 * Hono `/token` handler so the fidelity contract holds regardless of
 * whether a caller drives the AS through the adapter or over HTTP.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  __resetOAuth21Counters,
  computeDpopJkt as kiwaComputeJkt,
  createDpopProof as kiwaCreateDpopProof,
  createMockDpopJwk,
  createPkceChallenge,
  parseDpopProof as kiwaParseDpopProof,
} from '@kiwa/auth';
import type { DpopJwk, DpopProof } from '@kiwa/auth';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { createHonoApp } from '../src/lib/hono-app.js';
import {
  assertDpopHeaderShape,
  computeJkt,
  DPOP_ALG,
  DPOP_TYP,
  DpopValidationError,
  parseDpopHeader,
  verifyDpopProofBinding,
} from '../src/lib/dpop.js';

const CLIENT = {
  clientId: 'dogfood-client',
  redirectUris: ['https://client.example.test/callback'],
  scopes: ['read', 'write'],
} as const;

const USER = {
  subject: 'user-1',
  scopes: ['read', 'write'],
} as const;

const REDIRECT = CLIENT.redirectUris[0];
const ISSUER = 'https://as.example.test';

interface Bootstrap {
  adapter: Awaited<ReturnType<typeof makeMockAdapter>>;
  app: ReturnType<typeof createHonoApp>;
  currentTime: number;
  setNow: (unixMs: number) => void;
}

async function bootstrap(options?: {
  dpopIatSkewSec?: number;
  initialTimeMs?: number;
}): Promise<Bootstrap> {
  __resetOAuth21Counters();
  const startTime = options?.initialTimeMs ?? 1_700_000_000_000;
  const clock = { now: startTime };
  const adapter = await makeMockAdapter({
    issuer: ISSUER,
    clients: [CLIENT],
    users: [USER],
    dpopIatSkewSec: options?.dpopIatSkewSec ?? 60,
    now: () => clock.now,
  });
  const app = createHonoApp({ adapter, authenticatedSubject: USER.subject });
  return {
    adapter,
    app,
    currentTime: clock.now,
    setNow(unixMs: number) {
      clock.now = unixMs;
    },
  };
}

/**
 * Fabricate a valid DPoP proof for the given request. Bound to a fresh
 * JWK unless the caller passes one — reuse of a JWK across proofs
 * exercises the binding-preservation axis.
 */
function makeProof(
  args: {
    htm: string;
    htu: string;
    iat?: number;
    jti?: string;
    jwk?: DpopJwk;
  },
): DpopProof {
  return kiwaCreateDpopProof({
    htm: args.htm,
    htu: args.htu,
    ...(args.iat !== undefined ? { iat: args.iat } : {}),
    ...(args.jti !== undefined ? { jti: args.jti } : {}),
    ...(args.jwk !== undefined ? { jwk: args.jwk } : {}),
  });
}

/**
 * Drive `/authorize` + `/token` end-to-end and return the parsed
 * response so DPoP-flow assertions can inspect `token_type` +
 * refresh_token. Uses a fresh PKCE challenge per invocation so
 * consecutive calls do not step on each other.
 */
async function driveAuthorizeAndToken(
  args: {
    app: ReturnType<typeof createHonoApp>;
    state: string;
    dpopHeader?: string;
  },
): Promise<{
  status: number;
  body: Record<string, string | number | undefined>;
}> {
  const challenge = createPkceChallenge();
  const authUrl = new URL(`${ISSUER}/authorize`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', CLIENT.clientId);
  authUrl.searchParams.set('redirect_uri', REDIRECT);
  authUrl.searchParams.set('state', args.state);
  authUrl.searchParams.set('scope', 'read');
  authUrl.searchParams.set('code_challenge', challenge.codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  const authRes = await args.app.request(
    authUrl.pathname + authUrl.search,
    { redirect: 'manual' },
  );
  if (authRes.status !== 302) {
    throw new Error(
      `driveAuthorizeAndToken: /authorize returned ${authRes.status}, expected 302 — body ${await authRes.text()}`,
    );
  }
  const location = authRes.headers.get('location');
  if (!location) throw new Error('driveAuthorizeAndToken: no location header');
  const redirect = new URL(location);
  const code = redirect.searchParams.get('code');
  if (!code) throw new Error('driveAuthorizeAndToken: no code in redirect');
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT,
    client_id: CLIENT.clientId,
    code_verifier: challenge.codeVerifier,
  }).toString();
  const headers: Record<string, string> = {
    'content-type': 'application/x-www-form-urlencoded',
  };
  if (args.dpopHeader !== undefined) headers['DPoP'] = args.dpopHeader;
  const tokenRes = await args.app.request('/token', {
    method: 'POST',
    headers,
    body,
  });
  return {
    status: tokenRes.status,
    body: (await tokenRes.json()) as Record<
      string,
      string | number | undefined
    >,
  };
}

describe('axis 1 — DPoP header alg (RFC 9449 §4.2)', () => {
  beforeEach(() => {
    __resetOAuth21Counters();
  });

  it('DPOP_TYP is "dpop+jwt" and DPOP_ALG is "ES256"', () => {
    expect(DPOP_TYP).toBe('dpop+jwt');
    expect(DPOP_ALG).toBe('ES256');
  });

  it('parseDpopHeader accepts a well-formed proof', () => {
    const proof = makeProof({ htm: 'POST', htu: `${ISSUER}/token` });
    const parsed = parseDpopHeader(proof.jwt);
    expect(parsed.header.typ).toBe(DPOP_TYP);
    expect(parsed.header.alg).toBe(DPOP_ALG);
    expect(parsed.header.jwk.kty).toBe('EC');
    expect(parsed.header.jwk.crv).toBe('P-256');
  });

  it('parseDpopHeader rejects a missing header with header_missing', () => {
    try {
      parseDpopHeader(undefined);
      throw new Error('parseDpopHeader did not throw');
    } catch (err) {
      expect(err).toBeInstanceOf(DpopValidationError);
      expect((err as DpopValidationError).kind).toBe('header_missing');
    }
  });

  it('parseDpopHeader rejects an empty header with header_missing', () => {
    try {
      parseDpopHeader('');
      throw new Error('parseDpopHeader did not throw');
    } catch (err) {
      expect(err).toBeInstanceOf(DpopValidationError);
      expect((err as DpopValidationError).kind).toBe('header_missing');
    }
  });

  it('parseDpopHeader rejects a comma-folded header with header_malformed', () => {
    const proof1 = makeProof({ htm: 'POST', htu: `${ISSUER}/token` });
    const proof2 = makeProof({ htm: 'POST', htu: `${ISSUER}/token` });
    try {
      parseDpopHeader(`${proof1.jwt}, ${proof2.jwt}`);
      throw new Error('parseDpopHeader did not throw');
    } catch (err) {
      expect(err).toBeInstanceOf(DpopValidationError);
      expect((err as DpopValidationError).kind).toBe('header_malformed');
    }
  });

  it('parseDpopHeader rejects a malformed JWT with header_malformed', () => {
    try {
      parseDpopHeader('not.enough');
      throw new Error('parseDpopHeader did not throw');
    } catch (err) {
      expect(err).toBeInstanceOf(DpopValidationError);
      expect((err as DpopValidationError).kind).toBe('header_malformed');
    }
  });

  it('parseDpopHeader rejects a proof with typ != dpop+jwt with header_typ_refused', () => {
    // Rebuild the proof with a mutated typ. We hand-encode a payload +
    // header pair so the classifier hits the typ branch specifically.
    const jwk = createMockDpopJwk();
    const header = { typ: 'jwt', alg: 'ES256', jwk };
    const payload = {
      htm: 'POST',
      htu: `${ISSUER}/token`,
      iat: Math.floor(Date.now() / 1000),
      jti: 'jti-1',
    };
    const encodeSegment = (segment: unknown): string =>
      Buffer.from(JSON.stringify(segment))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    const encoded = `${encodeSegment(header)}.${encodeSegment(payload)}.sig`;
    try {
      parseDpopHeader(encoded);
      throw new Error('parseDpopHeader did not throw');
    } catch (err) {
      expect(err).toBeInstanceOf(DpopValidationError);
      expect((err as DpopValidationError).kind).toBe('header_typ_refused');
    }
  });

  it('parseDpopHeader rejects a proof with alg != ES256 with header_alg_refused', () => {
    const jwk = createMockDpopJwk();
    const header = { typ: 'dpop+jwt', alg: 'RS256', jwk };
    const payload = {
      htm: 'POST',
      htu: `${ISSUER}/token`,
      iat: Math.floor(Date.now() / 1000),
      jti: 'jti-1',
    };
    const encodeSegment = (segment: unknown): string =>
      Buffer.from(JSON.stringify(segment))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    const encoded = `${encodeSegment(header)}.${encodeSegment(payload)}.sig`;
    try {
      parseDpopHeader(encoded);
      throw new Error('parseDpopHeader did not throw');
    } catch (err) {
      expect(err).toBeInstanceOf(DpopValidationError);
      expect((err as DpopValidationError).kind).toBe('header_alg_refused');
    }
  });

  it('parseDpopHeader rejects a proof with non-EC P-256 jwk with header_jwk_refused', () => {
    const header = {
      typ: 'dpop+jwt',
      alg: 'ES256',
      jwk: { kty: 'RSA', crv: 'P-256', x: 'x', y: 'y' },
    };
    const payload = {
      htm: 'POST',
      htu: `${ISSUER}/token`,
      iat: Math.floor(Date.now() / 1000),
      jti: 'jti-1',
    };
    const encodeSegment = (segment: unknown): string =>
      Buffer.from(JSON.stringify(segment))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    const encoded = `${encodeSegment(header)}.${encodeSegment(payload)}.sig`;
    try {
      parseDpopHeader(encoded);
      throw new Error('parseDpopHeader did not throw');
    } catch (err) {
      expect(err).toBeInstanceOf(DpopValidationError);
      expect((err as DpopValidationError).kind).toBe('header_jwk_refused');
    }
  });

  it('assertDpopHeaderShape accepts a valid proof', () => {
    const proof = makeProof({ htm: 'POST', htu: `${ISSUER}/token` });
    expect(() => assertDpopHeaderShape(proof)).not.toThrow();
  });

  it('/token returns token_type=DPoP when a valid DPoP header is supplied', async () => {
    const { app, currentTime } = await bootstrap();
    const iat = Math.floor(currentTime / 1000);
    const proof = makeProof({
      htm: 'POST',
      htu: `${ISSUER}/token`,
      iat,
      jti: 'jti-happy',
    });
    const res = await driveAuthorizeAndToken({
      app,
      state: 'dpop-happy',
      dpopHeader: proof.jwt,
    });
    expect(res.status).toBe(200);
    expect(res.body['token_type']).toBe('DPoP');
    expect(typeof res.body['access_token']).toBe('string');
    expect(typeof res.body['refresh_token']).toBe('string');
  });

  it('/token returns token_type=Bearer when no DPoP header is supplied', async () => {
    const { app } = await bootstrap();
    const res = await driveAuthorizeAndToken({ app, state: 'bearer-happy' });
    expect(res.status).toBe(200);
    expect(res.body['token_type']).toBe('Bearer');
  });

  it('/token refuses a DPoP header with the wrong alg with invalid_dpop_proof', async () => {
    const { app } = await bootstrap();
    // Hand-craft a proof with alg=RS256.
    const jwk = createMockDpopJwk();
    const header = { typ: 'dpop+jwt', alg: 'RS256', jwk };
    const payload = {
      htm: 'POST',
      htu: `${ISSUER}/token`,
      iat: Math.floor(Date.now() / 1000),
      jti: 'jti-bad-alg',
    };
    const encodeSegment = (segment: unknown): string =>
      Buffer.from(JSON.stringify(segment))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    const badJwt = `${encodeSegment(header)}.${encodeSegment(payload)}.sig`;
    const res = await driveAuthorizeAndToken({
      app,
      state: 'dpop-bad-alg',
      dpopHeader: badJwt,
    });
    expect(res.status).toBe(400);
    expect(res.body['error']).toBe('invalid_dpop_proof');
    expect(res.body['kind']).toBe('header_alg_refused');
  });
});

describe('axis 2 — htm + htu binding (RFC 9449 §4.3)', () => {
  beforeEach(() => {
    __resetOAuth21Counters();
  });

  it('verifyDpopProofBinding accepts a matching htm + htu', async () => {
    const { currentTime } = await bootstrap();
    const iat = Math.floor(currentTime / 1000);
    const proof = makeProof({
      htm: 'POST',
      htu: `${ISSUER}/token`,
      iat,
      jti: 'jti-match',
    });
    const jkt = verifyDpopProofBinding(proof, {
      expectedHtm: 'POST',
      expectedHtu: `${ISSUER}/token`,
      seenJtis: new Set(),
      now: () => currentTime,
      iatSkewSec: 60,
    });
    expect(jkt).toBe(kiwaComputeJkt(proof.header.jwk));
    expect(jkt).toBe(computeJkt(proof.header.jwk));
  });

  it('verifyDpopProofBinding rejects a htm mismatch with payload_htm_mismatch', async () => {
    const { currentTime } = await bootstrap();
    const iat = Math.floor(currentTime / 1000);
    const proof = makeProof({
      htm: 'GET',
      htu: `${ISSUER}/token`,
      iat,
      jti: 'jti-htm',
    });
    try {
      verifyDpopProofBinding(proof, {
        expectedHtm: 'POST',
        expectedHtu: `${ISSUER}/token`,
        seenJtis: new Set(),
        now: () => currentTime,
        iatSkewSec: 60,
      });
      throw new Error('verifyDpopProofBinding did not throw');
    } catch (err) {
      expect(err).toBeInstanceOf(DpopValidationError);
      expect((err as DpopValidationError).kind).toBe('payload_htm_mismatch');
    }
  });

  it('verifyDpopProofBinding rejects a htu mismatch with payload_htu_mismatch', async () => {
    const { currentTime } = await bootstrap();
    const iat = Math.floor(currentTime / 1000);
    const proof = makeProof({
      htm: 'POST',
      htu: `${ISSUER}/introspect`,
      iat,
      jti: 'jti-htu',
    });
    try {
      verifyDpopProofBinding(proof, {
        expectedHtm: 'POST',
        expectedHtu: `${ISSUER}/token`,
        seenJtis: new Set(),
        now: () => currentTime,
        iatSkewSec: 60,
      });
      throw new Error('verifyDpopProofBinding did not throw');
    } catch (err) {
      expect(err).toBeInstanceOf(DpopValidationError);
      expect((err as DpopValidationError).kind).toBe('payload_htu_mismatch');
    }
  });

  it('/token refuses a DPoP proof whose htu points at a different endpoint', async () => {
    const { app, currentTime } = await bootstrap();
    const iat = Math.floor(currentTime / 1000);
    const proof = makeProof({
      htm: 'POST',
      htu: `${ISSUER}/revoke`,
      iat,
      jti: 'jti-wrong-htu',
    });
    const res = await driveAuthorizeAndToken({
      app,
      state: 'wrong-htu',
      dpopHeader: proof.jwt,
    });
    expect(res.status).toBe(400);
    expect(res.body['error']).toBe('invalid_dpop_proof');
    expect(res.body['error_description']).toContain('htu mismatch');
  });

  it('/token refuses a DPoP proof whose htm is GET instead of POST', async () => {
    const { app, currentTime } = await bootstrap();
    const iat = Math.floor(currentTime / 1000);
    const proof = makeProof({
      htm: 'GET',
      htu: `${ISSUER}/token`,
      iat,
      jti: 'jti-wrong-htm',
    });
    const res = await driveAuthorizeAndToken({
      app,
      state: 'wrong-htm',
      dpopHeader: proof.jwt,
    });
    expect(res.status).toBe(400);
    expect(res.body['error']).toBe('invalid_dpop_proof');
    expect(res.body['error_description']).toContain('htm mismatch');
  });
});

describe('axis 3 — iat skew tolerance (RFC 9449 §4.3)', () => {
  beforeEach(() => {
    __resetOAuth21Counters();
  });

  it('verifyDpopProofBinding accepts iat exactly at the skew boundary', async () => {
    const { currentTime } = await bootstrap({ dpopIatSkewSec: 60 });
    const nowSec = Math.floor(currentTime / 1000);
    // Boundary case — 60 s past.
    const proof = makeProof({
      htm: 'POST',
      htu: `${ISSUER}/token`,
      iat: nowSec - 60,
      jti: 'jti-boundary-past',
    });
    expect(() =>
      verifyDpopProofBinding(proof, {
        expectedHtm: 'POST',
        expectedHtu: `${ISSUER}/token`,
        seenJtis: new Set(),
        now: () => currentTime,
        iatSkewSec: 60,
      }),
    ).not.toThrow();
  });

  it('verifyDpopProofBinding rejects iat past the skew boundary with payload_iat_skew', async () => {
    const { currentTime } = await bootstrap({ dpopIatSkewSec: 60 });
    const nowSec = Math.floor(currentTime / 1000);
    const proof = makeProof({
      htm: 'POST',
      htu: `${ISSUER}/token`,
      iat: nowSec - 120,
      jti: 'jti-too-old',
    });
    try {
      verifyDpopProofBinding(proof, {
        expectedHtm: 'POST',
        expectedHtu: `${ISSUER}/token`,
        seenJtis: new Set(),
        now: () => currentTime,
        iatSkewSec: 60,
      });
      throw new Error('verifyDpopProofBinding did not throw');
    } catch (err) {
      expect(err).toBeInstanceOf(DpopValidationError);
      expect((err as DpopValidationError).kind).toBe('payload_iat_skew');
    }
  });

  it('verifyDpopProofBinding rejects future-skew iat with payload_iat_skew', async () => {
    const { currentTime } = await bootstrap({ dpopIatSkewSec: 60 });
    const nowSec = Math.floor(currentTime / 1000);
    const proof = makeProof({
      htm: 'POST',
      htu: `${ISSUER}/token`,
      iat: nowSec + 120,
      jti: 'jti-future',
    });
    try {
      verifyDpopProofBinding(proof, {
        expectedHtm: 'POST',
        expectedHtu: `${ISSUER}/token`,
        seenJtis: new Set(),
        now: () => currentTime,
        iatSkewSec: 60,
      });
      throw new Error('verifyDpopProofBinding did not throw');
    } catch (err) {
      expect(err).toBeInstanceOf(DpopValidationError);
      expect((err as DpopValidationError).kind).toBe('payload_iat_skew');
    }
  });

  it('/token refuses a DPoP proof with iat far in the past', async () => {
    const { app, currentTime } = await bootstrap({ dpopIatSkewSec: 60 });
    const nowSec = Math.floor(currentTime / 1000);
    const proof = makeProof({
      htm: 'POST',
      htu: `${ISSUER}/token`,
      iat: nowSec - 3600,
      jti: 'jti-stale',
    });
    const res = await driveAuthorizeAndToken({
      app,
      state: 'stale-iat',
      dpopHeader: proof.jwt,
    });
    expect(res.status).toBe(400);
    expect(res.body['error']).toBe('invalid_dpop_proof');
    expect(res.body['error_description']).toContain('iat outside allowed skew');
  });
});

describe('axis 4 — jti replay guard (RFC 9449 §4.3)', () => {
  beforeEach(() => {
    __resetOAuth21Counters();
  });

  it('verifyDpopProofBinding rejects a second proof carrying an already-seen jti', async () => {
    const { currentTime } = await bootstrap();
    const iat = Math.floor(currentTime / 1000);
    const seenJtis = new Set<string>();
    const first = makeProof({
      htm: 'POST',
      htu: `${ISSUER}/token`,
      iat,
      jti: 'jti-once',
    });
    verifyDpopProofBinding(first, {
      expectedHtm: 'POST',
      expectedHtu: `${ISSUER}/token`,
      seenJtis,
      now: () => currentTime,
      iatSkewSec: 60,
    });
    // Second proof reuses the jti.
    const second = makeProof({
      htm: 'POST',
      htu: `${ISSUER}/token`,
      iat,
      jti: 'jti-once',
    });
    try {
      verifyDpopProofBinding(second, {
        expectedHtm: 'POST',
        expectedHtu: `${ISSUER}/token`,
        seenJtis,
        now: () => currentTime,
        iatSkewSec: 60,
      });
      throw new Error('verifyDpopProofBinding did not throw');
    } catch (err) {
      expect(err).toBeInstanceOf(DpopValidationError);
      expect((err as DpopValidationError).kind).toBe('payload_jti_replay');
    }
  });

  it('verifyDpopProofBinding rejects a proof with missing jti with payload_jti_missing', async () => {
    const { currentTime } = await bootstrap();
    const iat = Math.floor(currentTime / 1000);
    // Hand-craft a proof without jti — kiwa parseDpopProof coerces to
    // empty string, so build the compact JWT manually.
    const jwk = createMockDpopJwk();
    const header = { typ: 'dpop+jwt', alg: 'ES256', jwk };
    const payload = { htm: 'POST', htu: `${ISSUER}/token`, iat, jti: '' };
    const encodeSegment = (segment: unknown): string =>
      Buffer.from(JSON.stringify(segment))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    const encoded = `${encodeSegment(header)}.${encodeSegment(payload)}.sig`;
    const proof = kiwaParseDpopProof(encoded);
    try {
      verifyDpopProofBinding(proof, {
        expectedHtm: 'POST',
        expectedHtu: `${ISSUER}/token`,
        seenJtis: new Set(),
        now: () => currentTime,
        iatSkewSec: 60,
      });
      throw new Error('verifyDpopProofBinding did not throw');
    } catch (err) {
      expect(err).toBeInstanceOf(DpopValidationError);
      expect((err as DpopValidationError).kind).toBe('payload_jti_missing');
    }
  });

  it('/token refuses a second call with the same DPoP jti (replay)', async () => {
    const { adapter, app, currentTime } = await bootstrap();
    // First exchange — sets the jti in the AS registry.
    const iat = Math.floor(currentTime / 1000);
    const jwk = createMockDpopJwk();
    const first = makeProof({
      htm: 'POST',
      htu: `${ISSUER}/token`,
      iat,
      jti: 'jti-replay',
      jwk,
    });
    const firstRes = await driveAuthorizeAndToken({
      app,
      state: 'jti-first',
      dpopHeader: first.jwt,
    });
    expect(firstRes.status).toBe(200);
    // Second exchange — reuses the jti. Even a fresh code must fail.
    const second = makeProof({
      htm: 'POST',
      htu: `${ISSUER}/token`,
      iat,
      jti: 'jti-replay',
      jwk,
    });
    const secondRes = await driveAuthorizeAndToken({
      app,
      state: 'jti-second',
      dpopHeader: second.jwt,
    });
    expect(secondRes.status).toBe(400);
    expect(secondRes.body['error']).toBe('invalid_dpop_proof');
    expect(secondRes.body['error_description']).toContain('replay detected');
    // Trace should record the token failure so the fidelity harness can
    // pin the errorKind on downstream review.
    const failedTokenTrace = adapter
      .traces()
      .find((event) => event.op === 'token' && !event.ok);
    expect(failedTokenTrace).toBeDefined();
  });

  it('/token accepts consecutive DPoP calls with distinct jtis (no false positive)', async () => {
    const { app, currentTime } = await bootstrap();
    const iat = Math.floor(currentTime / 1000);
    const jwk = createMockDpopJwk();
    const p1 = makeProof({
      htm: 'POST',
      htu: `${ISSUER}/token`,
      iat,
      jti: 'jti-a',
      jwk,
    });
    const p2 = makeProof({
      htm: 'POST',
      htu: `${ISSUER}/token`,
      iat,
      jti: 'jti-b',
      jwk,
    });
    const r1 = await driveAuthorizeAndToken({
      app,
      state: 'jti-distinct-1',
      dpopHeader: p1.jwt,
    });
    expect(r1.status).toBe(200);
    expect(r1.body['token_type']).toBe('DPoP');
    const r2 = await driveAuthorizeAndToken({
      app,
      state: 'jti-distinct-2',
      dpopHeader: p2.jwt,
    });
    expect(r2.status).toBe(200);
    expect(r2.body['token_type']).toBe('DPoP');
  });
});

describe('real adapter — DPoP env-skip contract', () => {
  afterEach(() => {
    delete process.env['OAUTH21_BOOTSTRAP'];
    delete process.env['KIWA_MODE'];
    delete process.env['OAUTH21_MOCK_SERVER_URL'];
  });

  it('makeRealAdapter refuses /token DPoP exchange with KIWA_OAUTH21_ENV_MISSING when env is missing', () => {
    const adapter = makeRealAdapter({ forceEnvMissing: true });
    const proof = makeProof({
      htm: 'POST',
      htu: `${ISSUER}/token`,
      iat: Math.floor(Date.now() / 1000),
      jti: 'jti-real-skip',
    });
    expect(() =>
      adapter.token({
        grantType: 'authorization_code',
        code: 'code-1',
        redirectUri: REDIRECT,
        clientId: CLIENT.clientId,
        codeVerifier: 'v'.repeat(43),
        dpop: proof,
      }),
    ).toThrow('KIWA_OAUTH21_ENV_MISSING');
  });
});
