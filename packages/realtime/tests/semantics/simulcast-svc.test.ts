import { describe, expect, it } from 'vitest';
import { createSimulcastSvcMock } from '../../src/index.js';

describe('simulcast-svc axis', () => {
  it('addSimulcastLayer emits layer-added', async () => {
    const mock = createSimulcastSvcMock({ artificialLatencyMs: 0 });
    await mock.addSimulcastLayer({
      layerId: 'high',
      resolution: '1280x720',
      bitrateKbps: 2500,
      scalabilityMode: 'L1T3',
    });
    expect(mock.getMetrics().custom['layersAdded']).toBe(1);
  });

  it('selectSvcLayer emits selection event', async () => {
    const mock = createSimulcastSvcMock({ artificialLatencyMs: 0 });
    await mock.selectSvcLayer({ layerId: 'mid', temporalId: 1, spatialId: 0 });
    expect(mock.getMetrics().custom['layersSelected']).toBe(1);
  });

  it('adaptBitrate accumulates count', async () => {
    const mock = createSimulcastSvcMock({ artificialLatencyMs: 0 });
    await mock.adaptBitrate({ layerId: 'high', targetKbps: 1500, reason: 'congestion' });
    await mock.adaptBitrate({ layerId: 'high', targetKbps: 800, reason: 'packet-loss' });
    expect(mock.getMetrics().custom['bitrateAdaptations']).toBe(2);
  });

  it('dropLayer emits layer-dropped', async () => {
    const mock = createSimulcastSvcMock({ artificialLatencyMs: 0 });
    await mock.dropLayer({ layerId: 'low', reason: 'idle' });
    expect(mock.getMetrics().custom['layersDropped']).toBe(1);
  });

  it('protocol + axis identifiers exposed', () => {
    const mock = createSimulcastSvcMock();
    expect(mock.protocol).toBe('webcodecs');
    expect(mock.axis).toBe('simulcast-svc');
  });

  it('all 6 scalability modes work', async () => {
    const mock = createSimulcastSvcMock({ artificialLatencyMs: 0 });
    const modes: Array<'L1T1' | 'L1T2' | 'L1T3' | 'L2T1' | 'L2T3' | 'L3T3'> = [
      'L1T1',
      'L1T2',
      'L1T3',
      'L2T1',
      'L2T3',
      'L3T3',
    ];
    for (const m of modes) {
      await mock.addSimulcastLayer({
        layerId: `layer-${m}`,
        resolution: '640x480',
        bitrateKbps: 500,
        scalabilityMode: m,
      });
    }
    expect(mock.getMetrics().custom['layersAdded']).toBe(6);
  });

  it('reset clears all counters', async () => {
    const mock = createSimulcastSvcMock({ artificialLatencyMs: 0 });
    await mock.addSimulcastLayer({
      layerId: 'x',
      resolution: 'a',
      bitrateKbps: 1,
      scalabilityMode: 'L1T1',
    });
    mock.reset();
    expect(mock.getMetrics().eventsEmitted).toBe(0);
  });

  it('full sim + svc + adapt + drop cycle works', async () => {
    const mock = createSimulcastSvcMock({ artificialLatencyMs: 0 });
    await mock.addSimulcastLayer({
      layerId: 'high',
      resolution: '1920x1080',
      bitrateKbps: 5000,
      scalabilityMode: 'L3T3',
    });
    await mock.selectSvcLayer({ layerId: 'high', temporalId: 2, spatialId: 2 });
    await mock.adaptBitrate({ layerId: 'high', targetKbps: 3000, reason: 'network' });
    await mock.dropLayer({ layerId: 'high', reason: 'complete' });
    const m = mock.getMetrics();
    expect(m.custom['layersAdded']).toBe(1);
    expect(m.custom['layersSelected']).toBe(1);
    expect(m.custom['bitrateAdaptations']).toBe(1);
    expect(m.custom['layersDropped']).toBe(1);
  });
});
