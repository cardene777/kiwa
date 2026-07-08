import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { Platform } from '../src/adapters/interface.js';

const platforms: Platform[] = ['chromium', 'webkit', 'firefox'];

describe('whisper axis — mock adapter', () => {
  it.each(platforms)('%s: startWhisperFlow assigns session', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startWhisperFlow({ platform, userId: 'u' });
    expect(s.sessionId).toMatch(/^whisper-\d+$/);
  });

  it('streamAudioToWhisper records bytes', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startWhisperFlow({ platform: 'chromium', userId: 'u' });
    const step = await adapter.streamAudioToWhisper(s, { bytes: 3200, durationMs: 200 });
    expect(step.metadata.bytes).toBe(3200);
  });

  it('triggerVadEvent supports start + end', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startWhisperFlow({ platform: 'webkit', userId: 'u' });
    const start = await adapter.triggerVadEvent(s, { type: 'start', timestampMs: 0 });
    const end = await adapter.triggerVadEvent(s, { type: 'end', timestampMs: 500 });
    expect(start.metadata.type).toBe('start');
    expect(end.metadata.type).toBe('end');
  });

  it('streamAudioToWhisper rejects unknown session', async () => {
    const adapter = makeMockAdapter();
    await expect(
      adapter.streamAudioToWhisper({ sessionId: 'nope', platform: 'chromium', userId: 'u' }, { bytes: 100, durationMs: 10 }),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('closeWhisperFlow removes session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startWhisperFlow({ platform: 'firefox', userId: 'u' });
    await adapter.closeWhisperFlow(s);
    await expect(
      adapter.streamAudioToWhisper(s, { bytes: 100, durationMs: 10 }),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('multiple audio streams accumulate', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startWhisperFlow({ platform: 'chromium', userId: 'u' });
    for (let i = 0; i < 5; i++) {
      const step = await adapter.streamAudioToWhisper(s, { bytes: 800, durationMs: 100 });
      expect(step.outcome).toBe('success');
    }
  });
});

describe('whisper axis — real adapter env-gate', () => {
  it.each(platforms)('%s: streamAudioToWhisper reports env-missing', async (platform) => {
    const adapter = makeRealAdapter();
    const s = await adapter.startWhisperFlow({ platform, userId: 'u' });
    const step = await adapter.streamAudioToWhisper(s, { bytes: 100, durationMs: 10 });
    expect(step.outcome).toBe('env-missing');
  });

  it('triggerVadEvent reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startWhisperFlow({ platform: 'chromium', userId: 'u' });
    const step = await adapter.triggerVadEvent(s, { type: 'start', timestampMs: 0 });
    expect(step.outcome).toBe('env-missing');
  });
});
