import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { AuthPlatform } from '../src/adapters/interface.js';

const platforms: AuthPlatform[] = ['chromium', 'webkit', 'firefox'];

describe('integration — passwordless UX cross-axis scenarios', () => {
  it.each(platforms)('%s: device-bound → conditional-ui → cross-device chain', async (platform) => {
    const adapter = makeMockAdapter();
    const dev = await adapter.startDeviceBound({
      platform,
      userId: 'u-1',
      credentialId: 'cred-1',
      deviceId: 'dev-1',
    });
    await adapter.bindDevice(dev, { deviceId: 'dev-1' });
    await adapter.verifyBinding(dev);
    await adapter.closeDeviceBound(dev);
    const ui = await adapter.startConditionalUiFlow({
      platform,
      userId: 'u-1',
      formId: 'login',
    });
    await adapter.showAutofillHint(ui);
    const done = await adapter.completeAutofill(ui, { credentialId: 'cred-1', elapsedMs: 250 });
    expect(done.outcome).toBe('success');
  });

  it('concurrent sessions across axes are independent', async () => {
    const adapter = makeMockAdapter();
    const dev = await adapter.startDeviceBound({
      platform: 'chromium',
      userId: 'u-a',
      credentialId: 'c',
      deviceId: 'd',
    });
    const ui = await adapter.startConditionalUiFlow({
      platform: 'webkit',
      userId: 'u-b',
      formId: 'login',
    });
    const xd = await adapter.startCrossDeviceFlow({
      platform: 'firefox',
      userId: 'u-c',
      requestId: 'r',
    });
    expect(dev.sessionId).not.toBe(ui.sessionId);
    expect(ui.sessionId).not.toBe(xd.sessionId);
  });

  it('close on one session does not affect others', async () => {
    const adapter = makeMockAdapter();
    const s1 = await adapter.startDeviceBound({
      platform: 'chromium',
      userId: 'u-1',
      credentialId: 'c-1',
      deviceId: 'd-1',
    });
    const s2 = await adapter.startDeviceBound({
      platform: 'webkit',
      userId: 'u-2',
      credentialId: 'c-2',
      deviceId: 'd-2',
    });
    await adapter.closeDeviceBound(s1);
    const step = await adapter.bindDevice(s2, { deviceId: 'd-2' });
    expect(step.outcome).toBe('success');
  });

  it('elapsedMs is preserved through completeAutofill', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startConditionalUiFlow({
      platform: 'chromium',
      userId: 'u-1',
      formId: 'login',
    });
    await adapter.showAutofillHint(s);
    const step = await adapter.completeAutofill(s, { credentialId: 'cred', elapsedMs: 42 });
    expect(step.metadata.elapsedMs).toBe(42);
  });

  it('verifyBinding after bindDevice produces credprops event', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startDeviceBound({
      platform: 'chromium',
      userId: 'u-1',
      credentialId: 'c',
      deviceId: 'd',
    });
    await adapter.bindDevice(s, { deviceId: 'd' });
    const verify = await adapter.verifyBinding(s);
    expect(verify.metadata.neutralEvent).toBe('passkey.credprops-confirmed');
  });

  it('conditional-ui hint neutral event is chromium dialect for chromium', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startConditionalUiFlow({
      platform: 'chromium',
      userId: 'u',
      formId: 'login',
    });
    const step = await adapter.showAutofillHint(s);
    expect(step.metadata.neutralEvent).toBe('conditional-ui.hint-shown');
  });

  it('cross-device QR neutral event fires on emit', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startCrossDeviceFlow({
      platform: 'webkit',
      userId: 'u',
      requestId: 'r',
    });
    const step = await adapter.emitQrForCrossDevice(s, { qrPayload: 'FIDO:/abc' });
    expect(step.metadata.neutralEvent).toBe('cross-device.qr-generated');
  });

  it('close all axes leaves adapter reusable for new sessions', async () => {
    const adapter = makeMockAdapter();
    const s1 = await adapter.startDeviceBound({
      platform: 'chromium',
      userId: 'u',
      credentialId: 'c',
      deviceId: 'd',
    });
    await adapter.closeDeviceBound(s1);
    const s2 = await adapter.startDeviceBound({
      platform: 'firefox',
      userId: 'u2',
      credentialId: 'c2',
      deviceId: 'd2',
    });
    const step = await adapter.bindDevice(s2, { deviceId: 'd2' });
    expect(step.outcome).toBe('success');
  });

  it('assertionSignature preserved through cross-device completion', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startCrossDeviceFlow({
      platform: 'firefox',
      userId: 'u-1',
      requestId: 'r',
    });
    await adapter.emitQrForCrossDevice(s, { qrPayload: 'x' });
    const step = await adapter.completeCrossDevice(s, { assertionSignature: 'sig-magic' });
    expect(step.metadata.assertionSignature).toBe('sig-magic');
  });
});
