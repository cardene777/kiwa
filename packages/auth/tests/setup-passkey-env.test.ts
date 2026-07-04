import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  __resetPasskeyCounters,
  backupPasskeyCredential,
  createPlatformAuthenticator,
  createRoamingAuthenticator,
  createSyncFabric,
  findPasskeyFabricHolding,
  requirePasskeyFabric,
  restorePasskeyCredential,
  setupPasskeyEnv,
  syncPasskeyCredentials,
  type PasskeyCredential,
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

async function makeEnvWithTouchIdDevice(): Promise<PasskeyTestEnv> {
  const env = await setupPasskeyEnv({
    devices: [
      {
        deviceId: 'macbook-1',
        platform: { biometric: 'touch-id' },
      },
    ],
  });
  envs.push(env);
  return env;
}

async function mintPasskey(
  env: PasskeyTestEnv,
  deviceId: string,
  userId: string,
  suffix: string,
): Promise<string> {
  const response = await env.createPasskey(deviceId, userId, {
    rp: { id: 'example.test', name: 'Example RP' },
    user: { id: userId, name: `${userId}-name`, displayName: `${userId} Display` },
    challenge: `challenge-${suffix}`,
  });
  return response.credentialId;
}

describe('platform authenticator', () => {
  it('mounts a Touch ID authenticator with biometric UV and platform attachment', async () => {
    const env = await makeEnvWithTouchIdDevice();
    const [authenticator] = env.listAuthenticators('macbook-1');
    if (!authenticator || authenticator.kind !== 'platform') {
      throw new Error('expected a platform authenticator');
    }
    expect(authenticator.biometric).toBe('touch-id');
    expect(authenticator.attachment).toBe('platform');
    expect(authenticator.transport).toBe('internal');
    expect(authenticator.hasResidentKey).toBe(true);
    expect(authenticator.hasUserVerification).toBe(true);
  });

  it('supports every biometric modality (touch-id / face-id / windows-hello / android-biometric)', async () => {
    const env = await setupPasskeyEnv({
      devices: [
        { deviceId: 'phone-ios', platform: { biometric: 'face-id' } },
        { deviceId: 'laptop-win', platform: { biometric: 'windows-hello' } },
        { deviceId: 'phone-android', platform: { biometric: 'android-biometric' } },
      ],
    });
    envs.push(env);
    expect(
      env
        .listAuthenticators('phone-ios')
        .filter((auth) => auth.kind === 'platform')[0]?.biometric,
    ).toBe('face-id');
    expect(
      env
        .listAuthenticators('laptop-win')
        .filter((auth) => auth.kind === 'platform')[0]?.biometric,
    ).toBe('windows-hello');
    expect(
      env
        .listAuthenticators('phone-android')
        .filter((auth) => auth.kind === 'platform')[0]?.biometric,
    ).toBe('android-biometric');
  });

  it('marks the authenticator UV=false when biometric is unavailable and rejects UV=required assertions', async () => {
    const env = await setupPasskeyEnv({
      devices: [
        {
          deviceId: 'macbook-locked',
          platform: { biometric: 'touch-id', biometricAvailable: false },
        },
      ],
    });
    envs.push(env);
    const [authenticator] = env.listAuthenticators('macbook-locked');
    if (!authenticator || authenticator.kind !== 'platform') {
      throw new Error('expected a platform authenticator');
    }
    expect(authenticator.hasUserVerification).toBe(false);
    expect(authenticator.biometricAvailable).toBe(false);
    await env.createPasskey('macbook-locked', 'user-1', {
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'c1',
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
    });
    await expect(
      env.authenticate('macbook-locked', {
        rpId: 'example.test',
        challenge: 'c-get',
        userVerification: 'required',
      }),
    ).rejects.toThrow(/userVerification=required but authenticator does not support/);
  });

  it('rejects hasResidentKey=false on a platform authenticator', () => {
    expect(() =>
      createPlatformAuthenticator({
        biometric: 'touch-id',
        hasResidentKey: false as unknown as true,
      }),
    ).toThrow(/passkeys require hasResidentKey=true/);
  });

  it('rejects an unknown biometric modality', () => {
    expect(() =>
      createPlatformAuthenticator({
        biometric: 'iris-scanner' as unknown as 'touch-id',
      }),
    ).toThrow(/unknown biometric "iris-scanner"/);
  });
});

describe('roaming authenticator', () => {
  it('mounts a security-key authenticator with usb transport and cross-platform attachment', async () => {
    const env = await setupPasskeyEnv({
      devices: [
        {
          deviceId: 'macbook-1',
          platform: { biometric: 'touch-id' },
          roaming: { kind: 'security-key' },
        },
      ],
    });
    envs.push(env);
    const authenticators = env.listAuthenticators('macbook-1');
    const roaming = authenticators.find((auth) => auth.kind === 'roaming');
    expect(roaming?.attachment).toBe('cross-platform');
    expect(roaming?.transport).toBe('usb');
    expect(roaming?.kind).toBe('roaming');
    if (roaming?.kind === 'roaming') {
      expect(roaming.roamingKind).toBe('security-key');
    }
  });

  it('mounts a phone (caBLE) authenticator with hybrid transport', async () => {
    const env = await setupPasskeyEnv({
      devices: [
        {
          deviceId: 'macbook-1',
          platform: { biometric: 'touch-id' },
          roaming: { kind: 'phone' },
        },
      ],
    });
    envs.push(env);
    const roaming = env
      .listAuthenticators('macbook-1')
      .find((auth) => auth.kind === 'roaming');
    expect(roaming?.transport).toBe('hybrid');
    if (roaming?.kind === 'roaming') {
      expect(roaming.roamingKind).toBe('phone');
    }
  });

  it('rejects an unknown roaming kind', () => {
    expect(() =>
      createRoamingAuthenticator({
        kind: 'watch' as unknown as 'security-key',
      }),
    ).toThrow(/unknown roaming kind "watch"/);
  });
});

describe('passkey creation + authentication', () => {
  it('forces residentKey=required so every credential is discoverable', async () => {
    const env = await makeEnvWithTouchIdDevice();
    await env.createPasskey('macbook-1', 'user-1', {
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'challenge-1',
      // Caller does not set residentKey — the env must upgrade it.
    });
    const passkey = env.listPasskeys()[0]!;
    expect(passkey.discoverable).toBe(true);
    expect(passkey.userId).toBe('user-1');
    expect(passkey.backupEligible).toBe(true);
  });

  it('authenticates the passkey and increments the sign counter', async () => {
    const env = await makeEnvWithTouchIdDevice();
    await env.createPasskey('macbook-1', 'user-1', {
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'c-create',
    });
    const first = await env.authenticate('macbook-1', {
      rpId: 'example.test',
      challenge: 'c-get-1',
    });
    const second = await env.authenticate('macbook-1', {
      rpId: 'example.test',
      challenge: 'c-get-2',
    });
    expect(first.signCount).toBe(1);
    expect(second.signCount).toBe(2);
  });

  it('rejects createPasskey for an unknown device', async () => {
    const env = await makeEnvWithTouchIdDevice();
    await expect(
      env.createPasskey('phone-99', 'user-1', {
        rp: { id: 'example.test', name: 'Example RP' },
        user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
        challenge: 'c1',
      }),
    ).rejects.toThrow(/unknown deviceId "phone-99"/);
  });

  it('rejects authenticate on a device that does not hold the credential', async () => {
    const env = await setupPasskeyEnv({
      devices: [
        { deviceId: 'macbook-1', platform: { biometric: 'touch-id' } },
        { deviceId: 'macbook-2', platform: { biometric: 'touch-id' } },
      ],
    });
    envs.push(env);
    await env.createPasskey('macbook-1', 'user-1', {
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'c-create',
    });
    await expect(
      env.authenticate('macbook-2', { rpId: 'example.test', challenge: 'c-get' }),
    ).rejects.toThrow(/no user-present authenticator can serve/);
  });

  it('flags bare security-key credentials as non-backup-eligible', async () => {
    const env = await setupPasskeyEnv({
      devices: [
        {
          deviceId: 'ykey-1',
          roaming: { kind: 'security-key' },
        },
      ],
    });
    envs.push(env);
    await env.createPasskey('ykey-1', 'user-1', {
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'c-create',
    });
    const passkey = env.listPasskeys()[0]!;
    expect(passkey.backupEligible).toBe(false);
  });

  it('flags phone (caBLE) credentials as backup-eligible when they carry resident keys', async () => {
    const env = await setupPasskeyEnv({
      devices: [
        {
          deviceId: 'phone-1',
          roaming: { kind: 'phone' },
        },
      ],
    });
    envs.push(env);
    await env.createPasskey('phone-1', 'user-1', {
      rp: { id: 'example.test', name: 'Example RP' },
      user: { id: 'user-1', name: 'alice', displayName: 'Alice' },
      challenge: 'c-create',
    });
    const passkey = env.listPasskeys()[0]!;
    expect(passkey.backupEligible).toBe(true);
  });
});

describe('sync fabric — backup + restore', () => {
  it('registers iCloud Keychain and Google Password Manager by default', async () => {
    const env = await makeEnvWithTouchIdDevice();
    const vendors = env.fabrics.map((fabric) => fabric.vendor).sort();
    expect(vendors).toEqual(['google-password-manager', 'icloud-keychain']);
  });

  it('backs up a passkey into iCloud Keychain and lifts the sync epoch', async () => {
    const env = await makeEnvWithTouchIdDevice();
    const credentialId = await mintPasskey(env, 'macbook-1', 'user-1', 'create');
    const backed = env.backupCredential(credentialId, 'icloud-keychain');
    expect(backed.syncEpoch).toBe(1);
    expect(backed.syncedFabrics).toEqual(['icloud-keychain']);
    expect(env.fabric('icloud-keychain').size()).toBe(1);
    // A second backup bumps the epoch again but does not duplicate the vendor.
    const rebacked = env.backupCredential(credentialId, 'icloud-keychain');
    expect(rebacked.syncEpoch).toBe(2);
    expect(rebacked.syncedFabrics).toEqual(['icloud-keychain']);
  });

  it('backs up into Google Password Manager independently of iCloud Keychain', async () => {
    const env = await makeEnvWithTouchIdDevice();
    const credentialId = await mintPasskey(env, 'macbook-1', 'user-1', 'create');
    env.backupCredential(credentialId, 'icloud-keychain');
    const dual = env.backupCredential(credentialId, 'google-password-manager');
    expect([...dual.syncedFabrics].sort()).toEqual([
      'google-password-manager',
      'icloud-keychain',
    ]);
    expect(env.fabric('icloud-keychain').size()).toBe(1);
    expect(env.fabric('google-password-manager').size()).toBe(1);
  });

  it('rejects a backup of a non-backup-eligible credential', async () => {
    const env = await setupPasskeyEnv({
      devices: [
        { deviceId: 'ykey-1', roaming: { kind: 'security-key' } },
      ],
    });
    envs.push(env);
    const credentialId = await mintPasskey(env, 'ykey-1', 'user-1', 'create');
    expect(() => env.backupCredential(credentialId, 'icloud-keychain')).toThrow(
      /is not backup-eligible/,
    );
  });

  it('restores a passkey onto a fresh device — the origin device can be removed first', async () => {
    const env = await setupPasskeyEnv({
      devices: [
        { deviceId: 'macbook-old', platform: { biometric: 'touch-id' } },
        { deviceId: 'macbook-new', platform: { biometric: 'touch-id' } },
      ],
    });
    envs.push(env);
    const credentialId = await mintPasskey(env, 'macbook-old', 'user-1', 'create');
    env.backupCredential(credentialId, 'icloud-keychain');
    // Simulate the user junking the old MacBook.
    env.removeDevice('macbook-old');
    expect(env.listPasskeys()).toHaveLength(0);
    const restored = env.restoreCredential(
      'macbook-new',
      'user-1',
      credentialId,
      'icloud-keychain',
    );
    expect(restored.credentialId).toBe(credentialId);
    expect(restored.originDeviceId).toBe('macbook-old');
    expect(env.getPasskey(credentialId)?.userId).toBe('user-1');
    // Authentication must succeed on the new device now that the credential
    // has been re-hosted there.
    const assertion = await env.authenticate('macbook-new', {
      rpId: 'example.test',
      challenge: 'c-post-restore',
    });
    expect(assertion.credentialId).toBe(credentialId);
    // signCount continues from where the source device left off (0 before any
    // assertion), incrementing to 1 on the first authenticate.
    expect(assertion.signCount).toBe(1);
  });

  it('rejects restore when the requesting user does not own the credential', async () => {
    const env = await setupPasskeyEnv({
      devices: [
        { deviceId: 'phone-alice', platform: { biometric: 'face-id' } },
        { deviceId: 'phone-mallory', platform: { biometric: 'face-id' } },
      ],
    });
    envs.push(env);
    const credentialId = await mintPasskey(env, 'phone-alice', 'user-alice', 'create');
    env.backupCredential(credentialId, 'icloud-keychain');
    expect(() =>
      env.restoreCredential(
        'phone-mallory',
        'user-mallory',
        credentialId,
        'icloud-keychain',
      ),
    ).toThrow(/user "user-mallory" cannot restore/);
  });

  it('rejects restore when the fabric does not hold the credential', async () => {
    const env = await setupPasskeyEnv({
      devices: [
        { deviceId: 'phone-1', platform: { biometric: 'face-id' } },
      ],
    });
    envs.push(env);
    const credentialId = await mintPasskey(env, 'phone-1', 'user-1', 'create');
    // No backup call — the credential lives on the device but is not in any
    // fabric yet.
    expect(() =>
      env.restoreCredential('phone-1', 'user-1', credentialId, 'icloud-keychain'),
    ).toThrow(/does not hold credential/);
  });

  it('rejects restore when the target device has no authenticator to host the credential', async () => {
    const env = await setupPasskeyEnv({
      devices: [
        { deviceId: 'phone-1', platform: { biometric: 'face-id' } },
      ],
    });
    envs.push(env);
    const credentialId = await mintPasskey(env, 'phone-1', 'user-1', 'create');
    env.backupCredential(credentialId, 'icloud-keychain');
    env.addDevice('phone-fresh-no-authenticator');
    expect(() =>
      env.restoreCredential(
        'phone-fresh-no-authenticator',
        'user-1',
        credentialId,
        'icloud-keychain',
      ),
    ).toThrow(/has no authenticator to host/);
  });

  it('syncCredentials bulk-copies every backup-eligible passkey between devices for one user', async () => {
    const env = await setupPasskeyEnv({
      devices: [
        {
          deviceId: 'phone-1',
          platform: { biometric: 'face-id' },
        },
        {
          deviceId: 'phone-2',
          platform: { biometric: 'face-id' },
        },
      ],
    });
    envs.push(env);
    // Two credentials for user-1, one for user-2 on the source device.
    await mintPasskey(env, 'phone-1', 'user-1', 'c1');
    await mintPasskey(env, 'phone-1', 'user-1', 'c2');
    await mintPasskey(env, 'phone-1', 'user-2', 'c3');
    const restored = env.syncCredentials(
      'phone-1',
      'phone-2',
      'user-1',
      'icloud-keychain',
    );
    expect(restored).toHaveLength(2);
    for (const passkey of restored) {
      expect(passkey.userId).toBe('user-1');
      expect(passkey.syncedFabrics).toContain('icloud-keychain');
    }
    // The user-2 credential must not be on the target device.
    const targetCredentials = env
      .listPasskeys()
      .filter((p) => p.originDeviceId === 'phone-1' && p.userId === 'user-2');
    expect(targetCredentials.every((p) => p.userId !== 'user-1')).toBe(true);
  });
});

describe('env lifecycle + edge cases', () => {
  it('reset() clears every fabric and every device credential without disposing the env', async () => {
    const env = await makeEnvWithTouchIdDevice();
    const credentialId = await mintPasskey(env, 'macbook-1', 'user-1', 'create');
    env.backupCredential(credentialId, 'icloud-keychain');
    expect(env.listPasskeys()).toHaveLength(1);
    expect(env.fabric('icloud-keychain').size()).toBe(1);
    env.reset();
    expect(env.listPasskeys()).toHaveLength(0);
    expect(env.fabric('icloud-keychain').size()).toBe(0);
    // The device itself survives so we can mint new passkeys.
    expect(env.devices).toContain('macbook-1');
    await mintPasskey(env, 'macbook-1', 'user-1', 'post-reset');
    expect(env.listPasskeys()).toHaveLength(1);
  });

  it('addDevice() rejects a duplicate device id', async () => {
    const env = await makeEnvWithTouchIdDevice();
    expect(() => env.addDevice('macbook-1')).toThrow(/already registered/);
  });

  it('opting out of a fabric vendor drops it from the env', async () => {
    const env = await setupPasskeyEnv({
      devices: [{ deviceId: 'phone-1', platform: { biometric: 'face-id' } }],
      fabrics: ['icloud-keychain'],
    });
    envs.push(env);
    expect(env.fabrics.map((f) => f.vendor)).toEqual(['icloud-keychain']);
    expect(() => env.fabric('google-password-manager')).toThrow(
      /is not registered/,
    );
  });

  it('createSyncFabric rejects an unknown vendor', () => {
    expect(() =>
      createSyncFabric('dropbox' as unknown as 'icloud-keychain'),
    ).toThrow(/unknown vendor "dropbox"/);
  });

  it('findFabricHolding locates the vendor a credential is backed up on', async () => {
    const env = await makeEnvWithTouchIdDevice();
    const credentialId = await mintPasskey(env, 'macbook-1', 'user-1', 'create');
    env.backupCredential(credentialId, 'google-password-manager');
    const holding = findPasskeyFabricHolding(credentialId, env.fabrics);
    expect(holding?.vendor).toBe('google-password-manager');
    expect(findPasskeyFabricHolding('credential-nowhere', env.fabrics)).toBeNull();
  });

  it('evicting a credential from a fabric leaves it on the origin device only', async () => {
    const env = await makeEnvWithTouchIdDevice();
    const credentialId = await mintPasskey(env, 'macbook-1', 'user-1', 'create');
    env.backupCredential(credentialId, 'icloud-keychain');
    expect(env.fabric('icloud-keychain').evict(credentialId)).toBe(true);
    expect(env.fabric('icloud-keychain').size()).toBe(0);
    // The device-side credential is unaffected.
    expect(env.getPasskey(credentialId)?.credentialId).toBe(credentialId);
  });
});

describe('pure helper functions', () => {
  it('backupCredential (pure) throws on non-backup-eligible credentials', () => {
    const fabric = createSyncFabric('icloud-keychain');
    const credential: PasskeyCredential = {
      credentialId: 'credential-x',
      userHandle: 'user-x',
      publicKey: 'pk',
      signCount: 0,
      transports: ['usb'],
      attachment: 'cross-platform',
      discoverable: false,
      createdAt: 100,
      originDeviceId: 'ykey-1',
      userId: 'user-x',
      syncedFabrics: [],
      syncEpoch: 0,
      backupEligible: false,
    };
    expect(() => backupPasskeyCredential(credential, fabric)).toThrow(
      /is not backup-eligible/,
    );
  });

  it('restoreCredential (pure) returns null for a fabric that does not hold the credential', () => {
    const fabric = createSyncFabric('icloud-keychain');
    expect(restorePasskeyCredential('nope', fabric)).toBeNull();
  });

  it('requireFabric throws for an unregistered vendor', () => {
    const fabric = createSyncFabric('icloud-keychain');
    expect(() =>
      requirePasskeyFabric([fabric], 'google-password-manager'),
    ).toThrow(/is not registered/);
    expect(requirePasskeyFabric([fabric], 'icloud-keychain').vendor).toBe(
      'icloud-keychain',
    );
  });

  it('syncCredentials (pure) skips non-eligible and other-user credentials', () => {
    const fabric = createSyncFabric('icloud-keychain');
    const source: PasskeyCredential[] = [
      {
        credentialId: 'credential-a',
        userHandle: 'user-1',
        publicKey: 'pk-a',
        signCount: 0,
        transports: ['internal'],
        attachment: 'platform',
        discoverable: true,
        createdAt: 100,
        originDeviceId: 'phone-1',
        userId: 'user-1',
        syncedFabrics: [],
        syncEpoch: 0,
        backupEligible: true,
      },
      {
        credentialId: 'credential-b',
        userHandle: 'user-2',
        publicKey: 'pk-b',
        signCount: 0,
        transports: ['internal'],
        attachment: 'platform',
        discoverable: true,
        createdAt: 101,
        originDeviceId: 'phone-1',
        userId: 'user-2',
        syncedFabrics: [],
        syncEpoch: 0,
        backupEligible: true,
      },
      {
        credentialId: 'credential-c',
        userHandle: 'user-1',
        publicKey: 'pk-c',
        signCount: 0,
        transports: ['usb'],
        attachment: 'cross-platform',
        discoverable: false,
        createdAt: 102,
        originDeviceId: 'phone-1',
        userId: 'user-1',
        syncedFabrics: [],
        syncEpoch: 0,
        backupEligible: false,
      },
    ];
    const restored = syncPasskeyCredentials(source, 'user-1', fabric, (c) => c);
    expect(restored).toHaveLength(1);
    expect(restored[0]!.credentialId).toBe('credential-a');
  });
});
