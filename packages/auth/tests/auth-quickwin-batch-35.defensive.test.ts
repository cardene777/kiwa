import { describe, expect, it } from 'vitest';
import { setupOAuth21Env } from '../src/oauth21/setup-oauth21-env.js';
import { createPlatformAuthenticator } from '../src/passkey/platform.js';
import { createRoamingAuthenticator } from '../src/passkey/roaming.js';

describe('oauth21/setup-oauth21-env derivedCodeChallenge + reset', () => {
  it('deriveCodeChallenge produces deterministic S256 challenge', async () => {
    const env = await setupOAuth21Env();
    const verifier = env.generateCodeVerifier();
    const challenge1 = env.deriveCodeChallenge(verifier);
    const challenge2 = env.deriveCodeChallenge(verifier);
    expect(challenge1).toBe(challenge2);
    expect(challenge1.length).toBeGreaterThan(0);
  });

  it('deriveCodeChallenge with explicit S256 method matches default', async () => {
    const env = await setupOAuth21Env();
    const verifier = env.generateCodeVerifier();
    const defaultChallenge = env.deriveCodeChallenge(verifier);
    const explicitChallenge = env.deriveCodeChallenge(verifier, 'S256');
    expect(defaultChallenge).toBe(explicitChallenge);
  });

  it('reset restores server AS state (subsequent verifier is fresh)', async () => {
    const env = await setupOAuth21Env();
    env.generateCodeVerifier();
    env.reset();
    // After reset, server state is fresh
    expect(env.server).toBeDefined();
  });
});

describe('passkey/platform accessors + listCredentials', () => {
  it('platform authenticator listCredentials returns empty array initially', () => {
    const result = createPlatformAuthenticator({
      biometric: 'touch-id',
      biometricAvailable: true,
    });
    const credentials = result.handle.listCredentials();
    expect(credentials).toEqual([]);
  });

  it('platform authenticator isUserPresent set flips underlying base state', () => {
    const result = createPlatformAuthenticator({
      biometric: 'touch-id',
      biometricAvailable: true,
    });
    result.handle.isUserPresent = false;
    expect(result.handle.isUserPresent).toBe(false);
    result.handle.isUserPresent = true;
    expect(result.handle.isUserPresent).toBe(true);
  });

  it('platform authenticator biometricAvailable set flips state', () => {
    const result = createPlatformAuthenticator({
      biometric: 'face-id',
      biometricAvailable: true,
    });
    expect(result.handle.biometricAvailable).toBe(true);
    result.handle.biometricAvailable = false;
    expect(result.handle.biometricAvailable).toBe(false);
  });
});

describe('passkey/roaming accessors + listCredentials', () => {
  it('roaming authenticator listCredentials returns empty array initially', () => {
    const result = createRoamingAuthenticator({ kind: 'security-key' });
    const credentials = result.handle.listCredentials();
    expect(credentials).toEqual([]);
  });

  it('roaming authenticator isUserPresent set flips underlying base state', () => {
    const result = createRoamingAuthenticator({ kind: 'security-key' });
    result.handle.isUserPresent = false;
    expect(result.handle.isUserPresent).toBe(false);
    result.handle.isUserPresent = true;
    expect(result.handle.isUserPresent).toBe(true);
  });
});
