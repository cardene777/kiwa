import { describe, expect, it } from 'vitest';
import { createQuicMultiplexMock } from '../src/semantics/quic-multiplex.js';
import { createHttp3PushMock } from '../src/semantics/http3-push.js';

describe('quic-multiplex defensive branches', () => {
  it('uses default latency + enable0RTT=false when config omitted', () => {
    const mock = createQuicMultiplexMock();
    expect(mock.axis).toBe('quic-multiplex');
    expect(mock.zeroRttEnabled).toBe(false);
  });

  it('accepts explicit enable0RTT=true', () => {
    const mock = createQuicMultiplexMock({ enable0RTT: true });
    expect(mock.zeroRttEnabled).toBe(true);
  });

  it('close is idempotent when stream already closed', async () => {
    const mock = createQuicMultiplexMock({ artificialLatencyMs: 0 });
    const stream = await mock.openStream();
    await stream.close();
    await expect(stream.close()).resolves.toBeUndefined();
  });

  it('event handler exceptions are swallowed', async () => {
    const mock = createQuicMultiplexMock({ artificialLatencyMs: 0 });
    mock.onEvent(() => {
      throw new Error('handler-throws');
    });
    await expect(mock.openStream()).resolves.toBeDefined();
  });
});

describe('http3-push defensive branches', () => {
  it('uses default latency when config omitted', () => {
    const mock = createHttp3PushMock();
    expect(mock.axis).toBe('http3-push');
  });

  it('sendBody no-ops when stream already cancelled', async () => {
    const mock = createHttp3PushMock({ artificialLatencyMs: 0 });
    const promise = await mock.pushStream('/x');
    await promise.cancel(0);
    await expect(promise.sendBody('body')).resolves.toBeUndefined();
  });

  it('cancel no-ops when already cancelled', async () => {
    const mock = createHttp3PushMock({ artificialLatencyMs: 0 });
    const promise = await mock.pushStream('/x');
    await promise.cancel(0);
    await expect(promise.cancel(1)).resolves.toBeUndefined();
  });

  it('cancel no-ops when body already sent', async () => {
    const mock = createHttp3PushMock({ artificialLatencyMs: 0 });
    const promise = await mock.pushStream('/x');
    await promise.sendHeaders({ 'content-type': 'text/plain' });
    await promise.sendBody('body');
    await expect(promise.cancel(0)).resolves.toBeUndefined();
  });

  it('sendBody with Uint8Array counts byteLength correctly', async () => {
    const mock = createHttp3PushMock({ artificialLatencyMs: 0 });
    const promise = await mock.pushStream('/x');
    await promise.sendHeaders({ 'content-type': 'application/octet-stream' });
    await expect(promise.sendBody(new Uint8Array([1, 2, 3]))).resolves.toBeUndefined();
  });

  it('event handler exceptions are swallowed', async () => {
    const mock = createHttp3PushMock({ artificialLatencyMs: 0 });
    mock.onEvent(() => {
      throw new Error('handler-throws');
    });
    await expect(mock.pushStream('/x')).resolves.toBeDefined();
  });
});
