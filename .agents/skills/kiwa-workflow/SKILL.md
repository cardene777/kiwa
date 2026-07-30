---
name: kiwa-workflow
description: |
  @kiwa-lab/workflow を使って multi-step workflow の application-level test を作る skill。
  step output、failure、retry、event trigger を process 内で確認する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-workflow workflow test を作る

`@kiwa-lab/workflow` は Temporal、Inngest、Trigger.dev、Step Functions の worker や durable state を起動しない。application の step order、input と previous output、failure result、event trigger を test する harness である。

## 入力と出力

`--module` は対象名、`--provider` は `temporal`、`inngest`、`trigger`、`aws-sfn` のいずれか、`--output` は test file の path を指定する。出力先を省略したときは `tests/{module}.workflow.test.ts` を使う。実 application の workflow 名、step、input、failure policy、event 名を source と requirement から使う。

## 生成する test

workflow は `defineWorkflow` で作り、`client.register` の後に `client.execute` する。正常 case では final output と execution record の step outputs を確認する。step が throw した case では `failed` status、error、空の step outputs を確認する。未登録 workflow も throw ではなく failed result を返す。

一時的な外部 failure は `retryStep` で一つの operation に適用する。test では `sleep` を差し替え、attempt と delay を確認する。event workflow は `eventDrivenTrigger` と `emitEvent` を使い、event payload の propagation と `dispose()` 後に起動しないことを確認する。

## 実行と確認

生成後は output file を読み、step 名、input、failure の扱い、event 名、idempotency policy が application の業務フローと一致することを確認する。次に output だけを実行する。

```bash
pnpm exec vitest run {output}
```

actual worker、scheduler、durable state、distributed retry、provider 固有 timeout と compensation は provider の local environment または integration test で確認する。

## 実行例

```text
/kiwa:kiwa-workflow --module payment-settlement --provider temporal --output tests/payment-settlement.workflow.test.ts
/kiwa:kiwa-workflow --module signup-pipeline --provider inngest --output tests/signup-pipeline.workflow.test.ts
```
