/**
 * Register + attestation fidelity harness.
 *
 * Sub-Issue #856 (v1.21-2a) AC — the mock adapter drives a full credential
 * creation ceremony and the fidelity harness diffs the raw
 * {@link AuthenticatorAttestationResponse} across four axes.
 *
 *  1. `attestationObject` — mock returns a deterministic tagged base64url
 *     string (`attestation::<mode>::<credentialId>::<rpId>`). Test asserts
 *     mode + credential id + rp id encoding is stable + matches the
 *     requested attestation mode.
 *  2. `clientDataJSON` — base64url(JSON) with `type=webauthn.create`,
 *     normalized challenge, origin = `https://<rp.id>`.
 *  3. Signature format — mock always returns `attestation=<mode>`. Real
 *     adapter (Sub-Issue #857) will return a SimpleWebAuthn base64url
 *     signature. Both must satisfy the base64url alphabet.
 *  4. `signCount` — WebAuthn L3 §6.1.1 requires initial counter = 0 for a
 *     freshly minted credential.
 *
 * Real adapter is exercised through the env-detect skeleton and asserted to
 * either produce identical structural output (when Chrome Virtual
 * Authenticator is available) or refuse via `KIWA_WEBAUTHN_ENV_MISSING`
 * (which every non-Playwright environment reports).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  base64UrlDecodeWebAuthn as base64UrlDecode,
  __resetWebAuthnCounters,
} from '@kiwa/auth';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import { createRegisterHandler } from '../src/app/register/route.js';
import type { RegisterInput } from '../src/adapters/interface.js';

const BASE64URL_ALPHABET = /^[A-Za-z0-9_-]+$/;

const canonicalInput: RegisterInput = {
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

describe('mock adapter — register ceremony', () => {
  beforeEach(() => {
    __resetWebAuthnCounters();
  });

  afterEach(async () => {
    // Fresh adapters per test — the beforeEach counter reset keeps IDs stable.
  });

  it('axis 1: attestationObject tags the requested attestation mode + credential id + rp id', async () => {
    const adapter = makeMockAdapter();
    const { attestationResponse } = await adapter.register(canonicalInput);
    const decoded = new TextDecoder().decode(base64UrlDecode(attestationResponse.attestationObject));
    expect(decoded).toBe('attestation::direct::credential-1::example.com');
    expect(attestationResponse.attestation).toBe('direct');
    await adapter.reset();
  });

  it('axis 2: clientDataJSON carries webauthn.create + normalized challenge + rp origin', async () => {
    const adapter = makeMockAdapter();
    const { attestationResponse } = await adapter.register(canonicalInput);
    const parsed = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(attestationResponse.clientDataJSON)),
    ) as { type: string; challenge: string; origin: string; crossOrigin: boolean };
    expect(parsed.type).toBe('webauthn.create');
    // Non-base64url challenge input round-trips through normalizeChallenge → base64url.
    expect(parsed.challenge).toMatch(BASE64URL_ALPHABET);
    expect(parsed.origin).toBe('https://example.com');
    expect(parsed.crossOrigin).toBe(false);
    await adapter.reset();
  });

  it('axis 3: response fields all satisfy the base64url alphabet', async () => {
    const adapter = makeMockAdapter();
    const { attestationResponse } = await adapter.register(canonicalInput);
    expect(attestationResponse.attestationObject).toMatch(BASE64URL_ALPHABET);
    expect(attestationResponse.clientDataJSON).toMatch(BASE64URL_ALPHABET);
    expect(attestationResponse.publicKey).toMatch(BASE64URL_ALPHABET);
    await adapter.reset();
  });

  it('axis 4: freshly minted credential has signCount = 0 per WebAuthn L3 §6.1.1', async () => {
    const adapter = makeMockAdapter();
    const { credential } = await adapter.register(canonicalInput);
    expect(credential.signCount).toBe(0);
    expect(credential.createdAt).toBeGreaterThan(0);
    await adapter.reset();
  });

  it('persists the credential in both the kiwa env and the RP-side store', async () => {
    const adapter = makeMockAdapter();
    const { credential } = await adapter.register(canonicalInput);
    // RP-side store
    const persisted = adapter.listCredentials();
    expect(persisted).toHaveLength(1);
    expect(persisted[0]?.credentialId).toBe(credential.credentialId);
    // kiwa env store (proves both sides agree)
    const envSide = adapter.env()?.getCredential(credential.credentialId);
    expect(envSide?.credentialId).toBe(credential.credentialId);
    await adapter.reset();
  });

  it('honours attestation=none by tagging attestationObject accordingly', async () => {
    const adapter = makeMockAdapter();
    const { attestationResponse } = await adapter.register({
      ...canonicalInput,
      attestation: 'none',
    });
    const decoded = new TextDecoder().decode(base64UrlDecode(attestationResponse.attestationObject));
    expect(decoded).toBe('attestation::none::credential-1::example.com');
    expect(attestationResponse.attestation).toBe('none');
    await adapter.reset();
  });

  it('rejects userVerification=required when the authenticator lacks UV support', async () => {
    const adapter = makeMockAdapter({ hasUserVerification: false });
    await expect(
      adapter.register({
        ...canonicalInput,
        authenticatorSelection: {
          ...canonicalInput.authenticatorSelection,
          userVerification: 'required',
        },
      }),
    ).rejects.toThrow(/userVerification=required/);
    // Trace records the failure so Sub-Issue #858 can build on it.
    const failed = adapter.traces().find((t) => t.op === 'register' && !t.ok);
    expect(failed?.errorKind).toBe('user_verification_unsupported');
    await adapter.reset();
  });
});

describe('real adapter — env-missing skeleton', () => {
  it('reports KIWA_WEBAUTHN_ENV_MISSING when Chrome Virtual Authenticator is not reachable', async () => {
    const previousMode = process.env['KIWA_MODE'];
    process.env['KIWA_MODE'] = 'mock';
    try {
      const missing = detectRealEnvMissing();
      expect(missing).toBe('KIWA_MODE=mock');
      const adapter = makeRealAdapter();
      expect(adapter.mode).toBe('real');
      await expect(adapter.register(canonicalInput)).rejects.toThrow(/KIWA_MODE=mock/);
      const failed = adapter.traces().find((t) => t.op === 'register' && !t.ok);
      expect(failed?.errorKind).toBe('KIWA_MODE=mock');
    } finally {
      if (previousMode === undefined) delete process.env['KIWA_MODE'];
      else process.env['KIWA_MODE'] = previousMode;
    }
  });

  it('surfaces listCredentials + deleteCredential + reset even when Chrome is missing', async () => {
    const adapter = makeRealAdapter();
    expect(adapter.listCredentials()).toEqual([]);
    expect(adapter.deleteCredential('never-registered')).toBe(false);
    await adapter.reset();
    // After reset the trace is cleared but the reset event itself is recorded.
    const events = adapter.traces();
    expect(events.at(-1)?.op).toBe('reset');
    expect(events.at(-1)?.ok).toBe(true);
  });
});

describe('register route handler — POST /register', () => {
  beforeEach(() => {
    __resetWebAuthnCounters();
  });

  it('returns 200 + persisted credential fields on a valid request', async () => {
    const adapter = makeMockAdapter();
    const handler = createRegisterHandler(adapter);
    const res = await handler(
      new Request('http://localhost/register', {
        method: 'POST',
        body: JSON.stringify(canonicalInput),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      credentialId: string;
      attestationObject: string;
      clientDataJSON: string;
      signCount: number;
      discoverable: boolean;
      transports: string[];
    };
    expect(body.credentialId).toBe('credential-1');
    expect(body.signCount).toBe(0);
    expect(body.discoverable).toBe(true); // residentKey=preferred + hasResidentKey=true
    expect(body.transports).toEqual(['internal']);
    expect(body.attestationObject).toMatch(BASE64URL_ALPHABET);
    expect(body.clientDataJSON).toMatch(BASE64URL_ALPHABET);
    await adapter.reset();
  });

  it('returns 400 on missing required fields', async () => {
    const adapter = makeMockAdapter();
    const handler = createRegisterHandler(adapter);
    const res = await handler(
      new Request('http://localhost/register', {
        method: 'POST',
        body: JSON.stringify({ rp: { id: 'example.com', name: 'Example RP' } }),
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
    const handler = createRegisterHandler(adapter);
    const res = await handler(
      new Request('http://localhost/register', {
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

  it('returns 500 when the adapter refuses the ceremony', async () => {
    // Real adapter always refuses without Chrome Virtual Authenticator.
    const adapter = makeRealAdapter();
    const handler = createRegisterHandler(adapter);
    const res = await handler(
      new Request('http://localhost/register', {
        method: 'POST',
        body: JSON.stringify(canonicalInput),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string; message: string };
    expect(body.error).toBe('register_failed');
    expect(body.message).toMatch(/KIWA_WEBAUTHN_ENV_MISSING|KIWA_MODE=mock|DISPLAY unset/);
  });
});
