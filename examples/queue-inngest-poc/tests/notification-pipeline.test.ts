import { afterEach, describe, expect, it } from 'vitest';
import { setupInngestEnv, type InngestTestEnv } from '@kiwa-lab/queue';
import {
  attachSignupPipeline,
  createNotificationSink,
  createSignupCompletedFn,
  type SignupCompletedEvent,
} from '../src/notification-pipeline.js';

const envs: InngestTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('Inngest PoC — signup pipeline (stub happy path)', () => {
  it('T-INNGEST-POC-001 runs the pipeline end-to-end and records every step', async () => {
    const env = await setupInngestEnv();
    envs.push(env);
    const sink = attachSignupPipeline(env);
    await env.sendEvent<SignupCompletedEvent>('user/signup.completed', {
      userId: 'u-alice',
      plan: 'pro',
    });
    const snap = await env.assertFunctionRan<
      SignupCompletedEvent,
      { ok: true; auditId: string }
    >('signup-completed', { returnValue: { ok: true, auditId: 'audit-1' } });
    expect(snap.stepsRun).toEqual([
      'load-user',
      'send-welcome-email',
      'wait-for-reminder',
      'audit-log',
    ]);
    expect(sink.emailsSent).toEqual([
      { to: 'u-alice@example.test', plan: 'pro' },
    ]);
    expect(sink.auditLog).toEqual([{ userId: 'u-alice', plan: 'pro' }]);
  });
});

describe('Inngest PoC — signup pipeline (retry semantics)', () => {
  it('T-INNGEST-POC-002 retries the send when the sink throws twice', async () => {
    const env = await setupInngestEnv();
    envs.push(env);
    const sink = attachSignupPipeline(env, { failFirst: 2 });
    await env.sendEvent<SignupCompletedEvent>('user/signup.completed', {
      userId: 'u-bob',
      plan: 'enterprise',
    });
    const snap = await env.assertFunctionRan('signup-completed');
    expect(snap.attemptsMade).toBe(3);
    expect(sink.emailsSent.length).toBe(1);
    expect(sink.auditLog.length).toBe(1);
  });

  it('T-INNGEST-POC-003 fails when retries are exhausted', async () => {
    const env = await setupInngestEnv();
    envs.push(env);
    // failFirst higher than `retries` — every attempt throws.
    const sink = attachSignupPipeline(env, { failFirst: 10 });
    await env.sendEvent<SignupCompletedEvent>('user/signup.completed', {
      userId: 'u-carol',
      plan: 'free',
    });
    const snap = await env.assertFunctionFailed('signup-completed', {
      attempts: 3,
      reasonMatch: /transient SMTP/,
    });
    expect(sink.emailsSent).toEqual([]);
    expect(sink.auditLog).toEqual([]);
    expect(snap.state).toBe('failed');
  });
});

describe('Inngest PoC — concurrency cap', () => {
  it('T-INNGEST-POC-004 concurrency: 2 serialises the third event behind the first two', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const env = await setupInngestEnv();
    envs.push(env);
    env.registerFunction({
      id: 'slow-work',
      event: 'work/enqueued',
      concurrency: 2,
      handler: async () => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, 15);
          (timer as unknown as { unref?: () => void }).unref?.();
        });
        inFlight -= 1;
      },
    });
    await env.sendEvent('work/enqueued', { i: 1 });
    await env.sendEvent('work/enqueued', { i: 2 });
    await env.sendEvent('work/enqueued', { i: 3 });
    await env.assertQueueDrained();
    expect(maxInFlight).toBe(2);
    expect(env.listRuns().length).toBe(3);
  });
});

describe('Inngest PoC — step function assertion', () => {
  it('T-INNGEST-POC-005 assertStepRan pins the audit step to the trace', async () => {
    const env = await setupInngestEnv();
    envs.push(env);
    attachSignupPipeline(env);
    await env.sendEvent<SignupCompletedEvent>('user/signup.completed', {
      userId: 'u-dave',
      plan: 'pro',
    });
    await env.assertStepRan('signup-completed', 'audit-log');
  });
});

describe('Inngest PoC — orphan events + drained state', () => {
  it('T-INNGEST-POC-006 dispatches nothing when no function matches the event', async () => {
    const env = await setupInngestEnv();
    envs.push(env);
    env.registerFunction(createSignupCompletedFn(createNotificationSink()));
    await env.sendEvent('unrelated/event', {});
    await env.assertQueueDrained();
    expect(env.listRuns()).toEqual([]);
  });
});

describe('Inngest PoC — stop cleanup', () => {
  it('T-INNGEST-POC-007 stop() invalidates sendEvent for follow-up work', async () => {
    const env = await setupInngestEnv();
    attachSignupPipeline(env);
    await env.sendEvent<SignupCompletedEvent>('user/signup.completed', {
      userId: 'u-eve',
      plan: 'pro',
    });
    await env.assertFunctionRan('signup-completed');
    await env.stop();
    await expect(
      env.sendEvent<SignupCompletedEvent>('user/signup.completed', {
        userId: 'ghost',
        plan: 'free',
      }),
    ).rejects.toThrow(/after stop/);
  });
});

describe('Inngest PoC — waitForRun timeout guard', () => {
  it('T-INNGEST-POC-008 waitForRun rejects when no matching run appears', async () => {
    const env = await setupInngestEnv();
    envs.push(env);
    await expect(
      env.waitForRun('never-registered', { timeoutMs: 20 }),
    ).rejects.toThrow(/timeout waiting/);
  });
});
