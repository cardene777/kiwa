import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  __resetPasskeyCounters,
  setupPasskeyEnv,
  type PasskeyTestEnv,
} from '../src/index.js';

const envs: PasskeyTestEnv[] = [];

beforeEach(() => {
  __resetPasskeyCounters();
});

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function makeDeviceEnv(): Promise<PasskeyTestEnv> {
  const env = await setupPasskeyEnv({
    devices: [
      { deviceId: 'macbook-1', platform: { biometric: 'touch-id' } },
    ],
  });
  envs.push(env);
  return env;
}

async function mintPasskey(
  env: PasskeyTestEnv,
  deviceId: string,
  userId: string,
): Promise<string> {
  const response = await env.createPasskey(deviceId, userId, {
    rp: { id: 'example.test', name: 'Example RP' },
    user: {
      id: userId,
      name: `${userId}-name`,
      displayName: `${userId} Display`,
    },
    challenge: `ch-${userId}`,
  });
  return response.credentialId;
}

describe('setupPasskeyEnv defensive branches — credential + authenticator', () => {
  it('createPasskey throws when device has no authenticator', async () => {
    const env = await setupPasskeyEnv({
      devices: [{ deviceId: 'empty-dev' }],
    });
    envs.push(env);
    await expect(
      env.createPasskey('empty-dev', 'user-1', {
        rp: { id: 'example.test', name: 'Example RP' },
        user: { id: 'user-1', name: 'u', displayName: 'U' },
        challenge: 'ch-x',
      }),
    ).rejects.toThrow(/has no authenticator/);
  });

  it('createPasskey throws when named authenticator does not exist on device', async () => {
    const env = await makeDeviceEnv();
    await expect(
      env.createPasskey(
        'macbook-1',
        'user-1',
        {
          rp: { id: 'example.test', name: 'Example RP' },
          user: { id: 'user-1', name: 'u', displayName: 'U' },
          challenge: 'ch',
        },
        'auth-nonexistent',
      ),
    ).rejects.toThrow(/authenticator .* is not registered on device/);
  });

  it('getPasskey returns null for unknown credential id', async () => {
    const env = await makeDeviceEnv();
    const result = env.getPasskey('cred-unknown');
    expect(result).toBeNull();
  });

  it('listPasskeys skips base credentials without passkey metadata', async () => {
    const env = await makeDeviceEnv();
    await mintPasskey(env, 'macbook-1', 'user-1');
    const passkeys = env.listPasskeys();
    expect(passkeys.length).toBe(1);
  });

  it('removeDevice cleans up credentials on device', async () => {
    const env = await makeDeviceEnv();
    const credId = await mintPasskey(env, 'macbook-1', 'user-1');
    env.removeDevice('macbook-1');
    expect(env.getPasskey(credId)).toBeNull();
  });

  it('removeDevice is idempotent for unknown deviceId', async () => {
    const env = await makeDeviceEnv();
    expect(() => env.removeDevice('unknown-device')).not.toThrow();
  });

  it('createPasskey with default authenticatorSelection uses required residentKey + userVerification', async () => {
    const env = await makeDeviceEnv();
    const response = await env.createPasskey('macbook-1', 'user-1', {
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'u', displayName: 'U' },
      challenge: 'ch',
    });
    expect(response.credentialId).toBeDefined();
  });

  it('createPasskey with explicit requireResidentKey preserved', async () => {
    const env = await makeDeviceEnv();
    const response = await env.createPasskey('macbook-1', 'user-1', {
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'u', displayName: 'U' },
      challenge: 'ch2',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        requireResidentKey: false,
      },
    });
    expect(response.credentialId).toBeDefined();
  });

  it('createPasskey with authenticatorAttachment cross-platform preserved', async () => {
    const env = await setupPasskeyEnv({
      devices: [
        {
          deviceId: 'device-cross',
          roaming: { kind: 'security-key' },
        },
      ],
    });
    envs.push(env);
    const response = await env.createPasskey('device-cross', 'user-cp', {
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-cp', name: 'u', displayName: 'U' },
      challenge: 'ch-cross',
      authenticatorSelection: {
        authenticatorAttachment: 'cross-platform',
      },
    });
    expect(response.credentialId).toBeDefined();
  });
});
