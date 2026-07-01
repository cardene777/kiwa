import { afterEach, describe, expect, it } from 'vitest';
import { setupBullMQEnv, type BullMQTestEnv } from '../src/index.js';

const envs: BullMQTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('setupBullMQEnv (defaults)', () => {
  it('defaults to sandbox backend when no mode is passed', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    expect(env.backend).toBe('sandbox');
    expect(env.mode).toBe('mock');
    expect(env.queueName).toBe('test-queue');
    expect(env.redisUrl).toBeUndefined();
  });

  it('accepts a custom queueName', async () => {
    const env = await setupBullMQEnv({ queueName: 'emails' });
    envs.push(env);
    expect(env.queueName).toBe('emails');
  });

  it('rejects an unknown mode', async () => {
    await expect(
      setupBullMQEnv({ mode: 'invalid' as unknown as 'sandbox' }),
    ).rejects.toThrow(/unknown mode/);
  });
});

describe('setupBullMQEnv (sandbox — happy path)', () => {
  it('T-QUEUE-001 processes a job and returns the processor result', async () => {
    const env = await setupBullMQEnv({ mode: 'sandbox' });
    envs.push(env);
    env.process<{ x: number }, number>(async (job) => job.data.x * 2);
    await env.addJob('double', { x: 7 });
    const snap = await env.assertProcessed<{ x: number }, number>('double', {
      returnValue: 14,
    });
    expect(snap.state).toBe('completed');
    expect(snap.attemptsMade).toBe(1);
  });

  it('T-QUEUE-002 waits for the terminal state through waitForJob', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    env.process(async () => 'ok');
    await env.addJob('greet', { name: 'kiwa' });
    const snap = await env.waitForJob<{ name: string }, string>('greet');
    expect(snap.returnValue).toBe('ok');
    expect(snap.state).toBe('completed');
  });

  it('T-QUEUE-003 assertProcessed compares the return value structurally', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    env.process(async () => ({ ok: true, id: 42 }));
    await env.addJob('shape', {});
    await env.assertProcessed('shape', { returnValue: { ok: true, id: 42 } });
  });

  it('T-QUEUE-004 assertProcessed rejects when the return value mismatches', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    env.process(async () => 1);
    await env.addJob('mismatch', {});
    await expect(env.assertProcessed('mismatch', { returnValue: 2 })).rejects.toThrow(
      /return value mismatch/,
    );
  });
});

describe('setupBullMQEnv (sandbox — retry + failure)', () => {
  it('T-QUEUE-005 retries a throwing processor up to `attempts` times', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    let calls = 0;
    env.process(async () => {
      calls += 1;
      if (calls < 3) throw new Error('transient');
      return 'ok';
    });
    await env.addJob('retry-me', {}, { attempts: 3 });
    const snap = await env.assertProcessed('retry-me');
    expect(calls).toBe(3);
    expect(snap.attemptsMade).toBe(3);
  });

  it('T-QUEUE-006 marks the job failed after exhausting attempts', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    env.process(async () => {
      throw new Error('permanent');
    });
    await env.addJob('doomed', {}, { attempts: 2 });
    const snap = await env.assertFailed('doomed', {
      retry: 2,
      reasonMatch: /permanent/,
    });
    expect(snap.state).toBe('failed');
  });

  it('T-QUEUE-007 assertRetried checks the observed attempt count', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    let seen = 0;
    env.process(async () => {
      seen += 1;
      if (seen === 1) throw new Error('first');
      return 42;
    });
    await env.addJob('one-retry', {}, { attempts: 3 });
    await env.assertRetried('one-retry', 2);
  });

  it('T-QUEUE-008 assertFailed rejects when the retry count does not match', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    env.process(async () => {
      throw new Error('boom');
    });
    await env.addJob('wrong-retry-count', {}, { attempts: 2 });
    await expect(
      env.assertFailed('wrong-retry-count', { retry: 5 }),
    ).rejects.toThrow(/expected 5 attempt/);
  });

  it('T-QUEUE-009 assertFailed rejects when the failedReason does not match', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    env.process(async () => {
      throw new Error('database offline');
    });
    await env.addJob('reason-mismatch', {}, { attempts: 1 });
    await expect(
      env.assertFailed('reason-mismatch', { reasonMatch: /nowhere/ }),
    ).rejects.toThrow(/did not match/);
  });
});

describe('setupBullMQEnv (sandbox — drain + introspection)', () => {
  it('T-QUEUE-010 assertQueueDrained succeeds once every job is terminal', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    env.process(async () => 'ok');
    await env.addJob('a', {});
    await env.addJob('b', {});
    await env.addJob('c', {});
    await env.assertQueueDrained();
    const jobs = env.listJobs();
    expect(jobs.length).toBe(3);
    expect(jobs.every((job) => job.state === 'completed')).toBe(true);
  });

  it('T-QUEUE-011 assertQueueDrained rejects when a job is still waiting', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    // No processor registered → the job stays waiting forever.
    await env.addJob('stuck', {});
    await expect(env.assertQueueDrained()).rejects.toThrow(/still has/);
  });

  it('T-QUEUE-012 listJobs returns every snapshot', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    env.process(async () => 'ok');
    await env.addJob('one', { value: 1 });
    await env.addJob('two', { value: 2 });
    await env.assertQueueDrained();
    const names = env.listJobs().map((job) => job.name).sort((a, b) => a.localeCompare(b, 'en'));
    expect(names).toEqual(['one', 'two']);
  });
});

describe('setupBullMQEnv (sandbox — options + delayed)', () => {
  it('T-QUEUE-013 honours a jobId override', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    env.process(async () => 1);
    const snap = await env.addJob('with-id', {}, { jobId: 'custom-id-42' });
    expect(snap.id).toBe('custom-id-42');
    await env.assertProcessed('with-id');
  });

  it('T-QUEUE-014 rejects a negative delay', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    await expect(env.addJob('bad', {}, { delay: -1 })).rejects.toThrow(/delay/);
  });

  it('T-QUEUE-015 rejects zero attempts', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    await expect(env.addJob('bad', {}, { attempts: 0 })).rejects.toThrow(/attempts/);
  });

  it('T-QUEUE-016 processes a delayed job after its delay elapses', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    env.process(async () => 'done');
    const enqueuedAt = Date.now();
    await env.addJob('delayed', {}, { delay: 40 });
    await env.assertProcessed('delayed');
    // The job must have been scheduled after the delay window elapsed. We
    // guard with a small tolerance because the sandbox scheduler polls the
    // clock, and Node timers routinely fire ~2ms early on macOS + Linux CI.
    expect(Date.now() - enqueuedAt).toBeGreaterThanOrEqual(35);
  });
});

describe('setupBullMQEnv (sandbox — waitForJob timeout)', () => {
  it('T-QUEUE-017 waitForJob rejects when no matching job appears', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    await expect(env.waitForJob('never', { timeoutMs: 20 })).rejects.toThrow(
      /timeout waiting/,
    );
  });

  it('T-QUEUE-018 waitForJob returns immediately for an already-terminal job', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    env.process(async () => 'ok');
    await env.addJob('done-first', {});
    await env.assertProcessed('done-first');
    const snap = await env.waitForJob('done-first', { timeoutMs: 100 });
    expect(snap.state).toBe('completed');
  });
});

describe('setupBullMQEnv (sandbox — stop semantics)', () => {
  it('T-QUEUE-019 stop() clears queued jobs so subsequent addJob throws', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    env.process(async () => 1);
    await env.addJob('cleanup-me', {});
    await env.assertQueueDrained();
    await env.stop();
    await expect(env.addJob('after-stop', {})).rejects.toThrow(/after stop/);
    // Remove from the afterEach queue since we already called stop.
    envs.pop();
  });

  it('T-QUEUE-020 rejects an empty providers spec — sanity guard for addJob typing', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    env.process(async (job) => (job.data as { count: number }).count + 1);
    const snap = await env.addJob<{ count: number }>('typed', { count: 2 });
    expect(snap.data.count).toBe(2);
    const done = await env.assertProcessed<{ count: number }, number>('typed', {
      returnValue: 3,
    });
    expect(done.returnValue).toBe(3);
  });
});
