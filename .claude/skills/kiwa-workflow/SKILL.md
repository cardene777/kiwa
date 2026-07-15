---
name: kiwa-workflow
description: |
  @kiwa-lab/workflow (Temporal / Inngest / Trigger.dev / AWS Step Functions 統一 mock harness) を使った durable workflow / step orchestration の test 生成 skill。
  `createWorkflowClient` + `defineWorkflow` で step 一覧、 `executeWorkflow` で実行、 `retryStep` で exponential backoff、 `eventDrivenTrigger` で event → workflow start を in-process で叩ける。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-workflow — durable workflow / step orchestration test 生成

`@kiwa-lab/workflow` の 4 provider (Temporal / Inngest / Trigger.dev / Step Functions) 統一 mock を使った workflow test を Vitest 形式で生成する。 real worker 不要で multi-step orchestration / retry / event-driven trigger の test を書く。

## 目的

async workflow (payment settlement / video encoding / batch email / signup pipeline 等) で「event → workflow start → step 1 → step 2 → 失敗時 retry → 完遂」 の complete path を test 化する。 provider 差 (Temporal activity + workflow / Inngest step.run / Trigger.dev task / Step Functions state) を吸収した抽象。

## 前提

- `pnpm add -D @kiwa-lab/workflow` install 済
- Vitest 環境
- 対象 module に workflow 経路 (定期 batch / async job / event-driven pipeline 等) が存在

## オプション

- `--module {name}` — test 対象 module (payment-settlement / video-encode / signup-pipeline 等)
- `--provider {temporal|inngest|triggerdev|stepfunctions}` — 主要 provider (省略時 = 4 provider 全対応)
- `--output {path}` — 生成 test の path

## 実行フロー

### Step 1: multi-step workflow test 生成

`createWorkflowClient({ provider })` + `defineWorkflow('signup', [step1, step2, step3])` で workflow 定義、 `executeWorkflow(client, 'signup', input)` で実行、 return `steps[]` の各 step 出力 + `status: 'completed'` を assert。 step 途中失敗 → workflow fail path も cover。

### Step 2: retry backoff test 生成

`retryStep(async () => flakyOp(), { maxAttempts: 3, baseDelayMs: 100 })` で 2 回 throw → 3 回目 success、 attempts 数 + total elapsed を assert。 全 attempt 失敗の final error propagation も追加。

### Step 3: event-driven trigger test 生成

`eventDrivenTrigger(client, 'user.signup', 'signup-workflow')` で event 登録、 `client.emitEvent('user.signup', { userId: 'u-1' })` で workflow 発火、 実行履歴 + input propagation を verify。

## 使用例

```bash
/kiwa-workflow --module payment-settlement --provider temporal
/kiwa-workflow --module signup-pipeline --provider inngest
```
