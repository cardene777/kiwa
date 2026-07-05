import { describe, expect, it } from 'vitest';
import {
  createQuicMultiplexMock,
  type SemanticsEvent,
} from '../../src/index.js';

describe('quic-multiplex axis', () => {
  it('T-SEM-QMX-001 openStream emits stream-open with default priority 128', async () => {
    const mock = createQuicMultiplexMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    const stream = await mock.openStream();
    expect(stream.priority).toBe(128);
    expect(events[0]?.kind).toBe('stream-open');
  });

  it('T-SEM-QMX-002 multiple streams with custom priorities are sorted lowest-first', async () => {
    const mock = createQuicMultiplexMock({ artificialLatencyMs: 0 });
    await mock.openStream({ priority: 5 });
    await mock.openStream({ priority: 1 });
    await mock.openStream({ priority: 3 });
    const active = mock.getActiveStreams();
    expect(active.map((s) => s.priority)).toEqual([1, 3, 5]);
  });

  it('T-SEM-QMX-003 close removes stream from active list and emits stream-close', async () => {
    const mock = createQuicMultiplexMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    const s = await mock.openStream({ priority: 2 });
    await s.close();
    expect(mock.getActiveStreams()).toHaveLength(0);
    expect(events.some((e) => e.kind === 'stream-close')).toBe(true);
  });

  it('T-SEM-QMX-004 insertHpackHeader emits hpack-insert and grows table', async () => {
    const mock = createQuicMultiplexMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e) => events.push(e));
    await mock.insertHpackHeader('content-type', 'application/json');
    await mock.insertHpackHeader(':status', '200');
    expect(mock.hpackTableSize).toBe(2);
    expect(events.filter((e) => e.kind === 'hpack-insert')).toHaveLength(2);
  });

  it('T-SEM-QMX-005 resumeWithZeroRtt succeeds only when enable0RTT is true', async () => {
    const withoutZero = createQuicMultiplexMock({ artificialLatencyMs: 0 });
    await expect(withoutZero.resumeWithZeroRtt()).rejects.toThrow(/0-RTT is not enabled/);

    const withZero = createQuicMultiplexMock({ artificialLatencyMs: 0, enable0RTT: true });
    const events: SemanticsEvent[] = [];
    withZero.onEvent((e) => events.push(e));
    await withZero.resumeWithZeroRtt();
    expect(events[0]?.kind).toBe('zero-rtt-used');
    expect(withZero.getMetrics().custom.zeroRttResumes).toBe(1);
  });

  it('T-SEM-QMX-006 reset clears streams + hpack + metrics', async () => {
    const mock = createQuicMultiplexMock({ artificialLatencyMs: 0 });
    await mock.openStream();
    await mock.insertHpackHeader('x', 'y');
    mock.reset();
    expect(mock.getActiveStreams()).toHaveLength(0);
    expect(mock.hpackTableSize).toBe(0);
    expect(mock.getMetrics().eventsEmitted).toBe(0);
  });
});
