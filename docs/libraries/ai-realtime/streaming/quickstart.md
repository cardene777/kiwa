# Streaming の導入

この手順では、同じ Kafka モックから producer と consumer を作り、送信値、commit 済み offset、partition を確認します。テストごとに新しいモックを作るため、状態が他のテストへ残りません。

## 前提

Node.js 20 以降と、非同期テストを実行できる環境が必要です。

```sh
pnpm add -D @kiwa-lab/streaming vitest
```

## producer と consumer を接続する

`defaultPartitionCount` は、admin で明示作成していない topic の partition 数です。producer は `connect` 前に `send` すると失敗するため、接続を完了してから送信します。

```ts
import { expect, test } from 'vitest';
import { createKafkaMock } from '@kiwa-lab/streaming';

test('producer の送信を consumer が読み auto commit する', async () => {
const kafka = createKafkaMock({ defaultPartitionCount: 3 });

const producer = kafka.producer();
await producer.connect();
const [published] = await producer.send({
  topic: 'orders',
  messages: [{ key: 'user-1', value: { id: 'o-1', total: 42 } }],
});

const consumer = kafka.consumer({ groupId: 'billing' });
await consumer.connect();
await consumer.subscribe({ topics: ['orders'], fromBeginning: true });

const seen: unknown[] = [];
await consumer.run({
  eachMessage: async (message) => {
    seen.push(message.value);
  },
});

expect(seen).toEqual([{ id: 'o-1', total: 42 }]);
expect(kafka.getCommittedOffset('billing', 'orders', published!.partition)).toBe(1);
});
```

`fromBeginning: true` は、この group が担当する partition の読み取り位置を 0 に戻します。同じ group がすでに commit している offset がある場合も、その担当 partition は先頭から読み直します。

## 結果を確認する

`run` の既定は auto commit です。handler が成功すると、commit 済み offset は「次に読む offset」になります。最初のメッセージを処理した場合は 1 です。

この例を `tests/orders.streaming.test.ts` に保存して `pnpm exec vitest run tests/orders.streaming.test.ts` を実行します。`published.partition` を offset の確認に使うため、hash の結果が 0 以外でも同じ test が通ります。

キーのハッシュ先が partition 0 とは限りません。offset を確認する場合は送信結果の `partition` を使います。

## 後始末

個別の client には `disconnect` があります。モック全体を使い回す場合は `kafka.reset()` が topic と consumer group の offset を消去します。テスト独立性を優先するなら、`beforeEach` で `createKafkaMock` を呼ぶ方法が簡単です。

次は [Kafka の処理を検証する](./how-to) で、手動 commit、DLQ、スキーマ登録を追加します。
<!-- skill-guide -->
## skill との使い分け

この library には package 固有の companion skill はありません。まずこの Quickstart の code を test に書き、入力から結果までの境界を直接確認してください。仕様から test を組み立てる場合は、初回だけ plugin を導入します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

Kafka の topic、group、message の期待結果を整理してから test の下書きを作る場合は、次を実行します。

```text
/kiwa:kiwa-design --layer unit --module orders-stream
/kiwa:kiwa-vitest --module orders-stream
```

生成物が実 broker や schema registry を確認するわけではありません。offset、partition、commit の期待値をこの Quickstart と照合し、対象 file を実行してください。

```bash
pnpm exec vitest run tests/orders.streaming.test.ts
```
