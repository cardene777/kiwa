/**
 * fidelity test — `docs/concepts/test-taxonomy.md § fidelity` pattern。
 *
 * createStubSQSEnv (AWS SQS stub adapter) が、 想定 reference impl (FIFO array ベース
 * queue store) と同じ send / receive / delete semantics を返すことを保証する。
 * mock ≠ localstack SQS real driver 比較の live fidelity は別 file 化して
 * `*.real.fidelity.test.ts` で書く経路 (現状 scope 外)。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createStubSQSEnv } from '../../src/index.js';

/** Reference impl = FIFO array ベース queue store。 mock 挙動の期待仕様を体現。 */
function referenceQueue() {
  const messages: { id: string; body: string; state: 'pending' | 'deleted' }[] = [];
  let counter = 0;
  return {
    async send(body: string): Promise<string> {
      counter += 1;
      const id = `ref-msg-${counter}`;
      messages.push({ id, body, state: 'pending' });
      return id;
    },
    async receive(): Promise<{ id: string; body: string } | null> {
      const msg = messages.find((m) => m.state === 'pending');
      if (!msg) return null;
      return { id: msg.id, body: msg.body };
    },
    async delete(id: string): Promise<boolean> {
      const msg = messages.find((m) => m.id === id);
      if (!msg) return false;
      msg.state = 'deleted';
      return true;
    },
    async listPending(): Promise<string[]> {
      return messages.filter((m) => m.state === 'pending').map((m) => m.body);
    },
  };
}

describe('createStubSQSEnv fidelity vs reference FIFO queue', () => {
  it('send → receive 順序 = mock ↔ reference 一致 (body 単体 shape)', async () => {
    const mock = createStubSQSEnv({ queues: [{ name: 'test-queue' }] });
    const real = referenceQueue();

    await mock.send('test-queue', 'msg-1');
    await real.send('msg-1');

    const result = await assertFidelity({
      mockFn: async () => {
        const received = await mock.receive<string>('test-queue');
        return received.length > 0 ? received[0]?.body ?? null : null;
      },
      realFn: async () => {
        const received = await real.receive();
        return received?.body ?? null;
      },
      cases: [{ name: 'send + receive', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);
    expect(result.divergences).toEqual([]);

    await mock.stop();
  });

  it('存在 queue に send 前の receive = 両実装で empty 相当を返す', async () => {
    const mock = createStubSQSEnv({ queues: [{ name: 'empty-q' }] });
    const real = referenceQueue();

    const result = await assertFidelity({
      mockFn: async () => (await mock.receive<string>('empty-q')).length,
      realFn: async () => ((await real.receive()) === null ? 0 : 1),
      cases: [{ name: 'empty receive', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);

    await mock.stop();
  });

  it('複数 send + listMessages = 挿入順の body list (mock ↔ reference 一致)', async () => {
    const mock = createStubSQSEnv({ queues: [{ name: 'multi-q' }] });
    const real = referenceQueue();

    const bodies = ['a', 'b', 'c'];
    for (const body of bodies) {
      await mock.send('multi-q', body);
      await real.send(body);
    }

    const result = await assertFidelity({
      mockFn: async () => mock.listMessages('multi-q').map((m) => m.body as string),
      realFn: async () => real.listPending(),
      cases: [{ name: 'listMessages 順序', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);
    expect(result.failed).toBe(0);

    await mock.stop();
  });
});
