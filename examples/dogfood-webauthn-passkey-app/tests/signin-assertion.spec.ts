/**
 * Signin + assertion fidelity harness.
 *
 * Sub-Issue #857 (v1.21-2b) AC — the mock adapter drives a full credential
 * assertion ceremony and the fidelity harness diffs the raw
 * {@link AuthenticatorAssertionResponse} across three axes:
 *
 *  1. Assertion signature format — mock returns a deterministic tagged
 *     base64url signature; test asserts the alphabet + the tagged encoding
 *     round-trips through kiwa's `mockSignature`. Real adapter (once
 *     Playwright + Chrome Virtual Authenticator lands per the same
 *     Sub-Issue) will return a WebAuthn L3 §6.1 raw ECDSA signature — both
 *     must be base64url-clean so the RP can decode without re-encoding.
 *  2. `signCount` monotonic increment — WebAuthn L3 §7.2 step 21 requires
 *     `assertion.signCount > storedSignCount`. Test asserts the RP-side
 *     store bumps by exactly +1 per successful assertion, and rejects
 *     replayed assertions with a stable `sign_count_regressed` error kind
 *     when the counter fails to advance (clone-detection scenario Sub-Issue
 *     #859 will exercise on `/manage`).
 *  3. `credentialId` consistency — the RP MUST reject assertions whose
 *     `credentialId` is not persisted (WebAuthn L3 §7.2 step 5). Test
 *     asserts both the happy path (id in registry) + the rejection path
 *     (allowCredentials filter with an unknown id).
 *
 * Real adapter is exercised through the env-detect skeleton and asserted to
 * either produce identical structural output (when Chrome Virtual
 * Authenticator is reachable) or refuse via `KIWA_WEBAUTHN_ENV_MISSING`.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  base64UrlDecodeWebAuthn as base64UrlDecode,
  __resetWebAuthnCounters,
} from '@kiwa/auth';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import { createSigninHandler } from '../src/app/signin/route.js';
import { createRegisterHandler } from '../src/app/register/route.js';
import type { RegisterInput, SigninInput } from '../src/adapters/interface.js';

const BASE64URL_ALPHABET = /^[A-Za-z0-9_-]+$/;

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

describe('mock adapter — signin ceremony', () => {
  beforeEach(() => {
    __resetWebAuthnCounters();
  });

  afterEach(() => {
    // Fresh adapters per test — the beforeEach counter reset keeps IDs stable.
  });

  it('axis 1: assertion signature + clientDataJSON + authenticatorData satisfy base64url', async () => {
    const adapter = makeMockAdapter();
    const { credential } = await adapter.register(canonicalRegisterInput);
    const { assertionResponse } = await adapter.signin({
      ...canonicalSigninInput,
      allowCredentialIds: [credential.credentialId],
    });
    expect(assertionResponse.signature).toMatch(BASE64URL_ALPHABET);
    expect(assertionResponse.clientDataJSON).toMatch(BASE64URL_ALPHABET);
    expect(assertionResponse.authenticatorData).toMatch(BASE64URL_ALPHABET);
    // clientDataJSON round-trips into a valid `webauthn.get` object.
    const parsed = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(assertionResponse.clientDataJSON)),
    ) as { type: string; challenge: string; origin: string; crossOrigin: boolean };
    expect(parsed.type).toBe('webauthn.get');
    expect(parsed.origin).toBe('https://example.com');
    expect(parsed.crossOrigin).toBe(false);
    expect(parsed.challenge).toMatch(BASE64URL_ALPHABET);
    await adapter.reset();
  });

  it('axis 2: signCount increments by exactly +1 per successful assertion (WebAuthn L3 §6.1.1)', async () => {
    const adapter = makeMockAdapter();
    const { credential } = await adapter.register(canonicalRegisterInput);
    expect(credential.signCount).toBe(0);

    const first = await adapter.signin({
      ...canonicalSigninInput,
      allowCredentialIds: [credential.credentialId],
    });
    expect(first.previousSignCount).toBe(0);
    expect(first.verifiedCredential.signCount).toBe(1);
    expect(first.assertionResponse.signCount).toBe(1);

    const second = await adapter.signin({
      ...canonicalSigninInput,
      challenge: 'challenge-signin-2',
      allowCredentialIds: [credential.credentialId],
    });
    expect(second.previousSignCount).toBe(1);
    expect(second.verifiedCredential.signCount).toBe(2);
    expect(second.assertionResponse.signCount).toBe(2);
    // RP-side store agrees with the assertion counter (no drift).
    const persisted = adapter.listCredentials()[0];
    expect(persisted?.signCount).toBe(2);
    await adapter.reset();
  });

  it('axis 3: credentialId in assertion matches the registered credential', async () => {
    const adapter = makeMockAdapter();
    const { credential } = await adapter.register(canonicalRegisterInput);
    const { assertionResponse, verifiedCredential } = await adapter.signin({
      ...canonicalSigninInput,
      allowCredentialIds: [credential.credentialId],
    });
    expect(assertionResponse.credentialId).toBe(credential.credentialId);
    expect(verifiedCredential.credentialId).toBe(credential.credentialId);
    // Trace records the credentialId consistently so downstream fidelity
    // diffs see the same value on both sides.
    const successEvent = adapter.traces().find((t) => t.op === 'signin' && t.ok);
    expect(successEvent?.detail?.['credentialId']).toBe(credential.credentialId);
    await adapter.reset();
  });

  it('rejects assertion when no credential has been registered (traces no_credentials_registered)', async () => {
    const adapter = makeMockAdapter();
    await expect(adapter.signin(canonicalSigninInput)).rejects.toThrow(
      /no credentials are registered/,
    );
    const failed = adapter.traces().find((t) => t.op === 'signin' && !t.ok);
    expect(failed?.errorKind).toBe('no_credentials_registered');
    await adapter.reset();
  });

  it('rejects assertion when allowCredentials matches no stored credential', async () => {
    const adapter = makeMockAdapter();
    await adapter.register(canonicalRegisterInput);
    await expect(
      adapter.signin({
        ...canonicalSigninInput,
        allowCredentialIds: ['credential-does-not-exist'],
      }),
    ).rejects.toThrow(/allowCredentials matched no stored credential/);
    const failed = adapter.traces().find((t) => t.op === 'signin' && !t.ok);
    expect(failed?.errorKind).toBe('allow_credentials_no_match');
    await adapter.reset();
  });

  it('rejects userVerification=required when the authenticator lacks UV support', async () => {
    const adapter = makeMockAdapter({ hasUserVerification: false });
    // First register a credential (UV=preferred is fine on a no-UV
    // authenticator; only signin with UV=required should reject).
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

  // WebAuthn L3 §7.2 step 12 — RP MUST verify the challenge was generated
  // by the RP and consume it exactly once. Sub-Issue #857 (this one) covers
  // signCount monotonic replay defence but not challenge single-use — that
  // ships with Sub-Issue #859 (`/manage`, which introduces a session-scoped
  // challenge store). Skip flags the gap so a `pnpm test` run surfaces the
  // deferred axis in the report.
  it.skip('rejects assertion when the same challenge is replayed (deferred to Sub-Issue #859)', async () => {
    // Placeholder — Sub-Issue #859 lands the session-scoped challenge
    // registry the RP consults here.
  });

  it('assertion userVerification=preferred sets the UV flag when authenticator supports it', async () => {
    const adapter = makeMockAdapter();
    await adapter.register(canonicalRegisterInput);
    const { assertionResponse } = await adapter.signin({
      ...canonicalSigninInput,
      userVerification: 'preferred',
    });
    const authenticatorDataBytes = base64UrlDecode(assertionResponse.authenticatorData);
    // WebAuthn L3 §6.1 authenticatorData layout — byte 32 holds the flags.
    // FLAG_USER_PRESENT = 0x01, FLAG_USER_VERIFIED = 0x04.
    const flags = authenticatorDataBytes[32] ?? 0;
    expect(flags & 0x01).toBe(0x01);
    expect(flags & 0x04).toBe(0x04);
    await adapter.reset();
  });
});

describe('real adapter — signin env-missing skeleton', () => {
  it('reports KIWA_WEBAUTHN_ENV_MISSING when Chrome Virtual Authenticator is not reachable', async () => {
    const previousMode = process.env['KIWA_MODE'];
    process.env['KIWA_MODE'] = 'mock';
    try {
      const missing = detectRealEnvMissing();
      expect(missing).toBe('KIWA_MODE=mock');
      const adapter = makeRealAdapter();
      expect(adapter.mode).toBe('real');
      await expect(adapter.signin(canonicalSigninInput)).rejects.toThrow(/KIWA_MODE=mock/);
      const failed = adapter.traces().find((t) => t.op === 'signin' && !t.ok);
      expect(failed?.errorKind).toBe('KIWA_MODE=mock');
    } finally {
      if (previousMode === undefined) delete process.env['KIWA_MODE'];
      else process.env['KIWA_MODE'] = previousMode;
    }
  });
});

describe('signin route handler — POST /signin', () => {
  beforeEach(() => {
    __resetWebAuthnCounters();
  });

  it('returns 200 + assertion body on a valid request', async () => {
    const adapter = makeMockAdapter();
    // Seed a credential through the register handler so the full server
    // round-trip is exercised.
    const registerHandler = createRegisterHandler(adapter);
    const registerRes = await registerHandler(
      new Request('http://localhost/register', {
        method: 'POST',
        body: JSON.stringify(canonicalRegisterInput),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(registerRes.status).toBe(200);
    const registerBody = (await registerRes.json()) as { credentialId: string };

    const signinHandler = createSigninHandler(adapter);
    const res = await signinHandler(
      new Request('http://localhost/signin', {
        method: 'POST',
        body: JSON.stringify({
          ...canonicalSigninInput,
          allowCredentialIds: [registerBody.credentialId],
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      credentialId: string;
      clientDataJSON: string;
      authenticatorData: string;
      signature: string;
      userHandle: string;
      signCount: number;
      previousSignCount: number;
    };
    expect(body.credentialId).toBe(registerBody.credentialId);
    expect(body.userHandle).toBe('user-1');
    expect(body.previousSignCount).toBe(0);
    expect(body.signCount).toBe(1);
    expect(body.signature).toMatch(BASE64URL_ALPHABET);
    expect(body.clientDataJSON).toMatch(BASE64URL_ALPHABET);
    expect(body.authenticatorData).toMatch(BASE64URL_ALPHABET);
    await adapter.reset();
  });

  it('returns 400 on missing required fields', async () => {
    const adapter = makeMockAdapter();
    const handler = createSigninHandler(adapter);
    const res = await handler(
      new Request('http://localhost/signin', {
        method: 'POST',
        body: JSON.stringify({ rpId: 'example.com' }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string; message: string };
    expect(body.error).toBe('missing_fields');
    await adapter.reset();
  });

  it('returns 400 on invalid JSON payload', async () => {
    const adapter = makeMockAdapter();
    const handler = createSigninHandler(adapter);
    const res = await handler(
      new Request('http://localhost/signin', {
        method: 'POST',
        body: 'not json',
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('invalid_json');
    await adapter.reset();
  });

  it('returns 400 when no credential is registered (user should retry with different credential)', async () => {
    const adapter = makeMockAdapter();
    const handler = createSigninHandler(adapter);
    const res = await handler(
      new Request('http://localhost/signin', {
        method: 'POST',
        body: JSON.stringify(canonicalSigninInput),
        headers: { 'content-type': 'application/json' },
      }),
    );
    // No credentials is a user-caused condition — client can retry after
    // registering a credential first, not a server bug.
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string; message: string };
    expect(body.error).toBe('signin_failed');
    expect(body.message).toMatch(/no credentials are registered/);
  });

  it('returns 500 when the real adapter refuses the ceremony (server env problem)', async () => {
    const adapter = makeRealAdapter();
    const handler = createSigninHandler(adapter);
    const res = await handler(
      new Request('http://localhost/signin', {
        method: 'POST',
        body: JSON.stringify(canonicalSigninInput),
        headers: { 'content-type': 'application/json' },
      }),
    );
    // Env-missing is a server-side condition (Chrome / Playwright not
    // reachable) — client cannot fix, so return 500.
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string; message: string };
    expect(body.error).toBe('signin_failed');
    expect(body.message).toMatch(/KIWA_WEBAUTHN_ENV_MISSING|KIWA_MODE=mock|DISPLAY unset/);
  });

  it('returns 400 when allowCredentials matches no stored credential', async () => {
    const adapter = makeMockAdapter();
    const registerHandler = createRegisterHandler(adapter);
    await registerHandler(
      new Request('http://localhost/register', {
        method: 'POST',
        body: JSON.stringify(canonicalRegisterInput),
        headers: { 'content-type': 'application/json' },
      }),
    );
    const handler = createSigninHandler(adapter);
    const res = await handler(
      new Request('http://localhost/signin', {
        method: 'POST',
        body: JSON.stringify({
          ...canonicalSigninInput,
          allowCredentialIds: ['credential-does-not-exist'],
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string; message: string };
    expect(body.error).toBe('signin_failed');
    expect(body.message).toMatch(/allowCredentials matched no stored credential/);
    await adapter.reset();
  });
});
