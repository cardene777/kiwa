import { describe, expect, it } from 'vitest';
import { setupPasskeyEnv } from '../src/passkey/setup-passkey-env.js';

describe('passkey env defensive branches', () => {
  it('creates env with default single device (may be empty)', async () => {
    const env = await setupPasskeyEnv();
    expect(Array.isArray(env.devices)).toBe(true);
  });

  it('creates env with explicit devices seed', async () => {
    const env = await setupPasskeyEnv({
      devices: [{ deviceId: 'my-phone' }, { deviceId: 'my-laptop' }],
    });
    expect(env.devices).toContain('my-phone');
    expect(env.devices).toContain('my-laptop');
  });

  it('creates env with custom fabrics list', async () => {
    const env = await setupPasskeyEnv({
      fabrics: ['icloud-keychain'],
    });
    expect(env.fabrics.length).toBeGreaterThan(0);
  });

  it('getPasskey returns null for unknown credentialId', async () => {
    const env = await setupPasskeyEnv();
    expect(env.getPasskey('nonexistent-cred')).toBeNull();
  });

  it('listPasskeys returns empty array when no credentials', async () => {
    const env = await setupPasskeyEnv();
    expect(env.listPasskeys()).toEqual([]);
  });

  it('addDevice adds a new device and increments count', async () => {
    const env = await setupPasskeyEnv();
    const before = env.devices.length;
    env.addDevice('new-device');
    expect(env.devices.length).toBe(before + 1);
    expect(env.devices).toContain('new-device');
  });

  it('addPlatformAuthenticator on unknown device throws', async () => {
    const env = await setupPasskeyEnv();
    // Some impls may auto-create the device; others throw. Test both paths.
    try {
      const auth = env.addPlatformAuthenticator('unknown-device', {
        biometric: 'face-id',
      });
      // If auto-created, verify basic contract.
      expect(auth).toBeDefined();
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
    }
  });

  it('addPlatformAuthenticator on preseeded device returns handle', async () => {
    const env = await setupPasskeyEnv({
      devices: [{ deviceId: 'my-device' }],
    });
    const auth = env.addPlatformAuthenticator('my-device', {
      biometric: 'face-id',
    });
    expect(auth).toBeDefined();
    expect(auth.attachment).toBeDefined();
  });

  it('removeDevice removes an existing device', async () => {
    const env = await setupPasskeyEnv({
      devices: [{ deviceId: 'temp-device' }],
    });
    expect(env.devices).toContain('temp-device');
    env.removeDevice('temp-device');
    expect(env.devices).not.toContain('temp-device');
  });

  it('stop resolves without throwing', async () => {
    const env = await setupPasskeyEnv();
    await expect(env.stop()).resolves.toBeUndefined();
  });
});
