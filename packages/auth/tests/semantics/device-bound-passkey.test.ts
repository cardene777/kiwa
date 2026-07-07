import { describe, expect, it } from 'vitest';
import {
  bindToDevice,
  confirmCredProps,
  migrateCredential,
  platformEventName,
  startDevicePasskey,
  verifySyncFabric,
  type AuthPlatform,
} from '../../src/semantics/index.js';

const platforms: AuthPlatform[] = ['chromium', 'webkit', 'firefox'];

describe('device-bound-passkey axis — 3 platform', () => {
  it.each(platforms)('%s: bindToDevice transitions to device-bound', (platform) => {
    const s = startDevicePasskey({
      platform,
      credentialId: 'cred-1',
      boundDeviceId: 'dev-1',
    });
    const step = bindToDevice(s);
    expect(step.state).toBe('device-bound');
    expect(step.neutralEvent).toBe('passkey.device-bound');
    expect(step.platformEvent).toBe(platformEventName(platform, 'passkey.device-bound'));
  });

  it.each(platforms)('%s: verifySyncFabric requires syncFabric configured', (platform) => {
    const s = startDevicePasskey({
      platform,
      credentialId: 'cred-1',
      boundDeviceId: 'dev-1',
      syncFabric: platform === 'webkit' ? 'icloud' : platform === 'chromium' ? 'chrome' : 'firefox',
    });
    bindToDevice(s);
    const step = verifySyncFabric(s);
    expect(step.state).toBe('sync-verified');
    expect(step.metadata.syncFabric).not.toBe('none');
  });

  it('verifySyncFabric rejects when no fabric configured', () => {
    const s = startDevicePasskey({ platform: 'chromium', credentialId: 'c', boundDeviceId: 'd' });
    bindToDevice(s);
    expect(() => verifySyncFabric(s)).toThrow(/no sync fabric/);
  });

  it('migrateCredential updates bound device id', () => {
    const s = startDevicePasskey({
      platform: 'webkit',
      credentialId: 'cred-1',
      boundDeviceId: 'dev-1',
      syncFabric: 'icloud',
    });
    bindToDevice(s);
    verifySyncFabric(s);
    const step = migrateCredential(s, { toDeviceId: 'dev-2' });
    expect(step.state).toBe('migrated');
    expect(s.boundDeviceId).toBe('dev-2');
    expect(step.metadata.fromDeviceId).toBe('dev-1');
  });

  it('confirmCredProps requires bind first', () => {
    const s = startDevicePasskey({ platform: 'firefox', credentialId: 'c', boundDeviceId: 'd' });
    expect(() => confirmCredProps(s)).toThrow(/bind first/);
  });

  it('bindToDevice rejects double bind', () => {
    const s = startDevicePasskey({ platform: 'chromium', credentialId: 'c', boundDeviceId: 'd' });
    bindToDevice(s);
    expect(() => bindToDevice(s)).toThrow(/expected idle/);
  });

  it('confirmCredProps sets isResidentKey=true after bind', () => {
    const s = startDevicePasskey({ platform: 'webkit', credentialId: 'c', boundDeviceId: 'd' });
    bindToDevice(s);
    const step = confirmCredProps(s);
    expect(step.state).toBe('credprops-confirmed');
    expect(step.metadata.isResidentKey).toBe(true);
  });

  it('history accumulates in order', () => {
    const s = startDevicePasskey({
      platform: 'chromium',
      credentialId: 'c',
      boundDeviceId: 'd',
      syncFabric: 'chrome',
    });
    bindToDevice(s);
    verifySyncFabric(s);
    migrateCredential(s, { toDeviceId: 'd2' });
    expect(s.history.map((step) => step.neutralEvent)).toEqual([
      'passkey.device-bound',
      'passkey.sync-fabric-verified',
      'passkey.credential-migrated',
    ]);
  });
});
