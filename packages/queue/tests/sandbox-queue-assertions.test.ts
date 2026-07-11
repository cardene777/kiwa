import { afterEach, describe, expect, it } from 'vitest';
import { setupBullMQEnv, type BullMQTestEnv } from '../src/index.js';

const envs: BullMQTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

/**
 * Coverage batch 1 — sandbox-queue assertion helpers. Existing suite covers
 * the happy paths; these tests close the mismatch branches inside
 * assertProcessed / assertFailed / assertRetried where the terminal state
 * does not match the caller expectation.
 */

describe('setupBullMQEnv (sandbox — assertion mismatch guards)', () => {
  it('T-QUEUE-021 assertProcessed rejects when the job actually failed', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    env.process(async () => {
      throw new Error('boom');
    });
    await env.addJob('failed-job', {}, { attempts: 1 });
    await expect(env.assertProcessed('failed-job')).rejects.toThrow(
      /expected job "failed-job" to complete/,
    );
  });

  it('T-QUEUE-022 assertFailed rejects when the job actually completed', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    env.process(async () => 'ok');
    await env.addJob('happy-job', {}, { attempts: 1 });
    await expect(env.assertFailed('happy-job')).rejects.toThrow(
      /expected job "happy-job" to fail, got state=completed/,
    );
  });

  it('T-QUEUE-023 assertRetried rejects when the observed count differs', async () => {
    const env = await setupBullMQEnv();
    envs.push(env);
    let calls = 0;
    env.process(async () => {
      calls += 1;
      if (calls < 2) throw new Error('once');
      return 'ok';
    });
    await env.addJob('two-attempts', {}, { attempts: 3 });
    await expect(env.assertRetried('two-attempts', 5)).rejects.toThrow(
      /expected 5 attempt/,
    );
  });
});
