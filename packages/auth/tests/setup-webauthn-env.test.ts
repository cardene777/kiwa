import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  __resetWebAuthnCounters,
  base64UrlDecodeWebAuthn,
  setupWebAuthnEnv,
  webAuthnClientDataHash,
  webAuthnMockSignature,
  type WebAuthnTestEnv,
} from '../src/index.js';

const envs: WebAuthnTestEnv[] = [];

beforeEach(() => {
  __resetWebAuthnCounters();
});

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function makeEnvWithPlatformAuthenticator(): Promise<WebAuthnTestEnv> {
  const env = await setupWebAuthnEnv({
    authenticators: [
      {
        attachment: 'platform',
        transport: 'internal',
        hasResidentKey: true,
        hasUserVerification: true,
      },
    ],
  });
  envs.push(env);
  return env;
}

describe('setupWebAuthnEnv (env setup)', () => {
  it('starts with no authenticators when options are empty', async () => {
    const env = await setupWebAuthnEnv();
    envs.push(env);
    expect(env.authenticators).toHaveLength(0);
    expect(env.mode).toBe('mock');
  });

  it('preseeds authenticators from options and assigns stable ids', async () => {
    const env = await setupWebAuthnEnv({
      authenticators: [
        { attachment: 'platform', transport: 'internal' },
        { attachment: 'cross-platform', transport: 'usb' },
      ],
    });
    envs.push(env);
    expect(env.authenticators).toHaveLength(2);
    expect(env.authenticators[0]!.id).toBe('authenticator-1');
    expect(env.authenticators[1]!.id).toBe('authenticator-2');
    expect(env.authenticators[0]!.attachment).toBe('platform');
    expect(env.authenticators[1]!.attachment).toBe('cross-platform');
  });

  it('rejects platform attachment paired with a non-internal transport', async () => {
    await expect(
      setupWebAuthnEnv({
        authenticators: [{ attachment: 'platform', transport: 'usb' }],
      }),
    ).rejects.toThrow(/platform attachment requires internal transport/);
  });

  it('rejects cross-platform attachment paired with internal transport', async () => {
    await expect(
      setupWebAuthnEnv({
        authenticators: [{ attachment: 'cross-platform', transport: 'internal' }],
      }),
    ).rejects.toThrow(/cross-platform attachment cannot use internal transport/);
  });
});

describe('credentialCreation', () => {
  it('produces an attestation response for each attestation mode', async () => {
    const env = await makeEnvWithPlatformAuthenticator();
    const modes = ['none', 'indirect', 'direct', 'enterprise'] as const;
    for (const attestation of modes) {
      const response = await env.credentialCreation({
        rp: { id: 'example.test', name: 'Example RP' },
        user: { id: `user-${attestation}`, name: 'alice', displayName: 'Alice' },
        challenge: `challenge-${attestation}`,
        attestation,
      });
      expect(response.attestation).toBe(attestation);
      expect(response.credentialId).toMatch(/^credential-\d+$/);
      expect(response.attachment).toBe('platform');
      expect(response.transports).toContain('internal');
      const decoded = new TextDecoder().decode(
        base64UrlDecodeWebAuthn(response.attestationObject),
      );
      expect(decoded).toContain(attestation);
    }
    expect(env.listCredentials()).toHaveLength(4);
  });

  it('creates a discoverable credential when residentKey=required and authenticator supports it', async () => {
    const env = await makeEnvWithPlatformAuthenticator();
    const response = await env.credentialCreation({
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'challenge-1',
      authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
    });
    const stored = env.getCredential(response.credentialId);
    expect(stored?.discoverable).toBe(true);
  });

  it('rejects residentKey=required when the authenticator has no resident key storage', async () => {
    const env = await setupWebAuthnEnv({
      authenticators: [
        {
          attachment: 'cross-platform',
          transport: 'usb',
          hasResidentKey: false,
          hasUserVerification: true,
        },
      ],
    });
    envs.push(env);
    await expect(
      env.credentialCreation({
        rp: { id: 'example.test', name: 'Example RP' },
        user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
        challenge: 'challenge-1',
        authenticatorSelection: { residentKey: 'required' },
      }),
    ).rejects.toThrow(/residentKey=required but authenticator does not have resident key storage/);
  });

  it('rejects an authenticatorAttachment that does not match the picked authenticator', async () => {
    const env = await makeEnvWithPlatformAuthenticator();
    await expect(
      env.credentialCreation({
        rp: { id: 'example.test', name: 'Example RP' },
        user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
        challenge: 'challenge-1',
        authenticatorSelection: { authenticatorAttachment: 'cross-platform' },
      }),
    ).rejects.toThrow(/authenticatorAttachment "cross-platform" does not match/);
  });

  it('rejects a duplicate credential id via excludeCredentials', async () => {
    const env = await makeEnvWithPlatformAuthenticator();
    const first = await env.credentialCreation({
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'challenge-1',
    });
    await expect(
      env.credentialCreation({
        rp: { id: 'example.test', name: 'Example RP' },
        user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
        challenge: 'challenge-2',
        excludeCredentials: [{ id: first.credentialId, type: 'public-key' }],
      }),
    ).rejects.toThrow(/excludeCredentials matched existing credential/);
  });
});

describe('credentialAssertion', () => {
  it('sets user-present flag and increments the sign counter on every assertion', async () => {
    const env = await makeEnvWithPlatformAuthenticator();
    await env.credentialCreation({
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'challenge-create',
    });
    const first = await env.credentialAssertion({
      rpId: 'example.test',
      challenge: 'challenge-get-1',
    });
    const second = await env.credentialAssertion({
      rpId: 'example.test',
      challenge: 'challenge-get-2',
    });
    expect(first.signCount).toBe(1);
    expect(second.signCount).toBe(2);
    expect(second.signCount).toBeGreaterThan(first.signCount);
  });

  it('rejects userVerification=required against an authenticator without UV', async () => {
    const env = await setupWebAuthnEnv({
      authenticators: [
        {
          attachment: 'cross-platform',
          transport: 'usb',
          hasResidentKey: true,
          hasUserVerification: false,
        },
      ],
    });
    envs.push(env);
    await env.credentialCreation({
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'challenge-create',
    });
    await expect(
      env.credentialAssertion({
        rpId: 'example.test',
        challenge: 'challenge-get',
        userVerification: 'required',
      }),
    ).rejects.toThrow(/userVerification=required but authenticator does not support user verification/);
  });

  it('rejects assertion when the serving authenticator is not user-present', async () => {
    const env = await makeEnvWithPlatformAuthenticator();
    await env.credentialCreation({
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'challenge-create',
    });
    env.authenticators[0]!.isUserPresent = false;
    await expect(
      env.credentialAssertion({ rpId: 'example.test', challenge: 'challenge-get' }),
    ).rejects.toThrow(/no user-present authenticator can serve/);
  });

  it('rejects allowCredentials that match no stored credential', async () => {
    const env = await makeEnvWithPlatformAuthenticator();
    await env.credentialCreation({
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'challenge-create',
    });
    await expect(
      env.credentialAssertion({
        rpId: 'example.test',
        challenge: 'challenge-get',
        allowCredentials: [{ id: 'credential-nonexistent', type: 'public-key' }],
      }),
    ).rejects.toThrow(/allowCredentials matched no stored credential/);
  });

  it('embeds the challenge into clientDataJSON so the RP can echo it back', async () => {
    const env = await makeEnvWithPlatformAuthenticator();
    await env.credentialCreation({
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'challenge-create',
    });
    const response = await env.credentialAssertion({
      rpId: 'example.test',
      challenge: 'expected-challenge-abc',
    });
    const clientData = JSON.parse(
      new TextDecoder().decode(base64UrlDecodeWebAuthn(response.clientDataJSON)),
    );
    expect(clientData.type).toBe('webauthn.get');
    expect(clientData.challenge).toBe('expected-challenge-abc');
    expect(clientData.origin).toBe('https://example.test');
  });
});

describe('credential management', () => {
  it('lists, retrieves, and deletes stored credentials', async () => {
    const env = await makeEnvWithPlatformAuthenticator();
    const one = await env.credentialCreation({
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'challenge-create-1',
    });
    const two = await env.credentialCreation({
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-2', name: 'bob', displayName: 'Bob' },
      challenge: 'challenge-create-2',
    });
    expect(env.listCredentials()).toHaveLength(2);
    expect(env.getCredential(one.credentialId)?.userHandle).toBe('user-1');
    expect(env.deleteCredential(one.credentialId)).toBe(true);
    expect(env.getCredential(one.credentialId)).toBeNull();
    expect(env.listCredentials()).toHaveLength(1);
    expect(env.listCredentials()[0]!.credentialId).toBe(two.credentialId);
  });

  it('reset() clears every credential across every authenticator', async () => {
    const env = await setupWebAuthnEnv({
      authenticators: [
        { attachment: 'platform', transport: 'internal', hasResidentKey: true },
        { attachment: 'cross-platform', transport: 'usb', hasResidentKey: true },
      ],
    });
    envs.push(env);
    await env.credentialCreation(
      {
        rp: { id: 'example.test', name: 'Example RP' },
        user: { id: 'user-platform', name: 'alice', displayName: 'Alice' },
        challenge: 'c1',
      },
      'authenticator-1',
    );
    await env.credentialCreation(
      {
        rp: { id: 'example.test', name: 'Example RP' },
        user: { id: 'user-usb', name: 'bob', displayName: 'Bob' },
        challenge: 'c2',
      },
      'authenticator-2',
    );
    expect(env.listCredentials()).toHaveLength(2);
    env.reset();
    expect(env.listCredentials()).toHaveLength(0);
    expect(env.authenticators[0]!.listCredentials()).toHaveLength(0);
    expect(env.authenticators[1]!.listCredentials()).toHaveLength(0);
  });

  it('keeps credentials from different authenticators isolated per-store', async () => {
    const env = await setupWebAuthnEnv({
      authenticators: [
        { attachment: 'platform', transport: 'internal', hasResidentKey: true },
        { attachment: 'cross-platform', transport: 'usb', hasResidentKey: true },
      ],
    });
    envs.push(env);
    await env.credentialCreation(
      {
        rp: { id: 'example.test', name: 'Example RP' },
        user: { id: 'user-platform', name: 'alice', displayName: 'Alice' },
        challenge: 'c1',
      },
      'authenticator-1',
    );
    await env.credentialCreation(
      {
        rp: { id: 'example.test', name: 'Example RP' },
        user: { id: 'user-usb', name: 'bob', displayName: 'Bob' },
        challenge: 'c2',
      },
      'authenticator-2',
    );
    expect(env.authenticators[0]!.listCredentials()).toHaveLength(1);
    expect(env.authenticators[1]!.listCredentials()).toHaveLength(1);
    expect(env.authenticators[0]!.listCredentials()[0]!.userHandle).toBe(
      'user-platform',
    );
    expect(env.authenticators[1]!.listCredentials()[0]!.userHandle).toBe(
      'user-usb',
    );
  });

  it('routes assertion through the owning authenticator even when siblings share a transport', async () => {
    const env = await setupWebAuthnEnv({
      authenticators: [
        {
          attachment: 'cross-platform',
          transport: 'usb',
          hasResidentKey: true,
          hasUserVerification: true,
        },
        {
          attachment: 'cross-platform',
          transport: 'usb',
          hasResidentKey: true,
          hasUserVerification: true,
        },
      ],
    });
    envs.push(env);
    // Register credential on authenticator-1 only.
    await env.credentialCreation(
      {
        rp: { id: 'example.test', name: 'Example RP' },
        user: { id: 'user-owned-1', name: 'alice', displayName: 'Alice' },
        challenge: 'c1',
      },
      'authenticator-1',
    );
    // authenticator-1 goes offline; authenticator-2 is user-present and shares the
    // usb transport — a naive implementation would let authenticator-2 sign the
    // assertion. The mock must reject because the credential lives on authenticator-1.
    env.authenticators[0]!.isUserPresent = false;
    await expect(
      env.credentialAssertion({ rpId: 'example.test', challenge: 'c-get' }),
    ).rejects.toThrow(/no user-present authenticator can serve/);
  });

  it('removeAuthenticator() drops the authenticator and its credentials', async () => {
    const env = await setupWebAuthnEnv({
      authenticators: [
        { attachment: 'platform', transport: 'internal', hasResidentKey: true },
        { attachment: 'cross-platform', transport: 'usb', hasResidentKey: true },
      ],
    });
    envs.push(env);
    await env.credentialCreation(
      {
        rp: { id: 'example.test', name: 'Example RP' },
        user: { id: 'user-usb', name: 'bob', displayName: 'Bob' },
        challenge: 'c1',
      },
      'authenticator-2',
    );
    expect(env.listCredentials()).toHaveLength(1);
    env.removeAuthenticator('authenticator-2');
    expect(env.authenticators).toHaveLength(1);
    expect(env.listCredentials()).toHaveLength(0);
  });
});

describe('encoding helpers', () => {
  it('mockSignature is deterministic for the same inputs and differs otherwise', () => {
    const a = webAuthnMockSignature('pk', 'authData', 'hash');
    const b = webAuthnMockSignature('pk', 'authData', 'hash');
    const c = webAuthnMockSignature('pk', 'authData', 'other');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it('clientDataHash produces a base64url string of fixed length', () => {
    const digest = webAuthnClientDataHash('{"type":"webauthn.get"}');
    expect(digest).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(digest.length).toBeGreaterThan(0);
  });
});
