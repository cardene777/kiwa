import { describe, expect, it } from 'vitest';
import { setupBullMQEnv } from '../src/setup-bullmq-env.js';

describe('sandbox bullmq env defensive branches', () => {
  it('addJob throws when env is stopped', async () => {
    const env = await setupBullMQEnv({ mode: 'sandbox' });
    await env.stop();
    await expect(env.addJob('job-1', { data: 'x' } as unknown)).rejects.toThrow(
      /cannot addJob after stop/,
    );
  });

  it('process registers a processor and addJob completes it', async () => {
    const env = await setupBullMQEnv({ mode: 'sandbox' });
    env.process(async (job) => `processed:${JSON.stringify(job.data)}`);
    await env.addJob('job-happy', { hello: 'world' } as unknown);
    const snap = await env.waitForJob('job-happy');
    expect(snap.state).toBe('completed');
  });

  it('failed job is retried when attempts > 1', async () => {
    const env = await setupBullMQEnv({ mode: 'sandbox' });
    let calls = 0;
    env.process(async () => {
      calls += 1;
      if (calls < 2) throw new Error('transient fail');
      return 'ok';
    });
    await env.addJob(
      'job-retry',
      { data: 'x' } as unknown,
      { attempts: 3 },
    );
    const snap = await env.waitForJob('job-retry');
    expect(snap.state).toBe('completed');
    expect(calls).toBeGreaterThanOrEqual(2);
  });

  it('failed job stays failed when attempts exhausted', async () => {
    const env = await setupBullMQEnv({ mode: 'sandbox' });
    env.process(async () => {
      throw new Error('always fails');
    });
    await env.addJob('job-fail', { data: 'x' } as unknown, { attempts: 1 });
    const snap = await env.waitForJob('job-fail');
    expect(snap.state).toBe('failed');
    expect(snap.failedReason).toContain('always fails');
  });

  it('waitForJob times out when job never runs', async () => {
    const env = await setupBullMQEnv({ mode: 'sandbox' });
    await expect(
      env.waitForJob('nonexistent-job', { timeoutMs: 50 }),
    ).rejects.toThrow(/timeout/);
  });

  it('assertProcessed throws when job did not complete', async () => {
    const env = await setupBullMQEnv({ mode: 'sandbox' });
    env.process(async () => {
      throw new Error('boom');
    });
    await env.addJob('job-not-processed', { d: 1 } as unknown, {
      attempts: 1,
    });
    await expect(env.assertProcessed('job-not-processed')).rejects.toThrow(
      /expected job .* to complete/,
    );
  });

  it('stop is idempotent (calling twice does not throw)', async () => {
    const env = await setupBullMQEnv({ mode: 'sandbox' });
    await env.stop();
    await expect(env.stop()).resolves.toBeUndefined();
  });
});
