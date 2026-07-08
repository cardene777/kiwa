import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { Platform } from '../src/adapters/interface.js';

const platforms: Platform[] = ['chromium', 'webkit', 'firefox'];

describe('moq axis — mock adapter', () => {
  it.each(platforms)('%s: startMoqFlow assigns session', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startMoqFlow({ platform, trackName: 'v-1' });
    expect(s.sessionId).toMatch(/^moq-\d+$/);
    expect(s.trackName).toBe('v-1');
  });

  it.each(platforms)('%s: announceMoqTrack succeeds', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startMoqFlow({ platform, trackName: 'v-1' });
    const step = await adapter.announceMoqTrack(s, { namespace: 'live' });
    expect(step.outcome).toBe('success');
    expect(step.metadata.namespace).toBe('live');
  });

  it('sendMoqObject succeeds with correct metadata', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startMoqFlow({ platform: 'chromium', trackName: 'v-1' });
    const step = await adapter.sendMoqObject(s, { groupId: 2, objectId: 5, bytes: 1500 });
    expect(step.metadata.groupId).toBe(2);
    expect(step.metadata.objectId).toBe(5);
    expect(step.metadata.bytes).toBe(1500);
  });

  it('announceMoqTrack rejects unknown session', async () => {
    const adapter = makeMockAdapter();
    await expect(
      adapter.announceMoqTrack({ sessionId: 'nope', platform: 'chromium', trackName: 'x' }, { namespace: 'x' }),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('closeMoqFlow removes session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startMoqFlow({ platform: 'webkit', trackName: 'v-1' });
    await adapter.closeMoqFlow(s);
    await expect(adapter.announceMoqTrack(s, { namespace: 'x' })).rejects.toThrow(/unknown sessionId/);
  });

  it('multiple sessions are independent', async () => {
    const adapter = makeMockAdapter();
    const s1 = await adapter.startMoqFlow({ platform: 'chromium', trackName: 'v-1' });
    const s2 = await adapter.startMoqFlow({ platform: 'firefox', trackName: 'v-2' });
    expect(s1.sessionId).not.toBe(s2.sessionId);
  });
});

describe('moq axis — real adapter env-gate', () => {
  it.each(platforms)('%s: announceMoqTrack reports env-missing', async (platform) => {
    const adapter = makeRealAdapter();
    const s = await adapter.startMoqFlow({ platform, trackName: 'v-1' });
    const step = await adapter.announceMoqTrack(s, { namespace: 'live' });
    expect(step.outcome).toBe('env-missing');
  });

  it('sendMoqObject reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startMoqFlow({ platform: 'chromium', trackName: 'v-1' });
    const step = await adapter.sendMoqObject(s, { groupId: 1, objectId: 1, bytes: 100 });
    expect(step.outcome).toBe('env-missing');
  });
});
