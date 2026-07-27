# @kiwa-lab/queue をはじめる

ここでは BullMQ の `sandbox` を使い、ジョブを投入して processor の結果を検証します。Redis や Docker は不要です。

## インストール

```bash
pnpm add -D @kiwa-lab/queue @kiwa-lab/core vitest
```

`sandbox` 以外を使うときだけ、選択した実行基盤の peer dependency を追加します。BullMQ の `testcontainers` では `bullmq`、`ioredis`、`testcontainers` が必要です。

## 最小のテスト

`process` で worker を登録してから `addJob` を呼びます。`assertProcessed` は対象のジョブが完了するまで待機し、戻り値も照合します。

```ts
import { afterEach, expect, it } from "vitest";
import { setupBullMQEnv } from "@kiwa-lab/queue";

let env: Awaited<ReturnType<typeof setupBullMQEnv>> | undefined;

afterEach(async () => {
  await env?.stop();
});

it("注文を合計する", async () => {
  env = await setupBullMQEnv();
  env.process<{ subtotal: number; tax: number }, number>(async (job) => {
    return job.data.subtotal + job.data.tax;
  });

  await env.addJob("calculate-total", { subtotal: 1000, tax: 100 });

  const job = await env.assertProcessed("calculate-total", {
    returnValue: 1100,
  });

  expect(job.state).toBe("completed");
  expect(job.attemptsMade).toBe(1);
});
```

テストが成功すると、`calculate-total` は `completed` になり、processor の戻り値が `1100` として記録されます。

## 後始末を先に書く

環境の `stop()` は、登録した processor とキューのリソースを解放します。テストの末尾にだけ置かず、`afterEach` に置いて例外時にも実行されるようにします。`testcontainers`、`dev-server`、`wrangler`、`localstack` のモードでも同じ規則です。

## 次に進む

失敗を再試行して最終失敗を検証する例は [使い方](./how-to) を確認してください。Inngest、Cloudflare Queues、SQS、RabbitMQ を選ぶ場合の API と実行モードは [リファレンス](./reference) にあります。
この例を `tests/kiwa/queue.test.ts` に保存し、`pnpm exec vitest run tests/kiwa/queue.test.ts` を実行します。成功時は、このページで示した戻り値と副作用の assertion がすべて通ります。

<!-- skill-guide -->
## skill で仕様から test を作る

この library の companion skill は、先に作成した仕様を input にします。[kiwa の skill を使う](../../../guides/skills) の手順で plugin を導入し、Quickstart の最小 test で API と期待結果を理解してから実行してください。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

次の順序では、最初の command が `tests/spec/` に仕様を作り、二つ目の command がその module の test を作ります。

```text
/kiwa:kiwa-design --layer job-queue --module send-receipt
/kiwa:kiwa-queue --module send-receipt --provider bullmq --mode sandbox --output tests/send-receipt.queue.test.ts --lang ja
```

生成した `tests/send-receipt.queue.test.ts` は、`pnpm exec vitest run tests/send-receipt.queue.test.ts` で実行します。skill は BullMQ、Inngest、Cloudflare Queues、SQS を対象にします。RabbitMQ は package の公開 API で手書き test を作れますが、現在この skill の生成対象ではありません。Quickstart にある入力、期待結果、対象外の境界と照合し、プロジェクトの runner で実行してください。layer の選択肢と出力先は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-queue/SKILL.md) を参照してください。
