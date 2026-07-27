# @kiwa-lab/workflow をはじめる

ここでは、注文を検証して出荷する二つの step を登録し、成功と未登録 workflow の失敗を同じ test file で確認します。作る client は durable workflow engine ではありません。アプリケーションが SDK に渡す step の順序とデータ受け渡しを、process 内で確定する fixture です。

## インストール

```bash
pnpm add -D @kiwa-lab/workflow vitest
```

## 最初の workflow を実行する

`tests/kiwa/workflow.test.ts` を作り、次の内容をそのまま保存します。`defineWorkflow` は空でない step 列を受け取り、step の `run` は input と直前の step の output を含む context を受け取ります。

```ts
import { describe, expect, it } from "vitest";
import { createWorkflowClient, defineWorkflow } from "@kiwa-lab/workflow";

describe("order workflow", () => {
  it("validates an order and passes its output to shipping", async () => {
    const client = createWorkflowClient({ provider: "temporal", idSeed: 0 });
    client.register(defineWorkflow("order-flow", [
      {
        name: "validate",
        run: ({ input }) => ({ orderId: input.orderId, approved: true }),
      },
      {
        name: "ship",
        run: ({ previous }) => ({ shipmentId: `ship-${previous.orderId}` }),
      },
    ]));

    const result = await client.execute("order-flow", { orderId: "o-1" });

    expect(result).toMatchObject({
      id: "wf-1",
      provider: "temporal",
      workflow: "order-flow",
      status: "completed",
      output: { shipmentId: "ship-o-1" },
    });
    expect(client.listExecutions()[0]?.stepOutputs).toEqual([
      { orderId: "o-1", approved: true },
      { shipmentId: "ship-o-1" },
    ]);
  });

  it("returns a failed result for an unregistered workflow", async () => {
    const client = createWorkflowClient({ idSeed: 10 });

    const result = await client.execute("missing-flow", {});

    expect(result).toMatchObject({
      id: "wf-11",
      status: "failed",
      error: "workflow not registered: missing-flow",
    });
  });
});
```

次の command は作成した file だけを実行します。

```bash
pnpm exec vitest run tests/kiwa/workflow.test.ts
```

成功すると、`order-flow` は `completed` と最後の step の output を返します。未登録 workflow は throw せず、`failed` と `workflow not registered` の error を返します。想定と異なる場合は、`register()` が `execute()` より前に呼ばれているか、後続 step が `input` ではなく `previous` を読んでいるかを確認してください。

失敗した実行の record は error と input を保持しますが、現在の client は途中まで成功した step output を保持しません。途中経過が監査要件なら、この harness の record を根拠にせず、アプリケーション側で step ごとの監査ログや永続状態を確認します。

## skill で test を作る

この library には `/kiwa:kiwa-workflow` という companion skill があります。初回だけ kiwa plugin を導入してから使います。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

skill は library の挙動を実行時に置き換えるものではありません。ここで確認したい workflow 境界を test の形にする入口です。plugin の導入方法と更新方法は [kiwa の skill を使う](../../../guides/skills) にもまとめています。

次の例では、対象を表す名前を `--module` に渡し、生成先を `--output` で固定します。

```text
/kiwa:kiwa-workflow --module payment-settlement --provider temporal --output tests/integration/payment-settlement.workflow.test.ts
```

生成後は `tests/integration/payment-settlement.workflow.test.ts` を読み、Quickstart と同じ成功条件・失敗条件が期待値になっていることを確認してから、次の command でその file だけを実行します。

```bash
pnpm exec vitest run tests/integration/payment-settlement.workflow.test.ts
```

provider、対象の種類、出力先を変える引数は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-workflow/SKILL.md) を参照してください。event 起動と retry は [使い方](./how-to) で確認します。
