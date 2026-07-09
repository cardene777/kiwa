/**
 * userVerification 4 pattern fidelity harness (Sub-Issue #858, v1.21-2c).
 *
 * WebAuthn L3 §5.4.6 defines three spec values —
 *  - `required` — user verification (biometric / PIN) is mandatory
 *  - `preferred` — request UV, fall through when the authenticator lacks it
 *  - `discouraged` — do not perform UV even on a UV-capable authenticator
 *
 * Sub-Issue #858 adds a fourth kiwa-only sentinel `impossible` that the RP
 * rejects up-front. Real SimpleWebAuthn drivers reject this too because
 * `UserVerificationRequirement` is a closed enum — surfacing the rejection
 * in the mock lets the fidelity harness diff the exact HTTP status + trace
 * `errorKind` a real deployment would return.
 *
 * The harness covers 4 patterns × 2 ceremonies (register + signin) = 8
 * spec-critical tests that satisfy Issue #858 AC #2 (tests/user-verification
 * with 4 pattern × 2 route = 8 test 全 pass). Additional axes below extend
 * coverage to route-handler validation (`?uv=` query param) + the UV bit
 * fidelity assertion the release gate reads (AC #3).
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  base64UrlDecodeWebAuthn as base64UrlDecode,
  __resetWebAuthnCounters,
} from '@kiwa-lab/auth';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { createRegisterHandler, parseUserVerification } from '../src/app/register/route.js';
import { createSigninHandler } from '../src/app/signin/route.js';
import type { RegisterInput, SigninInput } from '../src/adapters/interface.js';
import { DOGFOOD_USER_VERIFICATION_VALUES } from '../src/adapters/interface.js';

const FLAG_USER_PRESENT = 0x01;
const FLAG_USER_VERIFIED = 0x04;

const canonicalRegisterInput: RegisterInput = {
  rp: { id: 'example.com', name: 'Example RP' },
  user: {
    id: 'user-1',
    name: 'alice@example.com',
    displayName: 'Alice',
  },
  challenge: 'challenge-register-1',
  attestation: 'direct',
  authenticatorSelection: {
    authenticatorAttachment: 'platform',
    userVerification: 'preferred',
    residentKey: 'preferred',
  },
};

const canonicalSigninInput: SigninInput = {
  rpId: 'example.com',
  challenge: 'challenge-signin-1',
  userVerification: 'preferred',
};

/**
 * Decode the UV bit off a `webauthn.get` assertion. WebAuthn L3 §6.1 places
 * flags in byte 32 of authenticatorData; `& 0x04` isolates the UV flag.
 */
function readUvBit(authenticatorData: string): boolean {
  const bytes = base64UrlDecode(authenticatorData);
  return ((bytes[32] ?? 0) & FLAG_USER_VERIFIED) === FLAG_USER_VERIFIED;
}

function readUpBit(authenticatorData: string): boolean {
  const bytes = base64UrlDecode(authenticatorData);
  return ((bytes[32] ?? 0) & FLAG_USER_PRESENT) === FLAG_USER_PRESENT;
}

describe('userVerification 4 pattern — register ceremony (AC #1 + #2 half A)', () => {
  beforeEach(() => {
    __resetWebAuthnCounters();
  });

  it('required — succeeds when the authenticator supports UV', async () => {
    const adapter = makeMockAdapter({ hasUserVerification: true });
    const result = await adapter.register({
      ...canonicalRegisterInput,
      authenticatorSelection: {
        ...canonicalRegisterInput.authenticatorSelection,
        userVerification: 'required',
      },
    });
    expect(result.credential.credentialId).toBe('credential-1');
    const success = adapter.traces().find((t) => t.op === 'register' && t.ok);
    expect(success).toBeDefined();
    await adapter.reset();
  });

  it('required — rejects with user_verification_unsupported when UV missing', async () => {
    const adapter = makeMockAdapter({ hasUserVerification: false });
    await expect(
      adapter.register({
        ...canonicalRegisterInput,
        authenticatorSelection: {
          ...canonicalRegisterInput.authenticatorSelection,
          userVerification: 'required',
        },
      }),
    ).rejects.toThrow(/userVerification=required/);
    const failed = adapter.traces().find((t) => t.op === 'register' && !t.ok);
    expect(failed?.errorKind).toBe('user_verification_unsupported');
    await adapter.reset();
  });

  it('preferred — succeeds even when the authenticator lacks UV (fallback)', async () => {
    const adapter = makeMockAdapter({ hasUserVerification: false });
    const result = await adapter.register({
      ...canonicalRegisterInput,
      authenticatorSelection: {
        ...canonicalRegisterInput.authenticatorSelection,
        userVerification: 'preferred',
      },
    });
    expect(result.credential.credentialId).toBe('credential-1');
    await adapter.reset();
  });

  it('discouraged — succeeds on a UV-capable authenticator and marks credential', async () => {
    const adapter = makeMockAdapter({ hasUserVerification: true });
    const result = await adapter.register({
      ...canonicalRegisterInput,
      authenticatorSelection: {
        ...canonicalRegisterInput.authenticatorSelection,
        userVerification: 'discouraged',
      },
    });
    // Discouraged does not fail the ceremony — the authenticator still mints
    // a credential, only the assertion side clears the UV bit.
    expect(result.credential.credentialId).toBe('credential-1');
    await adapter.reset();
  });

  it('impossible — rejects up-front with user_verification_impossible', async () => {
    const adapter = makeMockAdapter({ hasUserVerification: true });
    await expect(
      adapter.register({
        ...canonicalRegisterInput,
        authenticatorSelection: {
          ...canonicalRegisterInput.authenticatorSelection,
          userVerification: 'impossible',
        },
      }),
    ).rejects.toThrow(/userVerification=impossible/);
    const failed = adapter.traces().find((t) => t.op === 'register' && !t.ok);
    expect(failed?.errorKind).toBe('user_verification_impossible');
    await adapter.reset();
  });
});

describe('userVerification 4 pattern — signin ceremony (AC #1 + #2 half B)', () => {
  beforeEach(() => {
    __resetWebAuthnCounters();
  });

  it('required — succeeds + UV bit set when authenticator supports UV', async () => {
    const adapter = makeMockAdapter({ hasUserVerification: true });
    await adapter.register(canonicalRegisterInput);
    const { assertionResponse } = await adapter.signin({
      ...canonicalSigninInput,
      userVerification: 'required',
    });
    expect(readUpBit(assertionResponse.authenticatorData)).toBe(true);
    expect(readUvBit(assertionResponse.authenticatorData)).toBe(true);
    await adapter.reset();
  });

  it('required — rejects with user_verification_unsupported when UV missing', async () => {
    const adapter = makeMockAdapter({ hasUserVerification: false });
    await adapter.register({
      ...canonicalRegisterInput,
      authenticatorSelection: {
        ...canonicalRegisterInput.authenticatorSelection,
        userVerification: 'preferred',
      },
    });
    await expect(
      adapter.signin({
        ...canonicalSigninInput,
        userVerification: 'required',
      }),
    ).rejects.toThrow(/userVerification=required/);
    const failed = adapter.traces().find((t) => t.op === 'signin' && !t.ok);
    expect(failed?.errorKind).toBe('user_verification_unsupported');
    await adapter.reset();
  });

  it('preferred — UV bit set when authenticator supports UV', async () => {
    const adapter = makeMockAdapter({ hasUserVerification: true });
    await adapter.register(canonicalRegisterInput);
    const { assertionResponse } = await adapter.signin({
      ...canonicalSigninInput,
      userVerification: 'preferred',
    });
    expect(readUpBit(assertionResponse.authenticatorData)).toBe(true);
    expect(readUvBit(assertionResponse.authenticatorData)).toBe(true);
    await adapter.reset();
  });

  it('preferred — UV bit cleared when authenticator lacks UV (fallback path)', async () => {
    const adapter = makeMockAdapter({ hasUserVerification: false });
    await adapter.register({
      ...canonicalRegisterInput,
      authenticatorSelection: {
        ...canonicalRegisterInput.authenticatorSelection,
        userVerification: 'preferred',
      },
    });
    const { assertionResponse } = await adapter.signin({
      ...canonicalSigninInput,
      userVerification: 'preferred',
    });
    // UP bit stays set (authenticator still confirms user presence via touch)
    // even when UV cannot be satisfied.
    expect(readUpBit(assertionResponse.authenticatorData)).toBe(true);
    expect(readUvBit(assertionResponse.authenticatorData)).toBe(false);
    await adapter.reset();
  });

  it('discouraged — UV bit cleared even on a UV-capable authenticator (§5.4.6)', async () => {
    const adapter = makeMockAdapter({ hasUserVerification: true });
    await adapter.register(canonicalRegisterInput);
    const { assertionResponse } = await adapter.signin({
      ...canonicalSigninInput,
      userVerification: 'discouraged',
    });
    // WebAuthn L3 §5.4.6 — `discouraged` asks the authenticator to NOT
    // perform user verification even when it is capable. UV bit must be 0.
    expect(readUpBit(assertionResponse.authenticatorData)).toBe(true);
    expect(readUvBit(assertionResponse.authenticatorData)).toBe(false);
    await adapter.reset();
  });

  it('impossible — rejects up-front with user_verification_impossible', async () => {
    const adapter = makeMockAdapter({ hasUserVerification: true });
    await adapter.register(canonicalRegisterInput);
    await expect(
      adapter.signin({
        ...canonicalSigninInput,
        userVerification: 'impossible',
      }),
    ).rejects.toThrow(/userVerification=impossible/);
    const failed = adapter.traces().find((t) => t.op === 'signin' && !t.ok);
    expect(failed?.errorKind).toBe('user_verification_impossible');
    await adapter.reset();
  });
});

describe('userVerification — POST /register + POST /signin route validation', () => {
  beforeEach(() => {
    __resetWebAuthnCounters();
  });

  it('parseUserVerification narrows the four spec values + rejects garbage', () => {
    for (const value of DOGFOOD_USER_VERIFICATION_VALUES) {
      expect(parseUserVerification(value)).toBe(value);
    }
    expect(parseUserVerification(null)).toBeNull();
    expect(parseUserVerification('')).toBeNull();
    expect(parseUserVerification('yes')).toBe('invalid');
    expect(parseUserVerification('REQUIRED')).toBe('invalid');
  });

  it('/register — ?uv=discouraged overrides body userVerification (query wins)', async () => {
    const adapter = makeMockAdapter({ hasUserVerification: true });
    const handler = createRegisterHandler(adapter);
    // Body says preferred but query says discouraged — after the ceremony
    // the assertion side reads the credential back with UV cleared.
    const res = await handler(
      new Request('http://localhost/register?uv=discouraged', {
        method: 'POST',
        body: JSON.stringify(canonicalRegisterInput),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(200);
    const signinHandler = createSigninHandler(adapter);
    const signinRes = await signinHandler(
      new Request('http://localhost/signin?uv=discouraged', {
        method: 'POST',
        body: JSON.stringify(canonicalSigninInput),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(signinRes.status).toBe(200);
    const body = (await signinRes.json()) as { authenticatorData: string };
    expect(readUpBit(body.authenticatorData)).toBe(true);
    expect(readUvBit(body.authenticatorData)).toBe(false);
    await adapter.reset();
  });

  it('/register — ?uv=impossible surfaces as 400 register_failed', async () => {
    const adapter = makeMockAdapter({ hasUserVerification: true });
    const handler = createRegisterHandler(adapter);
    const res = await handler(
      new Request('http://localhost/register?uv=impossible', {
        method: 'POST',
        body: JSON.stringify(canonicalRegisterInput),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string; message: string };
    expect(body.error).toBe('register_failed');
    expect(body.message).toMatch(/userVerification=impossible/);
    await adapter.reset();
  });

  it('/register — invalid ?uv= value returns 400 invalid_user_verification', async () => {
    const adapter = makeMockAdapter({ hasUserVerification: true });
    const handler = createRegisterHandler(adapter);
    const res = await handler(
      new Request('http://localhost/register?uv=yes', {
        method: 'POST',
        body: JSON.stringify(canonicalRegisterInput),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string; message: string };
    expect(body.error).toBe('invalid_user_verification');
    expect(body.message).toContain('required');
    await adapter.reset();
  });

  it('/signin — ?uv=required rejects with 400 signin_failed on non-UV authenticator', async () => {
    const adapter = makeMockAdapter({ hasUserVerification: false });
    const registerHandler = createRegisterHandler(adapter);
    await registerHandler(
      new Request('http://localhost/register', {
        method: 'POST',
        body: JSON.stringify({
          ...canonicalRegisterInput,
          authenticatorSelection: {
            ...canonicalRegisterInput.authenticatorSelection,
            userVerification: 'preferred',
          },
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    const signinHandler = createSigninHandler(adapter);
    const res = await signinHandler(
      new Request('http://localhost/signin?uv=required', {
        method: 'POST',
        body: JSON.stringify(canonicalSigninInput),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string; message: string };
    expect(body.error).toBe('signin_failed');
    expect(body.message).toMatch(/userVerification=required/);
    await adapter.reset();
  });

  it('/signin — ?uv=impossible surfaces as 400 signin_failed', async () => {
    const adapter = makeMockAdapter({ hasUserVerification: true });
    const registerHandler = createRegisterHandler(adapter);
    await registerHandler(
      new Request('http://localhost/register', {
        method: 'POST',
        body: JSON.stringify(canonicalRegisterInput),
        headers: { 'content-type': 'application/json' },
      }),
    );
    const signinHandler = createSigninHandler(adapter);
    const res = await signinHandler(
      new Request('http://localhost/signin?uv=impossible', {
        method: 'POST',
        body: JSON.stringify(canonicalSigninInput),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string; message: string };
    expect(body.error).toBe('signin_failed');
    expect(body.message).toMatch(/userVerification=impossible/);
    await adapter.reset();
  });

  it('/signin — invalid body userVerification returns 400 invalid_user_verification', async () => {
    const adapter = makeMockAdapter({ hasUserVerification: true });
    const signinHandler = createSigninHandler(adapter);
    const res = await signinHandler(
      new Request('http://localhost/signin', {
        method: 'POST',
        body: JSON.stringify({ ...canonicalSigninInput, userVerification: 'garbage' }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('invalid_user_verification');
    await adapter.reset();
  });
});

describe('fidelity axis — UV bit matches caller intent (AC #3)', () => {
  beforeEach(() => {
    __resetWebAuthnCounters();
  });

  it('UV bit table — required/preferred/discouraged × UV-capable authenticator', async () => {
    const cases: Array<{
      uv: 'required' | 'preferred' | 'discouraged';
      expected: boolean;
    }> = [
      { uv: 'required', expected: true },
      { uv: 'preferred', expected: true },
      { uv: 'discouraged', expected: false },
    ];
    for (const c of cases) {
      const adapter = makeMockAdapter({ hasUserVerification: true });
      await adapter.register(canonicalRegisterInput);
      const { assertionResponse } = await adapter.signin({
        ...canonicalSigninInput,
        userVerification: c.uv,
      });
      expect({
        uv: c.uv,
        bit: readUvBit(assertionResponse.authenticatorData),
      }).toEqual({ uv: c.uv, bit: c.expected });
      await adapter.reset();
    }
  });
});
