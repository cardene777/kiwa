import { describe, expect, it } from 'vitest';
import {
  createGoogleProviderMock,
  createGithubProviderMock,
  createEmailProviderMock,
  buildProviderRegistry,
  __resetProviderCounter,
} from '../src/providers.js';
import { setupWebAuthnEnv } from '../src/webauthn/setup-webauthn-env.js';

describe('providers.ts defensive branches', () => {
  it('createEmailProviderMock throws when input has no email', async () => {
    __resetProviderCounter();
    const provider = createEmailProviderMock();
    await expect(provider.signIn(undefined)).rejects.toThrow(/requires an email address/);
    await expect(provider.signIn({})).rejects.toThrow(/requires an email address/);
  });

  it('createEmailProviderMock returns profile when email is supplied', async () => {
    __resetProviderCounter();
    const provider = createEmailProviderMock();
    const profile = await provider.signIn({ email: 'user@example.com' });
    expect(profile.email).toBe('user@example.com');
    expect(profile.provider).toBe('email');
  });

  it('buildProviderRegistry composes all 3 known kinds', () => {
    const registry = buildProviderRegistry(['google', 'github', 'email']);
    expect(registry.google).toBeDefined();
    expect(registry.github).toBeDefined();
    expect(registry.email).toBeDefined();
  });

  it('buildProviderRegistry throws for unknown provider kind', () => {
    expect(() => buildProviderRegistry(['x-unknown' as never])).toThrow(/Unknown provider kind/);
  });

  it('providers preserve name when supplied in input', async () => {
    __resetProviderCounter();
    const provider = createGoogleProviderMock();
    const profile = await provider.signIn({ name: 'John Doe', email: 'j@example.com' });
    expect(profile.name).toBe('John Doe');
  });

  it('providers use synthetic providerAccountId when sub is missing', async () => {
    __resetProviderCounter();
    const provider = createGithubProviderMock();
    const profile = await provider.signIn(undefined);
    expect(profile.providerAccountId).toContain('github-');
  });
});

describe('webauthn/setup-webauthn-env defensive branches', () => {
  it('credentialCreation throws when no authenticator is available', async () => {
    const env = await setupWebAuthnEnv();
    await expect(
      env.credentialCreation({
        rp: { id: 'example.com', name: 'RP' },
        user: { id: new Uint8Array([1]), name: 'u', displayName: 'U' },
        challenge: new Uint8Array([1, 2, 3]),
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      }),
    ).rejects.toThrow(/no authenticator available/);
  });

  it('credentialCreation throws when explicit authenticatorId is unknown', async () => {
    const env = await setupWebAuthnEnv({
      authenticators: [
        { attachment: 'platform', transport: 'internal', hasResidentKey: true },
      ],
    });
    await expect(
      env.credentialCreation(
        {
          rp: { id: 'example.com', name: 'RP' },
          user: { id: new Uint8Array([1]), name: 'u', displayName: 'U' },
          challenge: new Uint8Array([1, 2, 3]),
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        },
        'unknown-authenticator-id',
      ),
    ).rejects.toThrow(/unknown authenticatorId/);
  });

  it('removeAuthenticator is no-op when id is not found', async () => {
    const env = await setupWebAuthnEnv({
      authenticators: [
        { attachment: 'platform', transport: 'internal', hasResidentKey: true },
      ],
    });
    expect(() => env.removeAuthenticator('not-registered')).not.toThrow();
    expect(env.authenticators.length).toBe(1);
  });

  it('addAuthenticator + removeAuthenticator round-trip cleans credential stores', async () => {
    const env = await setupWebAuthnEnv();
    const authenticator = env.addAuthenticator({
      attachment: 'platform',
      transport: 'internal',
      hasResidentKey: true,
    });
    expect(env.authenticators.length).toBe(1);
    env.removeAuthenticator(authenticator.id);
    expect(env.authenticators.length).toBe(0);
  });

  it('deleteCredential returns false when credentialId is not registered', async () => {
    const env = await setupWebAuthnEnv({
      authenticators: [
        { attachment: 'platform', transport: 'internal', hasResidentKey: true },
      ],
    });
    expect(env.deleteCredential('nonexistent-cred')).toBe(false);
  });

  it('getCredential returns null when credentialId is not registered', async () => {
    const env = await setupWebAuthnEnv();
    expect(env.getCredential('nonexistent-cred')).toBeNull();
  });

  it('reset clears all internal state', async () => {
    const env = await setupWebAuthnEnv({
      authenticators: [
        { attachment: 'platform', transport: 'internal', hasResidentKey: true },
      ],
    });
    env.reset();
    expect(env.listCredentials()).toHaveLength(0);
  });

  it('stop clears all state and empties authenticators', async () => {
    const env = await setupWebAuthnEnv({
      authenticators: [
        { attachment: 'platform', transport: 'internal', hasResidentKey: true },
      ],
    });
    await env.stop();
    expect(env.authenticators.length).toBe(0);
  });
});
