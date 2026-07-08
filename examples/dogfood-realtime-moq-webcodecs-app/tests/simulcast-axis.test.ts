import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { Platform } from '../src/adapters/interface.js';

const platforms: Platform[] = ['chromium', 'webkit', 'firefox'];

describe('simulcast axis — mock adapter', () => {
  it.each(platforms)('%s: startSimulcastFlow assigns session', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startSimulcastFlow({ platform, trackName: 'v-1' });
    expect(s.sessionId).toMatch(/^sim-\d+$/);
  });

  it('addSimulcastQualityLayer succeeds', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startSimulcastFlow({ platform: 'chromium', trackName: 'v-1' });
    const step = await adapter.addSimulcastQualityLayer(s, { layerId: 'high', bitrateKbps: 2500 });
    expect(step.metadata.bitrateKbps).toBe(2500);
  });

  it('adaptSimulcastBitrate records reason', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startSimulcastFlow({ platform: 'webkit', trackName: 'v-1' });
    await adapter.addSimulcastQualityLayer(s, { layerId: 'high', bitrateKbps: 2500 });
    const step = await adapter.adaptSimulcastBitrate(s, { layerId: 'high', targetKbps: 1500, reason: 'congestion' });
    expect(step.metadata.reason).toBe('congestion');
  });

  it('closeSimulcastFlow removes session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startSimulcastFlow({ platform: 'firefox', trackName: 'v-1' });
    await adapter.closeSimulcastFlow(s);
    await expect(
      adapter.addSimulcastQualityLayer(s, { layerId: 'x', bitrateKbps: 100 }),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('addSimulcastQualityLayer rejects unknown session', async () => {
    const adapter = makeMockAdapter();
    await expect(
      adapter.addSimulcastQualityLayer(
        { sessionId: 'nope', platform: 'chromium', trackName: 'x' },
        { layerId: 'x', bitrateKbps: 100 },
      ),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('multiple bitrate adaptations supported', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startSimulcastFlow({ platform: 'chromium', trackName: 'v-1' });
    await adapter.addSimulcastQualityLayer(s, { layerId: 'high', bitrateKbps: 2500 });
    await adapter.adaptSimulcastBitrate(s, { layerId: 'high', targetKbps: 1500, reason: 'x' });
    const step = await adapter.adaptSimulcastBitrate(s, { layerId: 'high', targetKbps: 800, reason: 'y' });
    expect(step.metadata.targetKbps).toBe(800);
  });
});

describe('simulcast axis — real adapter env-gate', () => {
  it.each(platforms)('%s: addSimulcastQualityLayer reports env-missing', async (platform) => {
    const adapter = makeRealAdapter();
    const s = await adapter.startSimulcastFlow({ platform, trackName: 'v-1' });
    const step = await adapter.addSimulcastQualityLayer(s, { layerId: 'high', bitrateKbps: 2500 });
    expect(step.outcome).toBe('env-missing');
  });

  it('adaptSimulcastBitrate reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startSimulcastFlow({ platform: 'chromium', trackName: 'v-1' });
    const step = await adapter.adaptSimulcastBitrate(s, { layerId: 'high', targetKbps: 1500, reason: 'x' });
    expect(step.outcome).toBe('env-missing');
  });
});
