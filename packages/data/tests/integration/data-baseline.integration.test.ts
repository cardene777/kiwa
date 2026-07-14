import { describe, expect, it } from 'vitest';
import { setupQueueEnv, createFakeClock } from '../../src/index.js';

describe('data integration — setupQueueEnv + createFakeClock workflow', () => {
  it('T-INT-D-001 setupQueueEnv + send + receive workflow', async () => {
    const env = await setupQueueEnv<string>({ mode: 'mock' });
    env.client.send('msg1');
    const received = env.client.receive();
    expect(received?.body).toBe('msg1');
    await env.stop();
  });

  it('T-INT-D-002 dedupKey で重複送信除去', async () => {
    const env = await setupQueueEnv<string>({ mode: 'mock' });
    const id1 = env.client.send('m', { dedupKey: 'dk1' });
    const id2 = env.client.send('m', { dedupKey: 'dk1' });
    expect(id1).toBe(id2);
    await env.stop();
  });

  it('T-INT-D-003 createFakeClock で advance + schedule', async () => {
    const clock = createFakeClock({ startMs: 1000 });
    let calls = 0;
    clock.schedule(500, () => {
      calls += 1;
    });
    await clock.advanceMs(1500);
    expect(calls).toBeGreaterThan(0);
  });

  it('T-INT-D-004 seed で 初期 message 挿入', async () => {
    const env = await setupQueueEnv<number>({ mode: 'mock', seed: [1, 2, 3] });
    expect(env.client.size()).toBe(3);
    await env.stop();
  });

  it('T-INT-D-005 empty queue receive で null', async () => {
    const env = await setupQueueEnv<string>({ mode: 'mock' });
    const empty = env.client.receive();
    expect(empty).toBeNull();
    await env.stop();
  });
});
