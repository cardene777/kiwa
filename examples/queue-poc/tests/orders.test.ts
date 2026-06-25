import { afterEach, describe, expect, it } from 'vitest';
import {
  createFakeClock,
  expectIdempotent,
  setupQueueEnv,
  type QueueTestEnv,
} from '@kiwa-test/data';
import { startOrderProcessor, type Order, type OrderState } from '../src/processor.js';

const envs: Array<QueueTestEnv<Order>> = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

function newState(): OrderState {
  return { acceptedOrders: [], rejectedOrders: [] };
}

describe('orders processor (queue mode)', () => {
  it('T-DATA-001 正常注文を受付して acceptedOrders に積む', async () => {
    const env = await setupQueueEnv<Order>({ mode: 'mock' });
    envs.push(env);
    const state = newState();
    const unsubscribe = startOrderProcessor(env.client, state);
    env.client.send({ orderId: '1', amount: 500 });
    await new Promise((r) => setTimeout(r, 10));
    unsubscribe();
    expect(state.acceptedOrders).toEqual(['1']);
    expect(state.rejectedOrders).toEqual([]);
  });

  it('T-DATA-002 金額超過は rejectedOrders に分類', async () => {
    const env = await setupQueueEnv<Order>({ mode: 'mock' });
    envs.push(env);
    const state = newState();
    const unsubscribe = startOrderProcessor(env.client, state);
    env.client.send({ orderId: '2', amount: 5000 });
    await new Promise((r) => setTimeout(r, 10));
    unsubscribe();
    expect(state.rejectedOrders).toEqual(['2']);
    expect(state.acceptedOrders).toEqual([]);
  });

  it('T-DATA-003 dedupKey で重複排除', async () => {
    const env = await setupQueueEnv<Order>({ mode: 'mock' });
    envs.push(env);
    await expectIdempotent(
      env.client,
      { orderId: '3', amount: 100 },
      { dedupKey: 'order-3' },
      expect as unknown as Parameters<typeof expectIdempotent>[3],
    );
  });

  it('T-DATA-004 nack で 1 回目 retry、 2 回目で ack', async () => {
    const env = await setupQueueEnv<Order>({ mode: 'mock', maxReceiveCount: 5 });
    envs.push(env);
    let invocations = 0;
    const unsubscribe = env.client.consume(async (_msg, ack) => {
      invocations += 1;
      if (invocations === 1) {
        ack.nack();
      } else {
        ack.ack();
      }
    });
    env.client.send({ orderId: '4', amount: 100 });
    await new Promise((r) => setTimeout(r, 20));
    unsubscribe();
    expect(invocations).toBeGreaterThanOrEqual(2);
    expect(env.client.size()).toBe(0);
  });

  it('T-DATA-005 maxReceiveCount 到達で DLQ 行き', async () => {
    const env = await setupQueueEnv<Order>({ mode: 'mock', maxReceiveCount: 3 });
    envs.push(env);
    const unsubscribe = env.client.consume(async (_msg, ack) => {
      ack.nack();
    });
    env.client.send({ orderId: '5', amount: 100 });
    await new Promise((r) => setTimeout(r, 20));
    unsubscribe();
    expect(env.client.dlqSize()).toBe(1);
  });
});

describe('cron schedule (fake clock)', () => {
  it('T-DATA-006 100ms 間隔で 3 回発火', async () => {
    const clock = createFakeClock();
    let fires = 0;
    clock.schedule(100, () => {
      fires += 1;
    });
    await clock.advanceMs(350);
    expect(fires).toBe(3);
  });

  it('T-DATA-007 unschedule で停止する', async () => {
    const clock = createFakeClock();
    let fires = 0;
    const id = clock.schedule(50, () => {
      fires += 1;
    });
    await clock.advanceMs(120);
    expect(fires).toBe(2);
    clock.unschedule(id);
    await clock.advanceMs(500);
    expect(fires).toBe(2);
  });
});
