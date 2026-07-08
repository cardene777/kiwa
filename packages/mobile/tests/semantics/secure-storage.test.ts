import { describe, expect, it } from 'vitest';
import {
  challengeBiometric,
  initSecureStorage,
  removeCredential,
  retrieveCredential,
  storeCredential,
} from '../../src/index.js';

describe('v1.51 secure-storage semantics', () => {
  it('store + biometric + retrieve + remove', () => {
    const s = initSecureStorage({ target: 'ios', vaultId: 'app-vault' });
    storeCredential(s, { key: 'auth-token', encryptedValue: 'enc:xxx', requireBiometric: true });
    challengeBiometric(s, { method: 'face-id', success: true });
    retrieveCredential(s, 'auth-token');
    removeCredential(s, 'auth-token');
    expect(s.state).toBe('removed');
    expect(s.biometricChallenges).toBe(1);
  });

  it('retrieve reports hit/miss', () => {
    const s = initSecureStorage({ target: 'android', vaultId: 'x' });
    storeCredential(s, { key: 'a', encryptedValue: 'e' });
    const hitStep = retrieveCredential(s, 'a');
    expect(hitStep.metadata.hit).toBe(true);
    const missStep = retrieveCredential(s, 'ghost');
    expect(missStep.metadata.hit).toBe(false);
  });

  it('multiple biometric challenges accumulate', () => {
    const s = initSecureStorage({ target: 'ios', vaultId: 'x' });
    challengeBiometric(s, { method: 'touch-id', success: false });
    challengeBiometric(s, { method: 'touch-id', success: true });
    expect(s.biometricChallenges).toBe(2);
  });

  it('rejects empty vaultId + key', () => {
    expect(() => initSecureStorage({ target: 'ios', vaultId: '' })).toThrow(/vaultId/);
    const s = initSecureStorage({ target: 'ios', vaultId: 'x' });
    expect(() => storeCredential(s, { key: '', encryptedValue: 'x' })).toThrow(/key/);
  });

  it('web dialect maps to credential-mgmt', () => {
    const s = initSecureStorage({ target: 'web', vaultId: 'x' });
    storeCredential(s, { key: 'k', encryptedValue: 'v' });
    expect(s.history[0]?.providerEvent).toBe('web.credential-mgmt.store');
  });
});
