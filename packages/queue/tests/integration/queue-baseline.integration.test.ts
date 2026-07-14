import { describe, expect, it } from 'vitest';
import { createSandboxBullMQEnv } from '../../src/index.js';

/**
 * queue integration domain test — real sandbox queue (createSandboxBullMQEnv)
 * で addJob / process / assertProcessed workflow を end-to-end で assert する。
 */
describe('queue integration — sandbox BullMQ workflow', () => {
  it('T-INT-D-001 addJob + process + assertProcessed の end-to-end', async () => {
    const env = createSandboxBullMQEnv({ mode: 'sandbox', queueName: 'test-queue' });
    env.process(async (job) => `processed:${(job.data as {value: number}).value}`);
    await env.addJob('task', { value: 42 });
    const snap = await env.assertProcessed('task', { returnValue: 'processed:42' });
    expect(snap.state).toBe('completed');
    await env.stop();
  });

  it('T-INT-D-002 addJob + waitForJob で terminal 到達', async () => {
    const env = createSandboxBullMQEnv({ mode: 'sandbox', queueName: 'wait-queue' });
    env.process(async () => 'done');
    await env.addJob('wait-task', { id: 1 });
    const snap = await env.waitForJob('wait-task', { timeoutMs: 2000 });
    expect(snap.returnValue).toBe('done');
    await env.stop();
  });

  it('T-INT-D-003 process throw で assertFailed', async () => {
    const env = createSandboxBullMQEnv({ mode: 'sandbox', queueName: 'fail-queue' });
    env.process(async () => {
      throw new Error('processor failure');
    });
    await env.addJob('fail-task', {});
    const snap = await env.assertFailed('fail-task', { reasonMatch: /processor failure/ });
    expect(snap.state).toBe('failed');
    await env.stop();
  });

  it('T-INT-D-004 複数 addJob で listJobs 収集', async () => {
    const env = createSandboxBullMQEnv({ mode: 'sandbox', queueName: 'multi-queue' });
    env.process(async () => 'ok');
    await env.addJob('t1', { i: 1 });
    await env.addJob('t2', { i: 2 });
    await env.addJob('t3', { i: 3 });
    await env.waitForJob('t3', { timeoutMs: 2000 });
    const jobs = env.listJobs();
    expect(jobs.length).toBeGreaterThanOrEqual(3);
    await env.stop();
  });

  it('T-INT-D-005 assertQueueDrained で idle 判定', async () => {
    const env = createSandboxBullMQEnv({ mode: 'sandbox', queueName: 'drain-queue' });
    env.process(async () => 'done');
    await env.addJob('drain-task', {});
    await env.waitForJob('drain-task', { timeoutMs: 2000 });
    await expect(env.assertQueueDrained()).resolves.toBeUndefined();
    await env.stop();
  });
});
