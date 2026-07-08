import { describe, expect, it } from 'vitest';
import { createMoqDatagramMediaMock, type SemanticsEvent } from '../../src/index.js';

describe('moq-datagram-media axis', () => {
  it('sendDatagram accumulates counter + bytes', async () => {
    const mock = createMoqDatagramMediaMock({ artificialLatencyMs: 0 });
    await mock.sendDatagram({ trackName: 'v', sequenceNumber: 1, payloadBytes: 300, priority: 0 });
    await mock.sendDatagram({ trackName: 'v', sequenceNumber: 2, payloadBytes: 400, priority: 0 });
    const m = mock.getMetrics();
    expect(m.custom['datagramsSent']).toBe(2);
    expect(m.custom['bytesSent']).toBe(700);
  });

  it('dropDatagram increments drop count', async () => {
    const mock = createMoqDatagramMediaMock({ artificialLatencyMs: 0 });
    await mock.dropDatagram({ trackName: 'v', sequenceNumber: 3 });
    expect(mock.getMetrics().custom['datagramsDropped']).toBe(1);
  });

  it('setPriority emits priority-set event', async () => {
    const mock = createMoqDatagramMediaMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e: SemanticsEvent) => events.push(e));
    await mock.setPriority({ trackName: 'v', priority: 10 });
    expect(events[0]?.kind).toBe('moq-priority-set');
  });

  it('recoverFec accumulates recovered count', async () => {
    const mock = createMoqDatagramMediaMock({ artificialLatencyMs: 0 });
    await mock.recoverFec({ trackName: 'v', recoveredCount: 5 });
    expect(mock.getMetrics().custom['fecRecovered']).toBe(5);
  });

  it('protocol + axis identifiers exposed', () => {
    const mock = createMoqDatagramMediaMock();
    expect(mock.protocol).toBe('moqt');
    expect(mock.axis).toBe('moq-datagram-media');
  });

  it('reset clears state', async () => {
    const mock = createMoqDatagramMediaMock({ artificialLatencyMs: 0 });
    await mock.sendDatagram({ trackName: 'v', sequenceNumber: 1, payloadBytes: 100, priority: 0 });
    mock.reset();
    expect(mock.getMetrics().custom['datagramsSent']).toBeUndefined();
  });

  it('multiple recover events accumulate cumulative recovery total', async () => {
    const mock = createMoqDatagramMediaMock({ artificialLatencyMs: 0 });
    await mock.recoverFec({ trackName: 'v', recoveredCount: 3 });
    await mock.recoverFec({ trackName: 'v', recoveredCount: 4 });
    expect(mock.getMetrics().custom['fecRecovered']).toBe(7);
  });

  it('events accumulate in order', async () => {
    const mock = createMoqDatagramMediaMock({ artificialLatencyMs: 0 });
    const events: SemanticsEvent[] = [];
    mock.onEvent((e: SemanticsEvent) => events.push(e));
    await mock.sendDatagram({ trackName: 'v', sequenceNumber: 1, payloadBytes: 100, priority: 0 });
    await mock.dropDatagram({ trackName: 'v', sequenceNumber: 2 });
    await mock.setPriority({ trackName: 'v', priority: 5 });
    await mock.recoverFec({ trackName: 'v', recoveredCount: 1 });
    expect(events.map((e) => e.kind)).toEqual([
      'moq-datagram-sent',
      'moq-datagram-dropped',
      'moq-priority-set',
      'moq-fec-recovered',
    ]);
  });
});
