import { describe, expect, it } from 'vitest';
import { createWebCodecsDecoderMock } from '../../src/index.js';

describe('webcodecs-decoder axis', () => {
  it('configure sets decoder config', async () => {
    const mock = createWebCodecsDecoderMock({ artificialLatencyMs: 0 });
    await mock.configure({ decoderId: 'd-1', config: { codec: 'VP9' } });
    expect(mock.getMetrics().custom['configsSet']).toBe(1);
  });

  it('decodeFrame classifies keyframes', async () => {
    const mock = createWebCodecsDecoderMock({ artificialLatencyMs: 0 });
    await mock.decodeFrame({ decoderId: 'd-1', frameNumber: 1, type: 'key' });
    await mock.decodeFrame({ decoderId: 'd-1', frameNumber: 2, type: 'delta' });
    const m = mock.getMetrics();
    expect(m.custom['framesDecoded']).toBe(2);
    expect(m.custom['keyframesDecoded']).toBe(1);
  });

  it('reorderFrame tracks max reorder delay', async () => {
    const mock = createWebCodecsDecoderMock({ artificialLatencyMs: 0 });
    await mock.reorderFrame({ decoderId: 'd-1', frameNumber: 5, delayMs: 30 });
    await mock.reorderFrame({ decoderId: 'd-1', frameNumber: 10, delayMs: 80 });
    expect(mock.getMetrics().custom['maxReorderDelayMs']).toBe(80);
  });

  it('dropFrame increments drop count', async () => {
    const mock = createWebCodecsDecoderMock({ artificialLatencyMs: 0 });
    await mock.dropFrame({ decoderId: 'd-1', frameNumber: 3, reason: 'budget-exceeded' });
    expect(mock.getMetrics().custom['framesDropped']).toBe(1);
  });

  it('protocol + axis identifiers exposed', () => {
    const mock = createWebCodecsDecoderMock();
    expect(mock.protocol).toBe('webcodecs');
    expect(mock.axis).toBe('webcodecs-decoder');
  });

  it('reset clears reorder tracking', async () => {
    const mock = createWebCodecsDecoderMock({ artificialLatencyMs: 0 });
    await mock.reorderFrame({ decoderId: 'd-1', frameNumber: 5, delayMs: 30 });
    mock.reset();
    expect(mock.getMetrics().custom['maxReorderDelayMs']).toBeUndefined();
  });

  it('handles interleaved decode + reorder + drop', async () => {
    const mock = createWebCodecsDecoderMock({ artificialLatencyMs: 0 });
    await mock.decodeFrame({ decoderId: 'd', frameNumber: 1, type: 'key' });
    await mock.reorderFrame({ decoderId: 'd', frameNumber: 2, delayMs: 10 });
    await mock.decodeFrame({ decoderId: 'd', frameNumber: 3, type: 'delta' });
    await mock.dropFrame({ decoderId: 'd', frameNumber: 4, reason: 'late' });
    const m = mock.getMetrics();
    expect(m.custom['framesDecoded']).toBe(2);
    expect(m.custom['framesReordered']).toBe(1);
    expect(m.custom['framesDropped']).toBe(1);
  });
});
