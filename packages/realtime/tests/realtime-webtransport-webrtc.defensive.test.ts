import { describe, expect, it } from 'vitest';
import { createWebTransportUniMock } from '../src/semantics/webtransport-uni.js';
import { createWebTransportBiMock } from '../src/semantics/webtransport-bi.js';
import { createWebRtcSignalingMock } from '../src/semantics/webrtc-signaling.js';
import { createWebRtcIceMock } from '../src/semantics/webrtc-ice.js';

describe('webtransport-uni defensive branches', () => {
  it('createWebTransportUniMock uses default latency when config omitted', () => {
    const mock = createWebTransportUniMock();
    expect(mock.axis).toBe('webtransport-uni');
  });

  it('close is idempotent when already closed', async () => {
    const mock = createWebTransportUniMock({ artificialLatencyMs: 0 });
    const stream = await mock.createUniStream();
    await stream.close();
    await expect(stream.close()).resolves.toBeUndefined();
  });

  it('reset is idempotent when already reset', async () => {
    const mock = createWebTransportUniMock({ artificialLatencyMs: 0 });
    const stream = await mock.createUniStream();
    await stream.reset(0);
    await expect(stream.reset(1)).resolves.toBeUndefined();
  });

  it('event handler exceptions are swallowed', async () => {
    const mock = createWebTransportUniMock({ artificialLatencyMs: 0 });
    mock.onEvent(() => {
      throw new Error('handler-throws');
    });
    await expect(mock.createUniStream()).resolves.toBeDefined();
  });
});

describe('webtransport-bi defensive branches', () => {
  it('createWebTransportBiMock uses default latency when config omitted', () => {
    const mock = createWebTransportBiMock();
    expect(mock.axis).toBe('webtransport-bi');
  });

  it('read returns null when stream state is not open', async () => {
    const mock = createWebTransportBiMock({ artificialLatencyMs: 0 });
    const stream = await mock.createBiStream();
    await stream.close();
    expect(await stream.read()).toBeNull();
  });

  it('close is idempotent when already closed', async () => {
    const mock = createWebTransportBiMock({ artificialLatencyMs: 0 });
    const stream = await mock.createBiStream();
    await stream.close();
    await expect(stream.close()).resolves.toBeUndefined();
  });

  it('event handler exceptions are swallowed', async () => {
    const mock = createWebTransportBiMock({ artificialLatencyMs: 0 });
    mock.onEvent(() => {
      throw new Error('handler-throws');
    });
    await expect(mock.createBiStream()).resolves.toBeDefined();
  });
});

describe('webrtc-signaling defensive branches', () => {
  it('createWebRtcSignalingMock uses default latency when config omitted', () => {
    const mock = createWebRtcSignalingMock();
    expect(mock.axis).toBe('webrtc-signaling');
  });

  it('event handler exceptions are swallowed', async () => {
    const mock = createWebRtcSignalingMock({ artificialLatencyMs: 0 });
    mock.onEvent(() => {
      throw new Error('handler-throws');
    });
    await expect(mock.createOffer()).resolves.toBeDefined();
  });
});

describe('webrtc-ice defensive branches', () => {
  it('createWebRtcIceMock uses default latency when config omitted', () => {
    const mock = createWebRtcIceMock();
    expect(mock.axis).toBe('webrtc-ice');
  });

  it('event handler exceptions are swallowed', async () => {
    const mock = createWebRtcIceMock({ artificialLatencyMs: 0 });
    mock.onEvent(() => {
      throw new Error('handler-throws');
    });
    await expect(mock.startGathering(2)).resolves.toBeUndefined();
  });
});
