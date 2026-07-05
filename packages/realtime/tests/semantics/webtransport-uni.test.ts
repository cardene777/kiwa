import { describe, expect, it } from 'vitest';
import {
  createWebTransportUniMock,
  type SemanticsEvent,
} from '../../src/index.js';

describe('webtransport-uni axis', () => {
  it('T-SEM-WTU-001 createUniStream emits uni-stream-open with direction payload', async () => {
    const mock = createWebTransportUniMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    const stream = await mock.createUniStream();
    expect(stream.state).toBe('open');
    const openEv = events.find((e) => e.kind === 'uni-stream-open');
    expect(openEv).toBeDefined();
    expect((openEv?.payload as { direction: string }).direction).toBe('uni');
  });

  it('T-SEM-WTU-002 write emits uni-stream-write with byteLength', async () => {
    const mock = createWebTransportUniMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    const stream = await mock.createUniStream();
    await stream.write(new Uint8Array([1, 2, 3, 4, 5]));
    const writeEv = events.find((e) => e.kind === 'uni-stream-write');
    expect(writeEv).toBeDefined();
    expect((writeEv?.payload as { byteLength: number }).byteLength).toBe(5);
  });

  it('T-SEM-WTU-003 reset transitions state and emits uni-stream-reset', async () => {
    const mock = createWebTransportUniMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    const stream = await mock.createUniStream();
    await stream.reset(42);
    expect(stream.state).toBe('reset');
    const resetEv = events.find((e) => e.kind === 'uni-stream-reset');
    expect(resetEv).toBeDefined();
    expect((resetEv?.payload as { errorCode: number }).errorCode).toBe(42);
    expect(mock.getMetrics().streamsReset).toBe(1);
  });

  it('T-SEM-WTU-004 write after reset throws', async () => {
    const mock = createWebTransportUniMock({ artificialLatencyMs: 0 });
    const stream = await mock.createUniStream();
    await stream.reset(1);
    await expect(stream.write(new Uint8Array([0]))).rejects.toThrow(/not open/);
  });

  it('T-SEM-WTU-005 sendDatagram emits datagram-recv event', async () => {
    const mock = createWebTransportUniMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    await mock.sendDatagram(new Uint8Array([9, 8, 7]));
    const dEv = events.find((e) => e.kind === 'datagram-recv');
    expect(dEv).toBeDefined();
    expect((dEv?.payload as { byteLength: number }).byteLength).toBe(3);
    expect(mock.getMetrics().custom.datagramsSent).toBe(1);
  });

  it('T-SEM-WTU-006 metrics track opened / reset counts', async () => {
    const mock = createWebTransportUniMock({ artificialLatencyMs: 0 });
    const s1 = await mock.createUniStream();
    const s2 = await mock.createUniStream();
    await s1.reset(1);
    await s2.close();
    const m = mock.getMetrics();
    expect(m.streamsOpened).toBe(2);
    expect(m.streamsReset).toBe(1);
    expect(m.streamsClosed).toBe(1);
  });
});
