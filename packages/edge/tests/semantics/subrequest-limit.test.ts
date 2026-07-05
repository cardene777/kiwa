import { describe, expect, it } from 'vitest';
import {
  completeSubrequest,
  countSubrequest,
  platformEventName,
  remainingBudget,
  startSubrequest,
  startSubrequestBudget,
  type EdgePlatform,
} from '../../src/index.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];

describe('subrequest-limit axis — 3 platform', () => {
  it.each(platforms)('%s: start → count → complete happy path', (platform) => {
    const session = startSubrequestBudget({ platform, limit: 5, warningThreshold: 4 });
    expect(session.state).toBe('ok');
    expect(session.history).toHaveLength(0);

    const started = startSubrequest(session, { url: 'https://api/a' });
    expect(started.neutralEvent).toBe('subrequest.started');
    expect(started.platformEvent).toBe(platformEventName(platform, 'subrequest.started'));
    expect(started.metadata).toMatchObject({ url: 'https://api/a', currentCount: 0 });
    expect(session.state).toBe('ok');

    const counted = countSubrequest(session);
    expect(counted.neutralEvent).toBe('subrequest.counted');
    expect(counted.metadata).toMatchObject({ count: 1, limit: 5, remaining: 4 });

    const completed = completeSubrequest(session, { url: 'https://api/a', durationMs: 12 });
    expect(completed.neutralEvent).toBe('subrequest.completed');
    expect(completed.metadata).toMatchObject({ totalCount: 1, durationMs: 12 });
  });

  it.each(platforms)('%s: crossing warning threshold flips to approaching-limit', (platform) => {
    const session = startSubrequestBudget({ platform, limit: 5, warningThreshold: 3 });
    countSubrequest(session);
    countSubrequest(session);
    const third = countSubrequest(session);
    expect(third.state).toBe('approaching-limit');
    expect(session.state).toBe('approaching-limit');
  });

  it('reaching the limit emits subrequest.limited and blocks further starts', () => {
    const session = startSubrequestBudget({ platform: 'cloudflare', limit: 2, warningThreshold: 1 });
    countSubrequest(session);
    const limited = countSubrequest(session);
    expect(limited.neutralEvent).toBe('subrequest.limited');
    expect(limited.platformEvent).toBe(platformEventName('cloudflare', 'subrequest.limited'));
    expect(limited.state).toBe('limited');
    expect(limited.metadata).toMatchObject({ count: 2, limit: 2 });
    expect(() => startSubrequest(session, { url: 'https://api/blocked' })).toThrow(/limited/);
  });

  it('countSubrequest after limit rejects to prevent overshoot', () => {
    const session = startSubrequestBudget({ platform: 'vercel', limit: 1, warningThreshold: 1 });
    countSubrequest(session);
    expect(session.state).toBe('limited');
    expect(() => countSubrequest(session)).toThrow(/cannot count further/);
    expect(session.count).toBe(1);
  });

  it('defaults limit=50 and warningThreshold=40', () => {
    const session = startSubrequestBudget({ platform: 'vercel' });
    expect(session.limit).toBe(50);
    expect(session.warningThreshold).toBe(40);
  });

  it('remainingBudget never goes negative and tracks count', () => {
    const session = startSubrequestBudget({ platform: 'deno', limit: 2, warningThreshold: 1 });
    expect(remainingBudget(session)).toBe(2);
    countSubrequest(session);
    expect(remainingBudget(session)).toBe(1);
    countSubrequest(session);
    expect(remainingBudget(session)).toBe(0);
  });

  it('completeSubrequest after limit keeps the limited state', () => {
    const session = startSubrequestBudget({ platform: 'deno', limit: 1, warningThreshold: 1 });
    countSubrequest(session);
    expect(session.state).toBe('limited');
    const completed = completeSubrequest(session, { url: 'https://api/x', durationMs: 3 });
    expect(completed.state).toBe('limited');
  });

  it('accumulates every step into history', () => {
    const session = startSubrequestBudget({ platform: 'cloudflare', limit: 2, warningThreshold: 1 });
    startSubrequest(session, { url: 'https://api/a' });
    countSubrequest(session);
    countSubrequest(session);
    completeSubrequest(session, { url: 'https://api/a', durationMs: 1 });
    expect(session.history.map((s) => s.neutralEvent)).toEqual([
      'subrequest.started',
      'subrequest.counted',
      'subrequest.limited',
      'subrequest.completed',
    ]);
  });
});
