# @kiwa-lab/queue の使い方

この page では、BullMQ の retry、Inngest の event-driven function、SQS の visibility timeout と DLQ を一つの test file で確認します。各 environment は test の中で作り、必ず `stop()` します。Redis、Docker、LocalStack を起動するものではなく、通常は高速な sandbox または stub を使います。

## 失敗、イベント、DLQ を確認する

`tests/queue-reliability.test.ts` を作り、次の内容をそのまま保存します。

```ts
import { describe, expect, it } from "vitest";
import {
  setupBullMQEnv,
  setupInngestEnv,
  setupSQSEnv,
} from "@kiwa-lab/queue";

describe("queue reliability", () => {
  it("retries a BullMQ job and records its terminal failure", async () => {
    const env = await setupBullMQEnv();

    try {
      env.process(async () => {
        throw new Error("mail provider unavailable");
      });
      await env.addJob("send-receipt", { orderId: "o-1" }, { attempts: 2 });

      const job = await env.assertFailed("send-receipt", {
        retry: 2,
        reasonMatch: /mail provider unavailable/,
      });

      expect(job.attemptsMade).toBe(2);
      await env.assertQueueDrained();
    } finally {
      await env.stop();
    }
  });

  it("runs an Inngest function and its named step from an event", async () => {
    const env = await setupInngestEnv();

    try {
      env.registerFunction({
        id: "signup-completed",
        event: "user/signup.completed",
        retries: 3,
        handler: async ({ event, step }) => {
          const data = event.data as { userId: string };
          await step.run("send-welcome", () => ({ deliveredTo: data.userId }));
          return { accepted: true };
        },
      });
      await env.sendEvent("user/signup.completed", { userId: "u-1" });

      await env.assertFunctionRan("signup-completed", { returnValue: { accepted: true } });
      await env.assertStepRan("signup-completed", "send-welcome");
    } finally {
      await env.stop();
    }
  });

  it("moves an unacknowledged SQS message to its DLQ after the configured receive count", async () => {
    const sqs = await setupSQSEnv({
      queues: [
        {
          name: "orders",
          visibilityTimeoutSeconds: 0.05,
          redrivePolicy: { deadLetterTargetArn: "orders-dlq", maxReceiveCount: 2 },
        },
        { name: "orders-dlq" },
      ],
    });

    try {
      await sqs.send("orders", { orderId: "o-1" });
      await sqs.receive("orders");
      await new Promise((resolve) => setTimeout(resolve, 100));
      await sqs.receive("orders");
      await new Promise((resolve) => setTimeout(resolve, 100));
      await sqs.receive("orders");

      const dead = await sqs.assertDeadLettered("orders", {
        dlq: "orders-dlq",
        receiveCount: 3,
      });
      expect(dead.state).toBe("dead");
    } finally {
      await sqs.stop();
    }
  });
});
```

次の command は、作成した file だけを実行します。

```bash
pnpm exec vitest run tests/queue-reliability.test.ts
```

`assertFailed` は同名の job が `failed` に到達するまで待機します。`retry` は観測された実行回数であり、設定した `attempts` と同じ値を期待します。途中で失敗してから成功する振る舞いを検証するときは、processor 側で呼び出し回数を管理し、`assertRetried` と `assertProcessed` を組み合わせます。

Inngest の `stub` は `step.sleep` を記録しますが実時間を進めません。SQS の `maxReceiveCount: 2` は二回目ではなく三回目の receive で DLQ へ移します。message は receive 後に in-flight になるため、この例では visibility timeout を待ってから再受信します。timeout をゼロにして連続で receive する書き方は clock の境界に依存するため使いません。

BullMQ の delay、実 Redis connection、複数 worker の競合、backoff、priority、rate limit を確認する場合は `mode: "testcontainers"` を Docker が使える integration job に分けます。Inngest の cron と分散 step memoisation は `dev-server`、SQS の IAM と actual visibility timeout は LocalStack または AWS test account で確認します。
