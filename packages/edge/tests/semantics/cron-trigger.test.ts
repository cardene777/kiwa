import { describe, expect, it } from 'vitest';
import {
  completeCron,
  failCron,
  platformEventName,
  scheduleCron,
  startCron,
  type EdgePlatform,
} from '../../src/index.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];

describe('cron-trigger axis — 3 platform', () => {
  it.each(platforms)('%s: schedule → start → complete happy path', (platform) => {
    const session = scheduleCron({ id: 'cron_1', platform, cronSpec: '*/5 * * * *' });
    expect(session.state).toBe('scheduled');
    expect(session.maxRetries).toBe(3);
    expect(session.triggerType).toBe('scheduled');
    const scheduled = session.history[0];
    expect(scheduled?.neutralEvent).toBe('cron.scheduled');
    expect(scheduled?.platformEvent).toBe(platformEventName(platform, 'cron.scheduled'));
    expect(scheduled?.metadata).toMatchObject({ cronSpec: '*/5 * * * *', maxRetries: 3 });

    const started = startCron(session);
    expect(started.state).toBe('running');
    expect(started.neutralEvent).toBe('cron.started');
    expect(started.platformEvent).toBe(platformEventName(platform, 'cron.started'));
    expect(session.startedAt).not.toBeNull();
    expect(started.metadata.startedAt).toBe(session.startedAt);

    const completed = completeCron(session, { durationMs: 120 });
    expect(completed.state).toBe('completed');
    expect(completed.neutralEvent).toBe('cron.completed');
    expect(completed.metadata).toMatchObject({ durationMs: 120, triggerType: 'scheduled' });
    expect(session.history).toHaveLength(3);
  });

  it.each(platforms)('%s: queue trigger type propagates through metadata', (platform) => {
    const session = scheduleCron({
      id: 'cron_q',
      platform,
      triggerType: 'queue',
      cronSpec: '@queue',
    });
    expect(session.history[0]?.metadata.triggerType).toBe('queue');
    const started = startCron(session);
    expect(started.metadata.triggerType).toBe('queue');
    const completed = completeCron(session, { durationMs: 5 });
    expect(completed.metadata.triggerType).toBe('queue');
  });

  it('failCron re-schedules while retries remain, then terminates in failed', () => {
    const session = scheduleCron({
      id: 'cron_retry',
      platform: 'cloudflare',
      cronSpec: '0 * * * *',
      maxRetries: 2,
    });
    startCron(session);
    const firstFail = failCron(session, { reason: 'timeout' });
    expect(firstFail.state).toBe('scheduled');
    expect(firstFail.metadata).toMatchObject({ reason: 'timeout', retryCount: 1, willRetry: true });

    startCron(session);
    const secondFail = failCron(session, { reason: 'timeout again' });
    expect(secondFail.state).toBe('failed');
    expect(secondFail.metadata).toMatchObject({ retryCount: 2, willRetry: false });
  });

  it('rejects startCron unless scheduled', () => {
    const session = scheduleCron({ id: 'cron_2', platform: 'vercel', cronSpec: '* * * * *' });
    startCron(session);
    expect(() => startCron(session)).toThrow(/expected scheduled/);
  });

  it('rejects completeCron unless running, and failCron after completed', () => {
    const session = scheduleCron({ id: 'cron_3', platform: 'deno', cronSpec: '* * * * *' });
    expect(() => completeCron(session, { durationMs: 1 })).toThrow(/expected running/);
    startCron(session);
    completeCron(session, { durationMs: 1 });
    expect(() => failCron(session, { reason: 'late' })).toThrow(/expected running/);
  });

  it('rejects failCron when session is still scheduled (never started)', () => {
    const session = scheduleCron({ id: 'cron_early', platform: 'cloudflare', cronSpec: '@daily' });
    expect(() => failCron(session, { reason: 'never ran' })).toThrow(/expected running/);
  });

  it('accumulates every transition into history', () => {
    const session = scheduleCron({
      id: 'cron_hist',
      platform: 'cloudflare',
      cronSpec: '* * * * *',
      maxRetries: 2,
    });
    startCron(session);
    failCron(session, { reason: 'boom' });
    startCron(session);
    completeCron(session, { durationMs: 3 });
    expect(session.history.map((s) => s.neutralEvent)).toEqual([
      'cron.scheduled',
      'cron.started',
      'cron.failed',
      'cron.started',
      'cron.completed',
    ]);
  });
});
