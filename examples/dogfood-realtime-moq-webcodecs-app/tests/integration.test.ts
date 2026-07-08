import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { Platform } from '../src/adapters/interface.js';

const platforms: Platform[] = ['chromium', 'webkit', 'firefox'];

describe('integration — MoQ + WebCodecs cross-axis', () => {
  it.each(platforms)('%s: full moq → encoder → simulcast chain', async (platform) => {
    const adapter = makeMockAdapter();
    const moq = await adapter.startMoqFlow({ platform, trackName: 'v-1' });
    await adapter.announceMoqTrack(moq, { namespace: 'live' });
    await adapter.sendMoqObject(moq, { groupId: 1, objectId: 1, bytes: 1500 });
    await adapter.closeMoqFlow(moq);
    const enc = await adapter.startEncoderFlow({ platform, trackName: 'v-1', codec: 'H264' });
    await adapter.encodeMediaFrame(enc, { frameNumber: 1, byteLength: 5000 });
    await adapter.reportEncoderHardware(enc, { hardware: true });
    await adapter.closeEncoderFlow(enc);
    const sim = await adapter.startSimulcastFlow({ platform, trackName: 'v-1' });
    await adapter.addSimulcastQualityLayer(sim, { layerId: 'high', bitrateKbps: 2500 });
    const adapt = await adapter.adaptSimulcastBitrate(sim, { layerId: 'high', targetKbps: 1500, reason: 'x' });
    expect(adapt.outcome).toBe('success');
  });

  it('concurrent sessions across axes are independent', async () => {
    const adapter = makeMockAdapter();
    const moq = await adapter.startMoqFlow({ platform: 'chromium', trackName: 't1' });
    const enc = await adapter.startEncoderFlow({ platform: 'webkit', trackName: 't2', codec: 'VP9' });
    const sim = await adapter.startSimulcastFlow({ platform: 'firefox', trackName: 't3' });
    expect(moq.sessionId).not.toBe(enc.sessionId);
    expect(enc.sessionId).not.toBe(sim.sessionId);
  });

  it('encoder byte length preserved across encode calls', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startEncoderFlow({ platform: 'chromium', trackName: 't', codec: 'AV1' });
    const step = await adapter.encodeMediaFrame(s, { frameNumber: 42, byteLength: 12345 });
    expect(step.metadata.byteLength).toBe(12345);
    expect(step.metadata.frameNumber).toBe(42);
  });

  it('simulcast adaptation cascade works', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startSimulcastFlow({ platform: 'chromium', trackName: 't' });
    await adapter.addSimulcastQualityLayer(s, { layerId: 'high', bitrateKbps: 5000 });
    for (let target of [4000, 3000, 2000, 1000]) {
      const step = await adapter.adaptSimulcastBitrate(s, { layerId: 'high', targetKbps: target, reason: 'r' });
      expect(step.metadata.targetKbps).toBe(target);
    }
  });

  it('close in one axis does not affect other axes', async () => {
    const adapter = makeMockAdapter();
    const moq = await adapter.startMoqFlow({ platform: 'chromium', trackName: 'v-1' });
    const enc = await adapter.startEncoderFlow({ platform: 'chromium', trackName: 'v-1', codec: 'H264' });
    await adapter.closeMoqFlow(moq);
    const step = await adapter.encodeMediaFrame(enc, { frameNumber: 1, byteLength: 100 });
    expect(step.outcome).toBe('success');
  });

  it('encoder + simulcast concurrent works', async () => {
    const adapter = makeMockAdapter();
    const enc = await adapter.startEncoderFlow({ platform: 'chromium', trackName: 'v', codec: 'H264' });
    const sim = await adapter.startSimulcastFlow({ platform: 'chromium', trackName: 'v' });
    await adapter.encodeMediaFrame(enc, { frameNumber: 1, byteLength: 100 });
    await adapter.addSimulcastQualityLayer(sim, { layerId: 'high', bitrateKbps: 2500 });
    expect(enc.sessionId).not.toBe(sim.sessionId);
  });

  it('simulcast bitrate reason chain works', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startSimulcastFlow({ platform: 'chromium', trackName: 'v' });
    await adapter.addSimulcastQualityLayer(s, { layerId: 'high', bitrateKbps: 2500 });
    for (const reason of ['congestion', 'packet-loss', 'network-idle']) {
      const step = await adapter.adaptSimulcastBitrate(s, { layerId: 'high', targetKbps: 1500, reason });
      expect(step.metadata.reason).toBe(reason);
    }
  });

  it('MoQ session tracks preserved', async () => {
    const adapter = makeMockAdapter();
    const s1 = await adapter.startMoqFlow({ platform: 'chromium', trackName: 'track-a' });
    const s2 = await adapter.startMoqFlow({ platform: 'chromium', trackName: 'track-b' });
    expect(s1.trackName).toBe('track-a');
    expect(s2.trackName).toBe('track-b');
  });

  it('encoder handles multiple codec configurations sequentially', async () => {
    const adapter = makeMockAdapter();
    for (const codec of ['H264', 'VP9', 'AV1'] as const) {
      const s = await adapter.startEncoderFlow({ platform: 'chromium', trackName: 'v', codec });
      const step = await adapter.encodeMediaFrame(s, { frameNumber: 1, byteLength: 100 });
      expect(step.outcome).toBe('success');
      await adapter.closeEncoderFlow(s);
    }
  });

  it('MoQ + encoder interleave preserves session state', async () => {
    const adapter = makeMockAdapter();
    const moq = await adapter.startMoqFlow({ platform: 'chromium', trackName: 'v' });
    const enc = await adapter.startEncoderFlow({ platform: 'chromium', trackName: 'v', codec: 'H264' });
    await adapter.announceMoqTrack(moq, { namespace: 'x' });
    await adapter.encodeMediaFrame(enc, { frameNumber: 1, byteLength: 100 });
    await adapter.sendMoqObject(moq, { groupId: 1, objectId: 1, bytes: 100 });
    await adapter.encodeMediaFrame(enc, { frameNumber: 2, byteLength: 100 });
    expect(moq.trackName).toBe('v');
    expect(enc.trackName).toBe('v');
  });
});
