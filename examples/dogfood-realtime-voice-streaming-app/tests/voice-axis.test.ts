import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { Platform } from '../src/adapters/interface.js';

const platforms: Platform[] = ['chromium', 'webkit', 'firefox'];

describe('voice axis — mock adapter', () => {
  it.each(platforms)('%s: startVoiceFlow assigns session', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startVoiceFlow({ platform, userId: 'u', model: 'gpt-4o-realtime' });
    expect(s.sessionId).toMatch(/^voice-\d+$/);
    expect(s.userId).toBe('u');
  });

  it('sendVoiceAudio records bytes + duration', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startVoiceFlow({ platform: 'chromium', userId: 'u', model: 'x' });
    const step = await adapter.sendVoiceAudio(s, { seq: 1, bytes: 8000, durationMs: 200 });
    expect(step.metadata.bytes).toBe(8000);
    expect(step.metadata.durationMs).toBe(200);
  });

  it('completeVoiceTurn records total duration', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startVoiceFlow({ platform: 'webkit', userId: 'u', model: 'x' });
    const step = await adapter.completeVoiceTurn(s, { totalDurationMs: 5000 });
    expect(step.metadata.totalDurationMs).toBe(5000);
  });

  it('sendVoiceAudio rejects unknown session', async () => {
    const adapter = makeMockAdapter();
    await expect(
      adapter.sendVoiceAudio({ sessionId: 'nope', platform: 'chromium', userId: 'u' }, { seq: 1, bytes: 100, durationMs: 10 }),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('closeVoiceFlow removes session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startVoiceFlow({ platform: 'firefox', userId: 'u', model: 'x' });
    await adapter.closeVoiceFlow(s);
    await expect(
      adapter.sendVoiceAudio(s, { seq: 1, bytes: 100, durationMs: 10 }),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('multiple audio chunks accumulate', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startVoiceFlow({ platform: 'chromium', userId: 'u', model: 'x' });
    for (let seq = 1; seq <= 5; seq++) {
      const step = await adapter.sendVoiceAudio(s, { seq, bytes: 800, durationMs: 100 });
      expect(step.outcome).toBe('success');
    }
  });
});

describe('voice axis — real adapter env-gate', () => {
  it.each(platforms)('%s: sendVoiceAudio reports env-missing', async (platform) => {
    const adapter = makeRealAdapter();
    const s = await adapter.startVoiceFlow({ platform, userId: 'u', model: 'x' });
    const step = await adapter.sendVoiceAudio(s, { seq: 1, bytes: 100, durationMs: 10 });
    expect(step.outcome).toBe('env-missing');
  });

  it('completeVoiceTurn reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startVoiceFlow({ platform: 'chromium', userId: 'u', model: 'x' });
    const step = await adapter.completeVoiceTurn(s, { totalDurationMs: 1000 });
    expect(step.outcome).toBe('env-missing');
  });
});
