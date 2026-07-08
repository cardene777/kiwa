import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { Platform } from '../src/adapters/interface.js';

const platforms: Platform[] = ['chromium', 'webkit', 'firefox'];

describe('integration — svc + decoder + datagram cross-axis', () => {
  it.each(platforms)('%s: full svc → decoder → datagram chain', async (platform) => {
    const adapter = makeMockAdapter();
    const svc = await adapter.startSvcFlow({ platform, trackName: 'v-1' });
    await adapter.selectSvcLayer(svc, { layerId: 'high', temporalId: 2, spatialId: 1 });
    await adapter.dropSvcLayer(svc, { layerId: 'low', reason: 'idle' });
    await adapter.closeSvcFlow(svc);
    const dec = await adapter.startDecoderFlow({ platform, trackName: 'v-1', codec: 'H264' });
    await adapter.decodeMediaFrame(dec, { frameNumber: 1, type: 'key' });
    await adapter.decodeMediaFrame(dec, { frameNumber: 2, type: 'delta' });
    await adapter.closeDecoderFlow(dec);
    const dg = await adapter.startDatagramFlow({ platform, trackName: 'v-1' });
    await adapter.sendMediaDatagram(dg, { sequenceNumber: 1, bytes: 300, priority: 5 });
    const rec = await adapter.recoverDatagramFec(dg, { recoveredCount: 2 });
    expect(rec.metadata.recoveredCount).toBe(2);
  });

  it('concurrent sessions independent', async () => {
    const adapter = makeMockAdapter();
    const svc = await adapter.startSvcFlow({ platform: 'chromium', trackName: 't1' });
    const dec = await adapter.startDecoderFlow({ platform: 'webkit', trackName: 't2', codec: 'VP9' });
    const dg = await adapter.startDatagramFlow({ platform: 'firefox', trackName: 't3' });
    expect(svc.sessionId).not.toBe(dec.sessionId);
    expect(dec.sessionId).not.toBe(dg.sessionId);
  });

  it('SVC layer swap sequence works', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startSvcFlow({ platform: 'chromium', trackName: 'v' });
    for (const spatial of [0, 1, 2, 1, 0]) {
      const step = await adapter.selectSvcLayer(s, { layerId: 'x', temporalId: 2, spatialId: spatial });
      expect(step.metadata.spatialId).toBe(spatial);
    }
  });

  it('decoder frame reorder + drop mix', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startDecoderFlow({ platform: 'chromium', trackName: 'v', codec: 'H264' });
    await adapter.decodeMediaFrame(s, { frameNumber: 1, type: 'key' });
    await adapter.dropDecoderFrame(s, { frameNumber: 2, reason: 'late' });
    await adapter.decodeMediaFrame(s, { frameNumber: 3, type: 'delta' });
    await adapter.dropDecoderFrame(s, { frameNumber: 4, reason: 'budget' });
  });

  it('datagram priority + FEC cycle', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startDatagramFlow({ platform: 'chromium', trackName: 'v' });
    for (let seq = 1; seq <= 10; seq++) {
      await adapter.sendMediaDatagram(s, { sequenceNumber: seq, bytes: 300, priority: seq % 3 });
    }
    const rec = await adapter.recoverDatagramFec(s, { recoveredCount: 5 });
    expect(rec.outcome).toBe('success');
  });

  it('close cycle across all axes is clean', async () => {
    const adapter = makeMockAdapter();
    const svc = await adapter.startSvcFlow({ platform: 'chromium', trackName: 'v' });
    const dec = await adapter.startDecoderFlow({ platform: 'chromium', trackName: 'v', codec: 'H264' });
    const dg = await adapter.startDatagramFlow({ platform: 'chromium', trackName: 'v' });
    await adapter.closeSvcFlow(svc);
    await adapter.closeDecoderFlow(dec);
    await adapter.closeDatagramFlow(dg);
  });

  it('SVC + datagram interleave preserves state', async () => {
    const adapter = makeMockAdapter();
    const svc = await adapter.startSvcFlow({ platform: 'chromium', trackName: 'v' });
    const dg = await adapter.startDatagramFlow({ platform: 'chromium', trackName: 'v' });
    await adapter.selectSvcLayer(svc, { layerId: 'x', temporalId: 2, spatialId: 1 });
    await adapter.sendMediaDatagram(dg, { sequenceNumber: 1, bytes: 100, priority: 0 });
    await adapter.selectSvcLayer(svc, { layerId: 'x', temporalId: 1, spatialId: 0 });
    await adapter.sendMediaDatagram(dg, { sequenceNumber: 2, bytes: 100, priority: 5 });
    expect(svc.sessionId).not.toBe(dg.sessionId);
  });

  it('key vs delta frame flow works consistently', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startDecoderFlow({ platform: 'firefox', trackName: 'v', codec: 'AV1' });
    const key = await adapter.decodeMediaFrame(s, { frameNumber: 1, type: 'key' });
    const delta1 = await adapter.decodeMediaFrame(s, { frameNumber: 2, type: 'delta' });
    const delta2 = await adapter.decodeMediaFrame(s, { frameNumber: 3, type: 'delta' });
    expect(key.metadata.type).toBe('key');
    expect(delta1.metadata.type).toBe('delta');
    expect(delta2.metadata.type).toBe('delta');
  });

  it('SVC drop layer + re-select layer sequence', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startSvcFlow({ platform: 'webkit', trackName: 'v' });
    await adapter.selectSvcLayer(s, { layerId: 'high', temporalId: 2, spatialId: 1 });
    await adapter.dropSvcLayer(s, { layerId: 'high', reason: 'network' });
    const step = await adapter.selectSvcLayer(s, { layerId: 'low', temporalId: 0, spatialId: 0 });
    expect(step.metadata.layerId).toBe('low');
  });

  it('FEC recovery multiple times', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startDatagramFlow({ platform: 'chromium', trackName: 'v' });
    for (const cnt of [2, 3, 5]) {
      const step = await adapter.recoverDatagramFec(s, { recoveredCount: cnt });
      expect(step.metadata.recoveredCount).toBe(cnt);
    }
  });

  it('platform inheritance preserved across sessions', async () => {
    const adapter = makeMockAdapter();
    const svc = await adapter.startSvcFlow({ platform: 'firefox', trackName: 'v' });
    const dec = await adapter.startDecoderFlow({ platform: 'firefox', trackName: 'v', codec: 'H264' });
    expect(svc.platform).toBe('firefox');
    expect(dec.platform).toBe('firefox');
  });

  it('multiple decoder codec sessions work sequentially', async () => {
    const adapter = makeMockAdapter();
    for (const codec of ['H264', 'VP9', 'AV1'] as const) {
      const s = await adapter.startDecoderFlow({ platform: 'chromium', trackName: 'v', codec });
      const step = await adapter.decodeMediaFrame(s, { frameNumber: 1, type: 'key' });
      expect(step.outcome).toBe('success');
      await adapter.closeDecoderFlow(s);
    }
  });
});
