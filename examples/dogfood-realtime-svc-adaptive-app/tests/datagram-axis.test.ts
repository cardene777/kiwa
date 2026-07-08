import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import type { Platform } from '../src/adapters/interface.js';

const platforms: Platform[] = ['chromium', 'webkit', 'firefox'];

describe('datagram axis — mock adapter', () => {
  it.each(platforms)('%s: startDatagramFlow assigns session', async (platform) => {
    const adapter = makeMockAdapter();
    const s = await adapter.startDatagramFlow({ platform, trackName: 'v-1' });
    expect(s.sessionId).toMatch(/^dg-\d+$/);
  });

  it('sendMediaDatagram records bytes + priority', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startDatagramFlow({ platform: 'chromium', trackName: 'v-1' });
    const step = await adapter.sendMediaDatagram(s, { sequenceNumber: 1, bytes: 300, priority: 5 });
    expect(step.metadata.bytes).toBe(300);
    expect(step.metadata.priority).toBe(5);
  });

  it('recoverDatagramFec records count', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startDatagramFlow({ platform: 'webkit', trackName: 'v-1' });
    const step = await adapter.recoverDatagramFec(s, { recoveredCount: 5 });
    expect(step.metadata.recoveredCount).toBe(5);
  });

  it('sendMediaDatagram rejects unknown session', async () => {
    const adapter = makeMockAdapter();
    await expect(
      adapter.sendMediaDatagram({ sessionId: 'nope', platform: 'chromium', trackName: 't' }, { sequenceNumber: 1, bytes: 100, priority: 0 }),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('closeDatagramFlow removes session', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startDatagramFlow({ platform: 'firefox', trackName: 'v-1' });
    await adapter.closeDatagramFlow(s);
    await expect(
      adapter.sendMediaDatagram(s, { sequenceNumber: 1, bytes: 100, priority: 0 }),
    ).rejects.toThrow(/unknown sessionId/);
  });

  it('multiple datagrams accumulate', async () => {
    const adapter = makeMockAdapter();
    const s = await adapter.startDatagramFlow({ platform: 'chromium', trackName: 'v-1' });
    for (let seq = 1; seq <= 5; seq++) {
      const step = await adapter.sendMediaDatagram(s, { sequenceNumber: seq, bytes: 100, priority: 0 });
      expect(step.metadata.sequenceNumber).toBe(seq);
    }
  });
});

describe('datagram axis — real adapter env-gate', () => {
  it.each(platforms)('%s: sendMediaDatagram reports env-missing', async (platform) => {
    const adapter = makeRealAdapter();
    const s = await adapter.startDatagramFlow({ platform, trackName: 'v-1' });
    const step = await adapter.sendMediaDatagram(s, { sequenceNumber: 1, bytes: 100, priority: 0 });
    expect(step.outcome).toBe('env-missing');
  });

  it('recoverDatagramFec reports env-missing', async () => {
    const adapter = makeRealAdapter();
    const s = await adapter.startDatagramFlow({ platform: 'chromium', trackName: 'v-1' });
    const step = await adapter.recoverDatagramFec(s, { recoveredCount: 3 });
    expect(step.outcome).toBe('env-missing');
  });
});
