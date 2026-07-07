import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { AuthPlatform } from '../src/adapters/interface.js';

const platforms: AuthPlatform[] = ['chromium', 'webkit', 'firefox'];

describe('cross-device axis — mock adapter', () => {
  it.each(platforms)('%s: full flow QR → handshake', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startCrossDeviceFlow({
      platform,
      userId: 'u-1',
      requestId: 'req-1',
    });
    const qr = await adapter.emitQrForCrossDevice(s, { qrPayload: 'FIDO:/1234' });
    expect(qr.metadata.neutralEvent).toBe('cross-device.qr-generated');
    const done = await adapter.completeCrossDevice(s, { assertionSignature: 'sig-abcd' });
    expect(done.metadata.neutralEvent).toBe('cross-device.handshake-completed');
  });

  it('emitQrForCrossDevice rejects unknown session', async () => {
    const adapter = makeMockAdapter();
    await expect(
      adapter.emitQrForCrossDevice(
        { sessionId: 'nope', platform: 'chromium', userId: 'u' },
        { qrPayload: 'x' },
      ),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('completeCrossDevice records signature', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startCrossDeviceFlow({
      platform: 'webkit',
      userId: 'u-1',
      requestId: 'r',
    });
    await adapter.emitQrForCrossDevice(s, { qrPayload: 'x' });
    const step = await adapter.completeCrossDevice(s, { assertionSignature: 'sig-xyz' });
    expect(step.metadata.assertionSignature).toBe('sig-xyz');
  });

  it('closeCrossDevice removes session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startCrossDeviceFlow({
      platform: 'firefox',
      userId: 'u-1',
      requestId: 'r',
    });
    await adapter.closeCrossDevice(s);
    await expect(adapter.emitQrForCrossDevice(s, { qrPayload: 'x' })).rejects.toThrow(
      /unknown sessionId/,
    );
  });
});

describe('cross-device axis — real adapter env-gate', () => {
  it.each(platforms)('%s: emitQrForCrossDevice reports env-missing', async (platform) => {
    const adapter = makeRealAdapter();
    const s = await adapter.startCrossDeviceFlow({ platform, userId: 'u-1', requestId: 'r' });
    const step = await adapter.emitQrForCrossDevice(s, { qrPayload: 'x' });
    expect(step.outcome).toBe('env-missing');
  });

  it('completeCrossDevice reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startCrossDeviceFlow({
      platform: 'chromium',
      userId: 'u-1',
      requestId: 'r',
    });
    const step = await adapter.completeCrossDevice(s, { assertionSignature: 's' });
    expect(step.outcome).toBe('env-missing');
  });
});
