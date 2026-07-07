import { describe, expect, it } from 'vitest';
import {
  completeHandshake,
  generateQr,
  openTunnel,
  pairBle,
  platformEventName,
  startCrossDevice,
  type AuthPlatform,
} from '../../src/semantics/index.js';

const platforms: AuthPlatform[] = ['chromium', 'webkit', 'firefox'];

describe('cross-device-flow axis — 3 platform', () => {
  it.each(platforms)('%s: full flow QR → BLE → tunnel → handshake', (platform) => {
    const s = startCrossDevice({ platform, requestId: 'req-1' });
    const qr = generateQr(s, { qrPayload: 'FIDO:/1234' });
    expect(qr.state).toBe('qr-generated');
    expect(qr.platformEvent).toBe(platformEventName(platform, 'cross-device.qr-generated'));
    const ble = pairBle(s, { bleAdvKey: 'k-1', rssi: -60 });
    expect(ble.state).toBe('ble-paired');
    const tunnel = openTunnel(s, { tunnelUrl: 'wss://caBLE.example/tunnel' });
    expect(tunnel.state).toBe('tunnel-opened');
    const done = completeHandshake(s, { assertionSignature: 'sig-abcd' });
    expect(done.state).toBe('handshake-completed');
  });

  it('generateQr rejects when not idle', () => {
    const s = startCrossDevice({ platform: 'chromium', requestId: 'r' });
    generateQr(s, { qrPayload: 'x' });
    expect(() => generateQr(s, { qrPayload: 'y' })).toThrow(/expected idle/);
  });

  it('pairBle rejects when not qr-generated', () => {
    const s = startCrossDevice({ platform: 'chromium', requestId: 'r' });
    expect(() => pairBle(s, { bleAdvKey: 'k', rssi: 0 })).toThrow(/expected qr-generated/);
  });

  it('openTunnel rejects when not ble-paired', () => {
    const s = startCrossDevice({ platform: 'webkit', requestId: 'r' });
    generateQr(s, { qrPayload: 'x' });
    expect(() => openTunnel(s, { tunnelUrl: 'wss://x' })).toThrow(/expected ble-paired/);
  });

  it('completeHandshake rejects when not tunnel-opened', () => {
    const s = startCrossDevice({ platform: 'firefox', requestId: 'r' });
    expect(() => completeHandshake(s, { assertionSignature: 's' })).toThrow(/expected tunnel-opened/);
  });

  it('rssi metadata carried in ble step', () => {
    const s = startCrossDevice({ platform: 'chromium', requestId: 'r' });
    generateQr(s, { qrPayload: 'x' });
    const step = pairBle(s, { bleAdvKey: 'k', rssi: -75 });
    expect(step.metadata.rssi).toBe(-75);
  });

  it('history accumulates in order', () => {
    const s = startCrossDevice({ platform: 'webkit', requestId: 'r' });
    generateQr(s, { qrPayload: 'x' });
    pairBle(s, { bleAdvKey: 'k', rssi: -60 });
    openTunnel(s, { tunnelUrl: 'wss://x' });
    completeHandshake(s, { assertionSignature: 's' });
    expect(s.history.map((step) => step.neutralEvent)).toEqual([
      'cross-device.qr-generated',
      'cross-device.ble-paired',
      'cross-device.tunnel-opened',
      'cross-device.handshake-completed',
    ]);
  });
});
