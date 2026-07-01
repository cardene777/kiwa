import { afterEach, describe, expect, it } from 'vitest';
import { setupInngestEnv, type InngestTestEnv } from '../src/index.js';

const envs: InngestTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('setupInngestEnv (defaults)', () => {
  it('defaults to stub backend when no mode is passed', async () => {
    const env = await setupInngestEnv();
    envs.push(env);
    expect(env.backend).toBe('stub');
    expect(env.mode).toBe('mock');
    expect(env.appId).toBe('kiwa-test-app');
    expect(env.devServerUrl).toBeUndefined();
  });

  it('accepts a custom appId', async () => {
    const env = await setupInngestEnv({ appId: 'billing-app' });
    envs.push(env);
    expect(env.appId).toBe('billing-app');
  });

  it('rejects an unknown mode', async () => {
    await expect(
      setupInngestEnv({ mode: 'invalid' as unknown as 'stub' }),
    ).rejects.toThrow(/unknown mode/);
  });

  it('rejects a dev-server URL that is unreachable', async () => {
    // 127.0.0.1:1 is refused by the kernel — a fast, deterministic failure
    // that avoids any real network dependency.
    await expect(
      setupInngestEnv({
        mode: 'dev-server',
        devServer: { url: 'http://127.0.0.1:1', startupTimeoutMs: 300 },
      }),
    ).rejects.toThrow(/did not respond/);
  });
});

describe('setupInngestEnv (stub — happy path)', () => {
  it('T-INNGEST-001 runs a matching function and returns the handler result', async () => {
    const env = await setupInngestEnv();
    envs.push(env);
    env.registerFunction<{ x: number }, number>({
      id: 'double-x',
      event: 'math/double',
      handler: async ({ event }) => event.data.x * 2,
    });
    await env.sendEvent('math/double', { x: 21 });
    const snap = await env.assertFunctionRan<{ x: number }, number>('double-x', {
      returnValue: 42,
    });
    expect(snap.state).toBe('completed');
    expect(snap.attemptsMade).toBe(1);
  });

  it('T-INNGEST-002 waitForRun awaits the terminal snapshot', async () => {
    const env = await setupInngestEnv();
    envs.push(env);
    env.registerFunction({
      id: 'greet',
      event: 'user/created',
      handler: async () => 'hello',
    });
    await env.sendEvent('user/created', { userId: 'u1' });
    const snap = await env.waitForRun<{ userId: string }, string>('greet');
    expect(snap.returnValue).toBe('hello');
    expect(snap.state).toBe('completed');
  });

  it('T-INNGEST-003 ignores events with no matching function', async () => {
    const env = await setupInngestEnv();
    envs.push(env);
    await env.sendEvent('orphan/event', { foo: 1 });
    await env.assertQueueDrained();
    expect(env.listRuns()).toEqual([]);
  });

  it('T-INNGEST-004 assertFunctionRan rejects when the return value mismatches', async () => {
    const env = await setupInngestEnv({
      functions: [
        {
          id: 'noop',
          event: 'noop/event',
          handler: async () => 1,
        },
      ],
    });
    envs.push(env);
    await env.sendEvent('noop/event', {});
    await expect(env.assertFunctionRan('noop', { returnValue: 2 })).rejects.toThrow(
      /return value mismatch/,
    );
  });
});

describe('setupInngestEnv (stub — retry semantics)', () => {
  it('T-INNGEST-005 retries a throwing handler up to `retries` attempts', async () => {
    let calls = 0;
    const env = await setupInngestEnv({
      functions: [
        {
          id: 'flaky',
          event: 'flaky/event',
          retries: 3,
          handler: async () => {
            calls += 1;
            if (calls < 3) throw new Error('transient');
            return 'ok';
          },
        },
      ],
    });
    envs.push(env);
    await env.sendEvent('flaky/event', {});
    const snap = await env.assertFunctionRan('flaky');
    expect(calls).toBe(3);
    expect(snap.attemptsMade).toBe(3);
  });

  it('T-INNGEST-006 marks the run failed after exhausting retries', async () => {
    const env = await setupInngestEnv({
      functions: [
        {
          id: 'doomed',
          event: 'doomed/event',
          retries: 2,
          handler: async () => {
            throw new Error('permanent');
          },
        },
      ],
    });
    envs.push(env);
    await env.sendEvent('doomed/event', {});
    const snap = await env.assertFunctionFailed('doomed', {
      attempts: 2,
      reasonMatch: /permanent/,
    });
    expect(snap.state).toBe('failed');
  });

  it('T-INNGEST-007 assertRetried checks the observed attempt count', async () => {
    let seen = 0;
    const env = await setupInngestEnv({
      functions: [
        {
          id: 'once-fails',
          event: 'once/event',
          retries: 3,
          handler: async () => {
            seen += 1;
            if (seen === 1) throw new Error('first');
            return 'ok';
          },
        },
      ],
    });
    envs.push(env);
    await env.sendEvent('once/event', {});
    await env.assertRetried('once-fails', 2);
  });

  it('T-INNGEST-008 assertFunctionFailed rejects when reasonMatch does not match', async () => {
    const env = await setupInngestEnv({
      functions: [
        {
          id: 'reason-mismatch',
          event: 'reason/event',
          retries: 1,
          handler: async () => {
            throw new Error('database offline');
          },
        },
      ],
    });
    envs.push(env);
    await env.sendEvent('reason/event', {});
    await expect(
      env.assertFunctionFailed('reason-mismatch', { reasonMatch: /nowhere/ }),
    ).rejects.toThrow(/did not match/);
  });
});

describe('setupInngestEnv (stub — step function)', () => {
  it('T-INNGEST-009 records every step.run id executed by the handler', async () => {
    const env = await setupInngestEnv({
      functions: [
        {
          id: 'multi-step',
          event: 'signup/completed',
          handler: async ({ step, event }) => {
            const user = await step.run('load-user', () => ({ id: 'u42' }));
            await step.run('send-welcome-email', () => 'sent');
            await step.sleep('wait-for-reminder', 60_000);
            await step.run('audit-log', () => ({
              user: user.id,
              event: (event.data as { plan: string }).plan,
            }));
            return { ok: true };
          },
        },
      ],
    });
    envs.push(env);
    await env.sendEvent('signup/completed', { plan: 'pro' });
    const snap = await env.assertStepRan('multi-step', 'send-welcome-email');
    expect(snap.stepsRun).toEqual([
      'load-user',
      'send-welcome-email',
      'wait-for-reminder',
      'audit-log',
    ]);
  });

  it('T-INNGEST-010 assertStepRan rejects when a step never executed', async () => {
    const env = await setupInngestEnv({
      functions: [
        {
          id: 'partial',
          event: 'partial/event',
          handler: async ({ step }) => {
            await step.run('only-one', () => 'done');
          },
        },
      ],
    });
    envs.push(env);
    await env.sendEvent('partial/event', {});
    await expect(env.assertStepRan('partial', 'missing-step')).rejects.toThrow(
      /expected step "missing-step"/,
    );
  });

  it('T-INNGEST-011 step traces reset each attempt so retries observe fresh runs', async () => {
    let seen = 0;
    const env = await setupInngestEnv({
      functions: [
        {
          id: 'retry-with-steps',
          event: 'retry-steps/event',
          retries: 2,
          handler: async ({ step }) => {
            seen += 1;
            const value = await step.run('compute', () => seen);
            if (seen === 1) throw new Error('flaky');
            return value;
          },
        },
      ],
    });
    envs.push(env);
    await env.sendEvent('retry-steps/event', {});
    const snap = await env.assertFunctionRan('retry-with-steps');
    // The second attempt's trace is what we observe — only one `compute`
    // should appear since retries clear the trace at the start of each run.
    expect(snap.stepsRun).toEqual(['compute']);
    expect(snap.attemptsMade).toBe(2);
  });
});

describe('setupInngestEnv (stub — concurrency)', () => {
  it('T-INNGEST-012 enforces concurrency: 1 by queueing subsequent runs', async () => {
    const observed: number[] = [];
    let inFlight = 0;
    let maxInFlight = 0;
    const env = await setupInngestEnv({
      functions: [
        {
          id: 'serial-only',
          event: 'work/queued',
          concurrency: 1,
          handler: async ({ event }) => {
            inFlight += 1;
            maxInFlight = Math.max(maxInFlight, inFlight);
            await new Promise((resolve) => {
              const timer = setTimeout(resolve, 5);
              (timer as unknown as { unref?: () => void }).unref?.();
            });
            observed.push((event.data as { i: number }).i);
            inFlight -= 1;
            return (event.data as { i: number }).i;
          },
        },
      ],
    });
    envs.push(env);
    await env.sendEvent('work/queued', { i: 1 });
    await env.sendEvent('work/queued', { i: 2 });
    await env.sendEvent('work/queued', { i: 3 });
    await env.assertQueueDrained();
    // Every run finished, and no two ran concurrently.
    expect(observed.sort((a, b) => a - b)).toEqual([1, 2, 3]);
    expect(maxInFlight).toBe(1);
  });

  it('T-INNGEST-013 concurrency: 2 lets two runs overlap but caps the third', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const env = await setupInngestEnv({
      functions: [
        {
          id: 'two-at-a-time',
          event: 'pair/event',
          concurrency: 2,
          handler: async () => {
            inFlight += 1;
            maxInFlight = Math.max(maxInFlight, inFlight);
            await new Promise((resolve) => {
              const timer = setTimeout(resolve, 10);
              (timer as unknown as { unref?: () => void }).unref?.();
            });
            inFlight -= 1;
          },
        },
      ],
    });
    envs.push(env);
    await env.sendEvent('pair/event', { i: 1 });
    await env.sendEvent('pair/event', { i: 2 });
    await env.sendEvent('pair/event', { i: 3 });
    await env.assertQueueDrained();
    expect(maxInFlight).toBe(2);
  });
});

describe('setupInngestEnv (stub — drained + introspection)', () => {
  it('T-INNGEST-014 assertQueueDrained succeeds once every run is terminal', async () => {
    const env = await setupInngestEnv({
      functions: [
        {
          id: 'a',
          event: 'batch/event',
          handler: async () => 'done',
        },
      ],
    });
    envs.push(env);
    await env.sendEvent('batch/event', { i: 1 });
    await env.sendEvent('batch/event', { i: 2 });
    await env.sendEvent('batch/event', { i: 3 });
    await env.assertQueueDrained();
    const runs = env.listRuns();
    expect(runs.length).toBe(3);
    expect(runs.every((run) => run.state === 'completed')).toBe(true);
  });

  it('T-INNGEST-015 assertQueueDrained rejects when a run stays queued', async () => {
    const env = await setupInngestEnv({
      functions: [
        {
          id: 'blocker',
          event: 'block/event',
          concurrency: 1,
          handler: async () =>
            new Promise((resolve) => {
              // Never resolves within the drain window — assertQueueDrained
              // should give up after ~250ms.
              const timer = setTimeout(resolve, 60_000);
              (timer as unknown as { unref?: () => void }).unref?.();
            }),
        },
      ],
    });
    envs.push(env);
    await env.sendEvent('block/event', {});
    await expect(env.assertQueueDrained()).rejects.toThrow(/queued \/ running runs/);
  });
});

describe('setupInngestEnv (stub — stop semantics)', () => {
  it('T-INNGEST-016 stop() invalidates sendEvent for follow-up work', async () => {
    const env = await setupInngestEnv({
      functions: [
        {
          id: 'noop',
          event: 'stop/event',
          handler: async () => 'ok',
        },
      ],
    });
    envs.push(env);
    await env.sendEvent('stop/event', {});
    await env.assertFunctionRan('noop');
    await env.stop();
    await expect(env.sendEvent('stop/event', {})).rejects.toThrow(/after stop/);
    // Remove from afterEach cleanup since we already stopped.
    envs.pop();
  });

  it('T-INNGEST-017 registerFunction after env creation matches later events', async () => {
    const env = await setupInngestEnv();
    envs.push(env);
    env.registerFunction({
      id: 'late-registration',
      event: 'late/event',
      handler: async () => 'registered',
    });
    await env.sendEvent('late/event', {});
    await env.assertFunctionRan('late-registration', { returnValue: 'registered' });
  });
});
