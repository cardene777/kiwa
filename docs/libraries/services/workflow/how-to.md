# @kiwa-lab/workflow の使い方

この harness は durable engine ではなく、workflow step の順序、前の output の受け渡し、failure result、event 起動を process 内で確認します。Temporal、Inngest、Trigger.dev、Step Functions の provider 名は execution record に残りますが、worker、scheduler、durable state、実行遅延は起動しません。

次の file を `tests/order.workflow.test.ts` として保存してください。step chain、失敗、retry、event trigger の解除までを一つの test file で確認します。

```ts
import { describe, expect, it } from "vitest";
import {
  createWorkflowClient,
  defineWorkflow,
  emitEvent,
  eventDrivenTrigger,
  retryStep,
} from "@kiwa-lab/workflow";

describe("order workflow", () => {
  it("passes each step output to the next step", async () => {
    const client = createWorkflowClient({ provider: "temporal", idSeed: 0 });
    client.register(defineWorkflow("order-flow", [
      { name: "validate", run: ({ input }) => ({ orderId: input.orderId, approved: true }) },
      { name: "ship", run: ({ previous }) => ({ shipmentId: `ship-${previous.orderId}` }) },
    ]));

    const result = await client.execute("order-flow", { orderId: "o-1" });

    expect(result).toMatchObject({ id: "wf-1", status: "completed", output: { shipmentId: "ship-o-1" } });
    expect(client.listExecutions()[0]?.stepOutputs).toEqual([
      { orderId: "o-1", approved: true },
      { shipmentId: "ship-o-1" },
    ]);
  });

  it("records a failed step and does not run later steps", async () => {
    const client = createWorkflowClient();
    client.register(defineWorkflow("charge-order", [
      { name: "validate", run: () => ({ approved: true }) },
      { name: "charge", run: () => { throw new Error("card declined"); } },
      { name: "ship", run: () => ({ shipped: true }) },
    ]));

    const result = await client.execute("charge-order", { orderId: "o-1" });

    expect(result).toMatchObject({ status: "failed", error: "card declined" });
    expect(client.listExecutions()[0]?.stepOutputs).toEqual([]);
  });

  it("retries a single operation without sleeping in the test", async () => {
    let calls = 0;
    const result = await retryStep(async () => {
      calls += 1;
      if (calls < 3) throw new Error("temporary outage");
      return "charged";
    }, {
      maxAttempts: 3,
      baseDelayMs: 100,
      sleep: async () => undefined,
    });

    expect(result).toEqual({ value: "charged", attempts: 3, succeeded: true, delaysMs: [100, 200] });
  });

  it("starts from an event and stops after the trigger is disposed", async () => {
    const client = createWorkflowClient({ provider: "inngest" });
    const workflow = defineWorkflow("welcome-user", [
      { name: "send-email", run: ({ input }) => ({ recipient: input.userId }) },
    ]);
    const trigger = eventDrivenTrigger(client, "user.created", workflow);

    const first = await emitEvent(client, { name: "user.created", payload: { userId: "u-1" }, emittedAt: 0 });
    trigger.dispose();
    const second = await emitEvent(client, { name: "user.created", payload: { userId: "u-2" }, emittedAt: 1 });

    expect(first).toEqual([expect.objectContaining({ id: "ing-1", status: "completed" })]);
    expect(trigger.handledCount()).toBe(1);
    expect(second).toEqual([]);
  });
});
```

```bash
pnpm exec vitest run tests/order.workflow.test.ts
```

step が throw すると `execute` は throw せず `failed` result を返し、execution record の `stepOutputs` は空になります。workflow が未登録の場合も `failed` result になります。呼び出し元で status と error を分岐し、失敗結果を成功として後続 job に渡さないでください。

`retryStep` は workflow 全体を再実行せず、一つの関数に指数バックオフを適用します。failure result は cache されません。event trigger を使う test は `dispose()` するか client を作り直し、次の test に登録を漏らさないでください。実 scheduler、durable state、distributed retry、provider 固有 timeout は provider の local environment または integration test で確認します。
