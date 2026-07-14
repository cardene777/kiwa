import { describe, expect, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  createToolSpy,
} from '@kiwa-lab/skill-test';
import { setupQueueEnv, createFakeClock } from '../../src/index.js';

describe('data skill — queue + clock skill flow', () => {
  it('T-SKL-D-001 queue send + receive skill flow', async () => {
    const spy = createToolSpy();
    const env = await setupQueueEnv<string>({ mode: 'mock' });
    env.client.send('m');
    spy.record('data.queue.send', '{}');
    env.client.receive();
    spy.record('data.queue.receive', '{}');

    assertToolCallOrder(spy, ['data.queue.send', 'data.queue.receive']);
    await env.stop();
  });

  it('T-SKL-D-002 clock advance skill flow', async () => {
    const spy = createToolSpy();
    const clock = createFakeClock({ startMs: 0 });
    await clock.advanceMs(500);
    spy.record('data.clock.advance', JSON.stringify({ ms: 500 }));

    assertToolCalled(spy, 'data.clock.advance');
    expect(clock.nowMs()).toBe(500);
  });

  it('T-SKL-D-003 batch send skill (times=3)', async () => {
    const spy = createToolSpy();
    const env = await setupQueueEnv<number>({ mode: 'mock' });
    env.client.send(1);
    spy.record('data.queue.send', '{}');
    env.client.send(2);
    spy.record('data.queue.send', '{}');
    env.client.send(3);
    spy.record('data.queue.send', '{}');

    assertToolCalled(spy, 'data.queue.send', { times: 3 });
    await env.stop();
  });

  it('T-SKL-D-004 clock schedule + advance skill', async () => {
    const spy = createToolSpy();
    const clock = createFakeClock({ startMs: 0 });
    let count = 0;
    clock.schedule(100, () => {
      count += 1;
    });
    spy.record('data.clock.schedule', '{}');
    await clock.advanceMs(300);
    spy.record('data.clock.advance', '{}');

    assertToolCallOrder(spy, ['data.clock.schedule', 'data.clock.advance']);
    expect(count).toBeGreaterThan(0);
  });

  it('T-SKL-D-005 queue size skill flow', async () => {
    const spy = createToolSpy();
    const env = await setupQueueEnv<string>({ mode: 'mock' });
    env.client.send('a');
    env.client.send('b');
    spy.record('data.queue.send', '{}');
    const size = env.client.size();
    spy.record('data.queue.size', JSON.stringify({ size }));

    assertToolCalled(spy, 'data.queue.size');
    expect(size).toBe(2);
    await env.stop();
  });
});
