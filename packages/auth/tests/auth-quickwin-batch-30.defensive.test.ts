import { describe, expect, it } from 'vitest';
import { createSyncFabric } from '../src/passkey/sync-fabric.js';
import { createPlatformAuthenticator } from '../src/passkey/platform.js';
import { createRoamingAuthenticator } from '../src/passkey/roaming.js';

describe('passkey/sync-fabric defensive branches', () => {
  it('throws on unknown vendor', () => {
    expect(() => createSyncFabric('unknown-vendor' as never)).toThrow(
      /unknown vendor .* expected icloud-keychain or google-password-manager/,
    );
  });

  it('restore returns null when credential is not in the fabric', () => {
    const fabric = createSyncFabric('icloud-keychain');
    expect(fabric.restore('nonexistent')).toBeNull();
  });

  it('evict returns false when credential was never backed up', () => {
    const fabric = createSyncFabric('icloud-keychain');
    expect(fabric.evict('nonexistent')).toBe(false);
  });

  it('list returns empty array for a fresh fabric', () => {
    const fabric = createSyncFabric('icloud-keychain');
    expect(fabric.list()).toHaveLength(0);
  });

  it('size returns 0 for a fresh fabric', () => {
    const fabric = createSyncFabric('google-password-manager');
    expect(fabric.size()).toBe(0);
  });
});

describe('passkey/platform + roaming isUserPresent optional', () => {
  it('createPlatformAuthenticator accepts explicit isUserPresent', () => {
    const result = createPlatformAuthenticator({
      biometric: 'face-id',
      biometricAvailable: true,
      isUserPresent: false,
    });
    expect(result.handle.isUserPresent).toBe(false);
  });

  it('createPlatformAuthenticator without isUserPresent uses default', () => {
    const result = createPlatformAuthenticator({
      biometric: 'face-id',
      biometricAvailable: true,
    });
    expect(typeof result.handle.isUserPresent).toBe('boolean');
  });

  it('createRoamingAuthenticator accepts explicit isUserPresent', () => {
    const result = createRoamingAuthenticator({
      kind: 'security-key',
      isUserPresent: false,
    });
    expect(result.handle.isUserPresent).toBe(false);
  });

  it('createRoamingAuthenticator without isUserPresent uses default', () => {
    const result = createRoamingAuthenticator({ kind: 'security-key' });
    expect(typeof result.handle.isUserPresent).toBe('boolean');
  });
});
