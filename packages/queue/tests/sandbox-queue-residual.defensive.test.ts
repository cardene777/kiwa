import { afterEach, describe, expect, it } from 'vitest';
import { setupBullMQEnv, type BullMQTestEnv } from '../src/index.js';

const envs: BullMQTestEnv[] = [];
afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('sandbox-queue residual defensive branches', () => {
  it('add before process registration keeps job in waiting state', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    await env.addJob('pending-job', { data: 'x' });
    const snap = env.listJobs()[0];
    expect(snap?.state).toBe('waiting');
  });

  it('assertProcessed rejects when return value does not match expected', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    env.process(async () => 'actual-value');
    await env.addJob('mismatch-job', { data: 'x' });
    await expect(
      env.assertProcessed('mismatch-job', {
        returnValue: 'expected-different',
      }),
    ).rejects.toThrow(/return value mismatch/);
  });

  it('assertProcessed accepts matching return value', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    env.process(async () => ({ ok: true, value: 42 }));
    await env.addJob('match-job', { data: 'x' });
    const snap = await env.assertProcessed('match-job', {
      returnValue: { ok: true, value: 42 },
    });
    expect(snap.state).toBe('completed');
  });

  it('assertFailed rejects when retry count mismatches', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    env.process(async () => {
      throw new Error('boom');
    });
    await env.addJob('retry-mismatch', { data: 'x' }, { attempts: 1 });
    await expect(
      env.assertFailed('retry-mismatch', { retry: 99 }),
    ).rejects.toThrow(/expected 99 attempt/);
  });

  it('assertFailed rejects when reasonMatch does not match', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    env.process(async () => {
      throw new Error('actual-reason');
    });
    await env.addJob('reason-mismatch', { data: 'x' }, { attempts: 1 });
    await expect(
      env.assertFailed('reason-mismatch', {
        reasonMatch: /wrong-reason/,
      }),
    ).rejects.toThrow(/did not match/);
  });

  it('assertRetried rejects when attempt count mismatches', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    env.process(async () => 'ok');
    await env.addJob('one-attempt', { data: 'x' });
    await expect(
      env.assertRetried('one-attempt', 99),
    ).rejects.toThrow(/expected 99 attempt/);
  });

  it('processor with attempts > 1 retries on failure until success', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    let calls = 0;
    env.process(async () => {
      calls += 1;
      if (calls < 3) throw new Error(`try ${calls}`);
      return 'success-on-3rd';
    });
    await env.addJob('retry-until-success', { data: 'x' }, { attempts: 3 });
    const snap = await env.assertProcessed('retry-until-success');
    expect(snap.state).toBe('completed');
    expect(snap.attemptsMade).toBe(3);
  });

  it('add same job name twice keeps both entries in list', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    env.process(async () => 'ok');
    await env.addJob('dup', { seq: 1 });
    await env.addJob('dup', { seq: 2 });
    const list = env.listJobs();
    const dups = list.filter((j) => j.name === 'dup');
    expect(dups.length).toBeGreaterThanOrEqual(2);
  });
});
