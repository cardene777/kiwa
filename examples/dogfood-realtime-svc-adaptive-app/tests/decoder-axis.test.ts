import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { Platform } from '../src/adapters/interface.js';

const platforms: Platform[] = ['chromium', 'webkit', 'firefox'];

describe('decoder axis — mock adapter', () => {
  it.each(platforms)('%s: startDecoderFlow with codec', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startDecoderFlow({ platform, trackName: 'v-1', codec: 'H264' });
    expect(s.sessionId).toMatch(/^dec-\d+$/);
  });

  it('decodeMediaFrame differentiates key vs delta', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startDecoderFlow({ platform: 'chromium', trackName: 'v-1', codec: 'VP9' });
    const key = await adapter.decodeMediaFrame(s, { frameNumber: 1, type: 'key' });
    const delta = await adapter.decodeMediaFrame(s, { frameNumber: 2, type: 'delta' });
    expect(key.metadata.type).toBe('key');
    expect(delta.metadata.type).toBe('delta');
  });

  it('dropDecoderFrame records reason', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startDecoderFlow({ platform: 'webkit', trackName: 'v-1', codec: 'AV1' });
    const step = await adapter.dropDecoderFrame(s, { frameNumber: 5, reason: 'budget-exceeded' });
    expect(step.metadata.reason).toBe('budget-exceeded');
  });

  it('decodeMediaFrame rejects unknown session', async () => {
    const adapter = makeMockAdapter();
    await expect(
      adapter.decodeMediaFrame({ sessionId: 'nope', platform: 'chromium', trackName: 't' }, { frameNumber: 1, type: 'key' }),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('closeDecoderFlow removes session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startDecoderFlow({ platform: 'firefox', trackName: 'v-1', codec: 'H264' });
    await adapter.closeDecoderFlow(s);
    await expect(
      adapter.decodeMediaFrame(s, { frameNumber: 1, type: 'key' }),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('all 3 codecs work', async () => {
    const adapter = makeMockAdapter();
    for (const codec of ['H264', 'VP9', 'AV1'] as const) {
      const s = await adapter.startDecoderFlow({ platform: 'chromium', trackName: 'v', codec });
      const step = await adapter.decodeMediaFrame(s, { frameNumber: 1, type: 'key' });
      expect(step.outcome).toBe('success');
    }
  });
});

describe('decoder axis — real adapter env-gate', () => {
  it.each(platforms)('%s: decodeMediaFrame reports env-missing', async (platform) => {
    const adapter = makeRealAdapter();
    const s = await adapter.startDecoderFlow({ platform, trackName: 'v-1', codec: 'H264' });
    const step = await adapter.decodeMediaFrame(s, { frameNumber: 1, type: 'key' });
    expect(step.outcome).toBe('env-missing');
  });

  it('dropDecoderFrame reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startDecoderFlow({ platform: 'chromium', trackName: 'v-1', codec: 'H264' });
    const step = await adapter.dropDecoderFrame(s, { frameNumber: 1, reason: 'x' });
    expect(step.outcome).toBe('env-missing');
  });
});
