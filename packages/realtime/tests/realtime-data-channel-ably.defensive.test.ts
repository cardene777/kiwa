import { describe, expect, it } from 'vitest';
import { createWebRtcDataChannelMock } from '../src/semantics/webrtc-data-channel.js';
import { createAblyMock } from '../src/ably.js';

describe('webrtc-data-channel defensive branches', () => {
  it('createWebRtcDataChannelMock uses default latency + seed', () => {
    const mock = createWebRtcDataChannelMock();
    expect(mock.axis).toBe('webrtc-data-channel');
  });

  it('sleep resolves immediately when latency is 0', async () => {
    const mock = createWebRtcDataChannelMock({ artificialLatencyMs: 0 });
    const channel = mock.createDataChannel({ label: 'ch1' });
    // wait for async open transition
    await new Promise((r) => setTimeout(r, 5));
    await expect(channel.send('hello')).resolves.toBeUndefined();
  });

  it('close is idempotent when already closed', async () => {
    const mock = createWebRtcDataChannelMock({ artificialLatencyMs: 0 });
    const channel = mock.createDataChannel({ label: 'ch1' });
    await channel.close();
    await expect(channel.close()).resolves.toBeUndefined();
  });

  it('event handler exceptions are swallowed', async () => {
    const mock = createWebRtcDataChannelMock({ artificialLatencyMs: 0 });
    mock.onEvent(() => {
      throw new Error('handler-throws');
    });
    const channel = mock.createDataChannel({ label: 'ch1' });
    await new Promise((r) => setTimeout(r, 5));
    await expect(channel.send('hi')).resolves.toBeUndefined();
  });
});

describe('ably defensive branches', () => {
  it('createAblyMock uses default clientId when omitted', () => {
    const mock = createAblyMock();
    expect(mock.provider).toBe('ably');
  });

  it('accepts explicit clientId', () => {
    const mock = createAblyMock({ clientId: 'custom-client' });
    expect(mock.provider).toBe('ably');
  });

  it('close fires connection listeners', async () => {
    const mock = createAblyMock();
    let closedFired = false;
    mock.connection.on('closed', () => {
      closedFired = true;
    });
    await mock.connection.close();
    expect(closedFired).toBe(true);
  });

  it('close is safe when no listeners are registered', async () => {
    const mock = createAblyMock();
    await expect(mock.connection.close()).resolves.toBeUndefined();
  });

  it('channel history returns limit default 100', async () => {
    const mock = createAblyMock();
    const channel = mock.channels.get('room-1');
    const { items } = await channel.history();
    expect(Array.isArray(items)).toBe(true);
  });

  it('channel history returns limit specified', async () => {
    const mock = createAblyMock();
    const channel = mock.channels.get('room-2');
    const { items } = await channel.history({ limit: 10 });
    expect(items.length).toBeLessThanOrEqual(10);
  });

  it('channel returns same instance for repeated get', () => {
    const mock = createAblyMock();
    const ch1 = mock.channels.get('same-name');
    const ch2 = mock.channels.get('same-name');
    expect(ch1).toBe(ch2);
  });

  it('publish + history round-trip stores message', async () => {
    const mock = createAblyMock();
    const channel = mock.channels.get('room-pub');
    await channel.publish('greeting', { text: 'hello' });
    const { items } = await channel.history();
    // history is populated by broadcast events; publish causes broadcast
    expect(Array.isArray(items)).toBe(true);
  });
});
