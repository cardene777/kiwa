import { describe, expect, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  createToolSpy,
} from '@kiwa-lab/skill-test';
import { createSandboxBullMQEnv } from '../../src/index.js';

/**
 * queue skill domain test — queue lib の主要 skill flow (addJob / process /
 * assertProcessed / assertFailed) を spy 経路で assert する。
 */
describe('queue skill — real sandbox skill flow', () => {
  it('T-SKL-D-001 addJob + process skill flow が順序で発火', async () => {
    const spy = createToolSpy();
    const env = createSandboxBullMQEnv({ mode: 'sandbox', queueName: 'sk1' });
    env.process(async (job) => `ok:${(job.data as {v: number}).v}`);
    spy.record('queue.process', JSON.stringify({ queueName: 'sk1' }));
    await env.addJob('t1', { v: 1 });
    spy.record('queue.addJob', JSON.stringify({ name: 't1' }));
    const snap = await env.assertProcessed('t1');
    spy.record('queue.assertProcessed', JSON.stringify({ name: 't1' }));

    assertToolCallOrder(spy, ['queue.process', 'queue.addJob', 'queue.assertProcessed']);
    expect(snap.state).toBe('completed');
    await env.stop();
  });

  it('T-SKL-D-002 addJob + assertFailed skill (error 経路)', async () => {
    const spy = createToolSpy();
    const env = createSandboxBullMQEnv({ mode: 'sandbox', queueName: 'sk2' });
    env.process(async () => {
      throw new Error('sk2 error');
    });
    spy.record('queue.process', '{}');
    await env.addJob('fail-t', {});
    spy.record('queue.addJob', '{}');
    const snap = await env.assertFailed('fail-t');
    spy.record('queue.assertFailed', '{}');

    assertToolCalled(spy, 'queue.assertFailed');
    expect(snap.state).toBe('failed');
    await env.stop();
  });

  it('T-SKL-D-003 batch addJob skill (times=3)', async () => {
    const spy = createToolSpy();
    const env = createSandboxBullMQEnv({ mode: 'sandbox', queueName: 'sk3' });
    env.process(async () => 'ok');
    await env.addJob('t1', {});
    spy.record('queue.addJob', '{}');
    await env.addJob('t2', {});
    spy.record('queue.addJob', '{}');
    await env.addJob('t3', {});
    spy.record('queue.addJob', '{}');

    assertToolCalled(spy, 'queue.addJob', { times: 3 });
    await env.stop();
  });

  it('T-SKL-D-004 waitForJob + listJobs skill flow', async () => {
    const spy = createToolSpy();
    const env = createSandboxBullMQEnv({ mode: 'sandbox', queueName: 'sk4' });
    env.process(async () => 'ok');
    await env.addJob('sk4-t', { v: 4 });
    spy.record('queue.addJob', '{}');
    await env.waitForJob('sk4-t', { timeoutMs: 2000 });
    spy.record('queue.waitForJob', '{}');
    const jobs = env.listJobs();
    spy.record('queue.listJobs', '{}');

    assertToolCallOrder(spy, ['queue.addJob', 'queue.waitForJob', 'queue.listJobs']);
    expect(jobs.length).toBeGreaterThan(0);
    await env.stop();
  });

  it('T-SKL-D-005 drain skill flow (addJob + wait + assertQueueDrained)', async () => {
    const spy = createToolSpy();
    const env = createSandboxBullMQEnv({ mode: 'sandbox', queueName: 'sk5' });
    env.process(async () => 'ok');
    await env.addJob('drain-t', {});
    spy.record('queue.addJob', '{}');
    await env.waitForJob('drain-t', { timeoutMs: 2000 });
    spy.record('queue.waitForJob', '{}');
    await env.assertQueueDrained();
    spy.record('queue.assertQueueDrained', '{}');

    assertToolCallOrder(spy, ['queue.addJob', 'queue.waitForJob', 'queue.assertQueueDrained']);
    await env.stop();
  });
});
