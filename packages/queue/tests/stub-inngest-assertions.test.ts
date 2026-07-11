import { afterEach, describe, expect, it } from 'vitest';
import { setupInngestEnv, type InngestTestEnv } from '../src/index.js';

const envs: InngestTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

/**
 * Coverage batch 1 — stub-inngest assertion helpers. Existing suite covers
 * the happy paths and reasonMatch mismatch; these close the remaining
 * "wrong terminal state" branches and mismatched attempt-count guards.
 */

describe('setupInngestEnv (stub — waitForRun timeout)', () => {
  it('T-INNGEST-022 waitForRun rejects when no matching run appears', async () => {
    const env = await setupInngestEnv();
    envs.push(env);
    // No function registered — the run never appears, waitForRun should
    // reject on timeout.
    await expect(
      env.waitForRun('missing-fn', { timeoutMs: 30 }),
    ).rejects.toThrow(/timeout waiting for function "missing-fn"/);
  });
});

describe('setupInngestEnv (stub — assertion mismatch guards)', () => {
  it('T-INNGEST-018 assertFunctionRan rejects when the run actually failed', async () => {
    const env = await setupInngestEnv({
      functions: [
        {
          id: 'always-fails',
          event: 'fail/event',
          retries: 1,
          handler: async () => {
            throw new Error('permanent');
          },
        },
      ],
    });
    envs.push(env);
    await env.sendEvent('fail/event', {});
    await expect(env.assertFunctionRan('always-fails')).rejects.toThrow(
      /expected function "always-fails" to complete/,
    );
  });

  it('T-INNGEST-019 assertFunctionFailed rejects when the run actually completed', async () => {
    const env = await setupInngestEnv({
      functions: [
        {
          id: 'always-ok',
          event: 'ok/event',
          handler: async () => 'ok',
        },
      ],
    });
    envs.push(env);
    await env.sendEvent('ok/event', {});
    await expect(env.assertFunctionFailed('always-ok')).rejects.toThrow(
      /expected function "always-ok" to fail, got state=completed/,
    );
  });

  it('T-INNGEST-020 assertFunctionFailed rejects when attempts count mismatches', async () => {
    const env = await setupInngestEnv({
      functions: [
        {
          id: 'two-attempts',
          event: 'attempts/event',
          retries: 2,
          handler: async () => {
            throw new Error('boom');
          },
        },
      ],
    });
    envs.push(env);
    await env.sendEvent('attempts/event', {});
    await expect(
      env.assertFunctionFailed('two-attempts', { attempts: 99 }),
    ).rejects.toThrow(/expected 99 attempt/);
  });

  it('T-INNGEST-021 assertRetried rejects when the observed count differs', async () => {
    let calls = 0;
    const env = await setupInngestEnv({
      functions: [
        {
          id: 'two-calls',
          event: 'retry/event',
          retries: 3,
          handler: async () => {
            calls += 1;
            if (calls < 2) throw new Error('first');
            return 'ok';
          },
        },
      ],
    });
    envs.push(env);
    await env.sendEvent('retry/event', {});
    await expect(env.assertRetried('two-calls', 5)).rejects.toThrow(
      /expected 5 attempt\(s\) for "two-calls", observed 2/,
    );
  });
});
