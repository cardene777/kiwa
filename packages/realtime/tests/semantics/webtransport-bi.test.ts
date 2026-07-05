import { describe, expect, it } from 'vitest';
import {
  createWebTransportBiMock,
  type SemanticsEvent,
} from '../../src/index.js';

describe('webtransport-bi axis', () => {
  it('T-SEM-WTB-001 createBiStream emits open event with windowSize', async () => {
    const mock = createWebTransportBiMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    const stream = await mock.createBiStream({ windowSize: 8192 });
    expect(stream.state).toBe('open');
    expect(stream.windowRemaining).toBe(8192);
    const openEv = events.find((e) => e.kind === 'bi-stream-open');
    expect(openEv).toBeDefined();
    expect((openEv?.payload as { windowSize: number }).windowSize).toBe(8192);
  });

  it('T-SEM-WTB-002 write decrements windowRemaining', async () => {
    const mock = createWebTransportBiMock({ artificialLatencyMs: 0 });
    const stream = await mock.createBiStream({ windowSize: 1000 });
    await stream.write(new Uint8Array(300));
    expect(stream.windowRemaining).toBe(700);
  });

  it('T-SEM-WTB-003 write exceeding window emits bi-backpressure and refills', async () => {
    const mock = createWebTransportBiMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    const stream = await mock.createBiStream({ windowSize: 100 });
    await stream.write(new Uint8Array(200)); // exceeds window
    const backpressureEv = events.find((e) => e.kind === 'bi-backpressure');
    expect(backpressureEv).toBeDefined();
    expect(mock.getMetrics().backpressureCount).toBe(1);
  });

  it('T-SEM-WTB-004 read returns data from write (bi echo)', async () => {
    const mock = createWebTransportBiMock({ artificialLatencyMs: 0 });
    const stream = await mock.createBiStream();
    const data = new Uint8Array([1, 2, 3]);
    await stream.write(data);
    const readData = await stream.read();
    expect(readData).toEqual(data);
  });

  it('T-SEM-WTB-005 close emits bi-stream-close and transitions state', async () => {
    const mock = createWebTransportBiMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    const stream = await mock.createBiStream();
    await stream.close();
    expect(stream.state).toBe('closed');
    expect(events.some((e) => e.kind === 'bi-stream-close')).toBe(true);
    expect(mock.getMetrics().streamsClosed).toBe(1);
  });

  it('T-SEM-WTB-006 write on closed stream throws', async () => {
    const mock = createWebTransportBiMock({ artificialLatencyMs: 0 });
    const stream = await mock.createBiStream();
    await stream.close();
    await expect(stream.write(new Uint8Array([0]))).rejects.toThrow(/not open/);
  });
});
