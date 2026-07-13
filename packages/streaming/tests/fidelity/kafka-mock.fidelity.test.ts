/**
 * fidelity test — `docs/concepts/test-taxonomy.md § fidelity` pattern。
 *
 * createKafkaMock (kiwa streaming mock adapter、 kafkajs shape 準拠) が、 想定
 * reference impl (in-memory topic log store) と同じ produce → getTopicMessages
 * 挙動を返すことを保証する。 mock ≠ real Kafka / Redpanda 比較の live fidelity は
 * `*.real.fidelity.test.ts` 経路 (現状 scope 外)。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createKafkaMock } from '../../src/index.js';

/** Reference impl = in-memory topic log store (単一 partition)。 */
function referenceKafka() {
  const topics = new Map<string, Array<{ key?: string; value: unknown }>>();
  return {
    async send(topic: string, msgs: Array<{ key?: string; value: unknown }>): Promise<number> {
      const log = topics.get(topic) ?? [];
      for (const m of msgs) log.push(m);
      topics.set(topic, log);
      return msgs.length;
    },
    getTopicMessages(topic: string): Array<{ value: unknown }> {
      return (topics.get(topic) ?? []).map((m) => ({ value: m.value }));
    },
  };
}

describe('createKafkaMock fidelity vs reference in-memory topic log', () => {
  it('producer.send → getTopicMessages で挿入 msg が読み取れる', async () => {
    const mock = createKafkaMock({ defaultPartitionCount: 1 });
    const real = referenceKafka();

    const producer = mock.producer();
    await producer.connect();
    await producer.send({ topic: 'test-topic', messages: [{ value: 'v1' }] });
    await real.send('test-topic', [{ value: 'v1' }]);

    const result = await assertFidelity({
      mockFn: async () => mock.getTopicMessages('test-topic').map((m) => m.value),
      realFn: async () => real.getTopicMessages('test-topic').map((m) => m.value),
      cases: [{ name: 'send 1 件 + getTopicMessages', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);
    expect(result.divergences).toEqual([]);

    await producer.disconnect();
  });

  it('複数 send が append-only 順に格納される (mock ↔ reference 一致)', async () => {
    const mock = createKafkaMock({ defaultPartitionCount: 1 });
    const real = referenceKafka();

    const producer = mock.producer();
    await producer.connect();
    const values = ['a', 'b', 'c'];
    for (const v of values) {
      await producer.send({ topic: 'multi', messages: [{ value: v }] });
      await real.send('multi', [{ value: v }]);
    }

    const result = await assertFidelity({
      mockFn: async () => mock.getTopicMessages('multi').map((m) => m.value),
      realFn: async () => real.getTopicMessages('multi').map((m) => m.value),
      cases: [{ name: '3 件 append-only 順', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);
    expect(result.failed).toBe(0);

    await producer.disconnect();
  });

  it('未 send topic の getTopicMessages = 両実装で空 list', async () => {
    const mock = createKafkaMock({ defaultPartitionCount: 1 });
    const real = referenceKafka();

    const result = await assertFidelity({
      mockFn: async () => mock.getTopicMessages('never-sent').length,
      realFn: async () => real.getTopicMessages('never-sent').length,
      cases: [{ name: '空 list', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);
    expect(result.divergences).toEqual([]);
  });
});
