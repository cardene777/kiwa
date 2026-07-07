import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { AuthPlatform } from '../src/adapters/interface.js';

const platforms: AuthPlatform[] = ['chromium', 'webkit', 'firefox'];

describe('device-bound axis — mock adapter', () => {
  it.each(platforms)('%s: startDeviceBound assigns session', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startDeviceBound({
      platform,
      userId: 'u-1',
      credentialId: 'cred-1',
      deviceId: 'dev-1',
    });
    expect(s.sessionId).toMatch(/^dev-\d+$/);
    expect(s.platform).toBe(platform);
    expect(s.userId).toBe('u-1');
  });

  it.each(platforms)('%s: bindDevice emits neutral event', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startDeviceBound({
      platform,
      userId: 'u-1',
      credentialId: 'cred-1',
      deviceId: 'dev-1',
    });
    const step = await adapter.bindDevice(s, { deviceId: 'dev-1' });
    expect(step.op).toBe('bindDevice');
    expect(step.metadata.neutralEvent).toBe('passkey.device-bound');
  });

  it('verifyBinding completes credprops', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startDeviceBound({
      platform: 'chromium',
      userId: 'u-1',
      credentialId: 'cred-1',
      deviceId: 'dev-1',
    });
    await adapter.bindDevice(s, { deviceId: 'dev-1' });
    const step = await adapter.verifyBinding(s);
    expect(step.metadata.state).toBe('credprops-confirmed');
  });

  it('closeDeviceBound removes session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startDeviceBound({
      platform: 'webkit',
      userId: 'u-1',
      credentialId: 'cred-1',
      deviceId: 'dev-1',
    });
    await adapter.closeDeviceBound(s);
    await expect(adapter.bindDevice(s, { deviceId: 'x' })).rejects.toThrow(/unknown sessionId/);
  });

  it('multiple sessions are independent', async () => {
    const adapter = makeMockAdapter();
    const s1 = await adapter.startDeviceBound({
      platform: 'chromium',
      userId: 'u-1',
      credentialId: 'c-1',
      deviceId: 'd-1',
    });
    const s2 = await adapter.startDeviceBound({
      platform: 'firefox',
      userId: 'u-2',
      credentialId: 'c-2',
      deviceId: 'd-2',
    });
    expect(s1.sessionId).not.toBe(s2.sessionId);
  });
});

describe('device-bound axis — real adapter env-gate', () => {
  it.each(platforms)('%s: bindDevice reports env-missing', async (platform) => {
    const adapter = makeRealAdapter();
    const s = await adapter.startDeviceBound({
      platform,
      userId: 'u-1',
      credentialId: 'c',
      deviceId: 'd',
    });
    const step = await adapter.bindDevice(s, { deviceId: 'd' });
    expect(step.outcome).toBe('env-missing');
  });

  it('verifyBinding reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startDeviceBound({
      platform: 'chromium',
      userId: 'u-1',
      credentialId: 'c',
      deviceId: 'd',
    });
    const step = await adapter.verifyBinding(s);
    expect(step.outcome).toBe('env-missing');
  });
});
