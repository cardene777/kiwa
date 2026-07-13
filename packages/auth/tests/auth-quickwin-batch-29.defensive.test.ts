import { describe, expect, it } from 'vitest';
import { setupOidcEnv } from '../src/oidc/setup-oidc-env.js';
import {
  syncCredentials,
  requireFabric,
} from '../src/passkey/credential-sync.js';
import type { PasskeyCredential, SyncFabric } from '../src/passkey/types.js';

describe('oidc/setup-oidc-env option spread branches', () => {
  it('accepts explicit refreshTokenLifetimeSec (spread branch)', async () => {
    const env = await setupOidcEnv({ refreshTokenLifetimeSec: 7200 });
    expect(env).toBeDefined();
  });

  it('accepts explicit accessTokenLifetimeSec (spread branch)', async () => {
    const env = await setupOidcEnv({ accessTokenLifetimeSec: 900 });
    expect(env).toBeDefined();
  });

  it('accepts both lifetimes + custom now', async () => {
    const env = await setupOidcEnv({
      accessTokenLifetimeSec: 300,
      refreshTokenLifetimeSec: 3600,
      now: () => 1_900_000_000_000,
    });
    expect(env).toBeDefined();
  });
});

describe('passkey/credential-sync defensive branches', () => {
  it('syncCredentials skips credentials owned by other users', () => {
    const fabric: SyncFabric = {
      vendor: 'icloud-keychain',
      stored: new Map(),
    } as unknown as SyncFabric;
    const source: PasskeyCredential[] = [
      {
        credentialId: 'c1',
        userId: 'other-user',
        backupEligible: true,
        publicKey: 'pk-1',
      } as PasskeyCredential,
    ];
    const register = (c: PasskeyCredential) => c;
    const result = syncCredentials(source, 'target-user', fabric, register);
    expect(result).toHaveLength(0);
  });

  it('syncCredentials skips non-backup-eligible credentials', () => {
    const fabric: SyncFabric = {
      vendor: 'icloud-keychain',
      stored: new Map(),
    } as unknown as SyncFabric;
    const source: PasskeyCredential[] = [
      {
        credentialId: 'c1',
        userId: 'target-user',
        backupEligible: false,
        publicKey: 'pk-1',
      } as PasskeyCredential,
    ];
    const register = (c: PasskeyCredential) => c;
    const result = syncCredentials(source, 'target-user', fabric, register);
    expect(result).toHaveLength(0);
  });

  it('requireFabric returns fabric when vendor matches', () => {
    const fabricA: SyncFabric = {
      vendor: 'icloud-keychain',
    } as unknown as SyncFabric;
    const fabricB: SyncFabric = {
      vendor: 'google-password-manager',
    } as unknown as SyncFabric;
    const result = requireFabric([fabricA, fabricB], 'google-password-manager');
    expect(result.vendor).toBe('google-password-manager');
  });

  it('requireFabric throws when vendor is not found', () => {
    const fabric: SyncFabric = {
      vendor: 'icloud-keychain',
    } as unknown as SyncFabric;
    expect(() =>
      requireFabric([fabric], 'google-password-manager'),
    ).toThrow();
  });
});
