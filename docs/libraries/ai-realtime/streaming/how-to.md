# Kafka の処理を検証する

Kafka の offset は consumer group、topic、partition ごとに保持されます。この手順では、注文を手動 commit し、最終失敗を DLQ へ隔離し、互換性を壊す Redpanda schema を拒否し、NATS subject の受信範囲を確認します。すべてを一つの test file に置くことで、イベント処理のどの境界が壊れたのかを分けて確認できます。

## 注文イベントの境界を固定する

次の内容を `tests/orders.streaming.how-to.test.ts` にそのまま保存してください。`autoCommit: false` の consumer は handler が成功しても offset を進めません。`commitOffsets` には処理済み message の次の offset を渡します。DLQ の `maxAttempts` は初回を含む総試行回数です。

```ts
import { expect, it } from "vitest";
import {
  createDeadLetterQueue,
  createKafkaMock,
  createNatsMock,
  createRedpandaMock,
} from "@kiwa-lab/streaming";

it("手動 commit するまで order の offset を進めない", async () => {
  const kafka = createKafkaMock();
  const producer = kafka.producer();
  await producer.connect();
  const [sent] = await producer.send({
    topic: "orders",
    messages: [{ value: { id: "o-1" } }],
  });
  const partition = sent!.partition;

  const consumer = kafka.consumer({ groupId: "fulfillment" });
  await consumer.connect();
  await consumer.subscribe({ topics: ["orders"], fromBeginning: true });
  const fulfilled: unknown[] = [];
  await consumer.run({
    autoCommit: false,
    eachMessage: async message => {
      fulfilled.push(message.value);
    },
  });

  expect(fulfilled).toEqual([{ id: "o-1" }]);
  expect(kafka.getCommittedOffset("fulfillment", "orders", partition)).toBe(0);
  await consumer.commitOffsets([{ topic: "orders", partition, offset: 1 }]);
  expect(kafka.getCommittedOffset("fulfillment", "orders", partition)).toBe(1);
});

it("最終失敗を DLQ へ隔離する", async () => {
  const dlq = createDeadLetterQueue({
    topic: "orders",
    retryPolicy: { maxAttempts: 3, backoff: "constant", baseDelayMs: 0 },
    handler: async () => {
      throw new Error("inventory unavailable");
    },
  });

  expect(await dlq.handle({
    topic: "orders",
    partition: 0,
    offset: 5,
    timestamp: 0,
    key: null,
    value: { id: "o-1" },
    headers: {},
  })).toBe("quarantined");
  expect(dlq.quarantined()[0]).toMatchObject({
    attempts: 3,
    reason: "inventory unavailable",
  });
});

it("互換性を壊す schema と一致しない NATS subject を拒否する", async () => {
  const redpanda = createRedpandaMock();
  await redpanda.schemaRegistry.register({
    subject: "orders-value",
    kind: "avro",
    schema: '{"type":"record","name":"Order","fields":[{"name":"id","default":""}]}',
  });
  const compatibility = redpanda.schemaRegistry.checkCompatibility({
    subject: "orders-value",
    kind: "avro",
    schema: '{"type":"record","name":"Order","fields":[{"name":"id","default":""},{"name":"total"}]}',
  });
  expect(compatibility).toMatchObject({ compatible: false });
  expect(compatibility.reasons).toContain(
    'required field "total" added (breaks BACKWARD compatibility)',
  );

  const nats = createNatsMock();
  const seen: string[] = [];
  nats.subscribe("orders.*.created", message => {
    seen.push(message.topic);
  });
  await nats.publish("orders.user-1.created", { id: "o-1" });
  await nats.publish("orders.user-1.deep.created", { id: "o-2" });
  expect(seen).toEqual(["orders.user-1.created"]);
});
```

保存後は、この file だけを実行します。

```bash
pnpm exec vitest run tests/orders.streaming.how-to.test.ts
```

成功時には、手動 commit 前の offset は初期位置 `0` のまま残り、handler が三回失敗した message は `orders.dlq` に隔離されます。schema の必須 field 追加は BACKWARD 互換ではなく、`orders.*.created` は一階層の token だけに一致します。

## 実 broker で確認すること

この library の `run` は背景で継続購読する client ではなく、現在の message を同期的に走査します。handler が throw すると offset は進みませんが、retry、再接続、consumer rebalance、consumer coordinator、SSL、SASL、保持ポリシー、実 schema registry の互換性、NATS server の配信保証は実行しません。container または実 broker を使う integration test へ分けてください。`quarantined()` が返す entry は深く複製されないため、取得後の object を編集しないでください。公開 API は [リファレンス](./reference) を参照してください。
