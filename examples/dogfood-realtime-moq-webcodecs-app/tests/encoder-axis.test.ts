import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { Platform } from '../src/adapters/interface.js';

const platforms: Platform[] = ['chromium', 'webkit', 'firefox'];

describe('encoder axis — mock adapter', () => {
  it.each(platforms)('%s: startEncoderFlow initializes with codec', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startEncoderFlow({ platform, trackName: 'v-1', codec: 'H264' });
    expect(s.sessionId).toMatch(/^enc-\d+$/);
  });

  it('encodeMediaFrame records byte length', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startEncoderFlow({ platform: 'chromium', trackName: 'v-1', codec: 'VP9' });
    const step = await adapter.encodeMediaFrame(s, { frameNumber: 1, byteLength: 5000 });
    expect(step.metadata.byteLength).toBe(5000);
  });

  it('reportEncoderHardware differentiates hardware/software', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startEncoderFlow({ platform: 'webkit', trackName: 'v-1', codec: 'AV1' });
    const step1 = await adapter.reportEncoderHardware(s, { hardware: true });
    const step2 = await adapter.reportEncoderHardware(s, { hardware: false });
    expect(step1.metadata.hardware).toBe(true);
    expect(step2.metadata.hardware).toBe(false);
  });

  it('encodeMediaFrame rejects unknown session', async () => {
    const adapter = makeMockAdapter();
    await expect(
      adapter.encodeMediaFrame(
        { sessionId: 'nope', platform: 'chromium', trackName: 'x' },
        { frameNumber: 1, byteLength: 100 },
      ),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('closeEncoderFlow removes session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startEncoderFlow({ platform: 'firefox', trackName: 'v-1', codec: 'H264' });
    await adapter.closeEncoderFlow(s);
    await expect(
      adapter.encodeMediaFrame(s, { frameNumber: 1, byteLength: 100 }),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('all 3 codecs work in flow', async () => {
    const adapter = makeMockAdapter();
    for (const codec of ['H264', 'VP9', 'AV1'] as const) {
      const s = await adapter.startEncoderFlow({ platform: 'chromium', trackName: 'v', codec });
      const step = await adapter.encodeMediaFrame(s, { frameNumber: 1, byteLength: 100 });
      expect(step.outcome).toBe('success');
    }
  });
});

describe('encoder axis — real adapter env-gate', () => {
  it.each(platforms)('%s: encodeMediaFrame reports env-missing', async (platform) => {
    const adapter = makeRealAdapter();
    const s = await adapter.startEncoderFlow({ platform, trackName: 'v', codec: 'H264' });
    const step = await adapter.encodeMediaFrame(s, { frameNumber: 1, byteLength: 100 });
    expect(step.outcome).toBe('env-missing');
  });

  it('reportEncoderHardware reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startEncoderFlow({ platform: 'chromium', trackName: 'v', codec: 'H264' });
    const step = await adapter.reportEncoderHardware(s, { hardware: true });
    expect(step.outcome).toBe('env-missing');
  });
});
