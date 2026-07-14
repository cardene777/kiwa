import { describe, expect, it } from 'vitest';
import { setupQueueEnv, createFakeClock } from '../../src/index.js';

describe('data fidelity — queue + clock contract', () => {
  it('T-FID-D-001 queue send は 一意 id を返す', async () => {
    const env = await setupQueueEnv<string>({ mode: 'mock' });
    const id1 = env.client.send('a');
    const id2 = env.client.send('b');
    expect(id1).not.toBe(id2);
    await env.stop();
  });

  it('T-FID-D-002 clock advance は monotonic', async () => {
    const clock = createFakeClock({ startMs: 100 });
    expect(clock.nowMs()).toBe(100);
    await clock.advanceMs(50);
    expect(clock.nowMs()).toBe(150);
    await clock.advanceMs(50);
    expect(clock.nowMs()).toBe(200);
  });

  it('T-FID-D-003 queue size は send/receive で正確', async () => {
    const env = await setupQueueEnv<string>({ mode: 'mock' });
    env.client.send('a');
    env.client.send('b');
    expect(env.client.size()).toBe(2);
    env.client.receive();
    expect(env.client.size()).toBe(1);
    await env.stop();
  });

  it('T-FID-D-004 clock schedule/unschedule 対称性', async () => {
    const clock = createFakeClock({ startMs: 0 });
    const id = clock.schedule(100, () => undefined);
    expect(clock.pendingEntries().length).toBe(1);
    clock.unschedule(id);
    expect(clock.pendingEntries().length).toBe(0);
  });

  it('T-FID-D-005 receive で empty queue null 返却', async () => {
    const env = await setupQueueEnv<string>({ mode: 'mock' });
    expect(env.client.receive()).toBeNull();
    await env.stop();
  });
});
