import { describe, expect, it } from 'vitest';
import { setupInngestEnv } from '../src/inngest/setup-inngest-env.js';

describe('inngest stub defensive branches', () => {
  it('registerFunction throws when env is stopped', async () => {
    const env = await setupInngestEnv({ appId: 'app-1', mode: 'stub' });
    await env.stop();
    expect(() =>
      env.registerFunction({
        id: 'fn-1',
        event: 'app.event',
        handler: async () => 'ok',
      }),
    ).toThrow(/cannot use env after stop/);
  });

  it('sendEvent throws when env is stopped', async () => {
    const env = await setupInngestEnv({ appId: 'app-1', mode: 'stub' });
    await env.stop();
    await expect(env.sendEvent('app.event', {})).rejects.toThrow(
      /cannot use env after stop/,
    );
  });

  it('sendEvent + waitForRun happy path', async () => {
    const env = await setupInngestEnv({ appId: 'app-1', mode: 'stub' });
    env.registerFunction({
      id: 'fn-happy',
      event: 'ev.happy',
      handler: async () => 'result',
    });
    await env.sendEvent('ev.happy', {});
    const snap = await env.waitForRun('fn-happy', { timeoutMs: 1000 });
    expect(snap.state).toBe('completed');
  });

  it('waitForRun times out when function never runs', async () => {
    const env = await setupInngestEnv({ appId: 'app-1', mode: 'stub' });
    await expect(
      env.waitForRun('nonexistent-fn', { timeoutMs: 50 }),
    ).rejects.toThrow(/timeout waiting/);
  });

  it('assertFunctionFailed reports failed run', async () => {
    const env = await setupInngestEnv({ appId: 'app-1', mode: 'stub' });
    env.registerFunction({
      id: 'fn-fail',
      event: 'ev.fail',
      handler: async () => {
        throw new Error('always fails');
      },
    });
    await env.sendEvent('ev.fail', {});
    const snap = await env.assertFunctionFailed('fn-fail');
    expect(snap.state).toBe('failed');
  });

  it('assertFunctionFailed throws when function did not fail', async () => {
    const env = await setupInngestEnv({ appId: 'app-1', mode: 'stub' });
    env.registerFunction({
      id: 'fn-ok',
      event: 'ev.ok',
      handler: async () => 'ok',
    });
    await env.sendEvent('ev.ok', {});
    await expect(env.assertFunctionFailed('fn-ok')).rejects.toThrow(
      /expected function .* to fail/,
    );
  });

  it('assertRetried validates attempts counter', async () => {
    const env = await setupInngestEnv({ appId: 'app-1', mode: 'stub' });
    env.registerFunction({
      id: 'fn-retry',
      event: 'ev.retry',
      retries: 2,
      handler: async () => {
        throw new Error('retry');
      },
    });
    await env.sendEvent('ev.retry', {});
    // 3 attempts (1 initial + 2 retries) — assertRetried expects the observed count
    await env.assertFunctionFailed('fn-retry');
    await expect(env.assertRetried('fn-retry', 999)).rejects.toThrow(
      /expected 999 attempt/,
    );
  });
});
