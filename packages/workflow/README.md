# @kiwa-lab/workflow

Durable workflow / step orchestration mock harness for kiwa — Temporal / Inngest / Trigger.dev / AWS Step Functions を統一 interface で invoke する in-process mock。

## API

- `createWorkflowClient(options)` = provider mock client (defineWorkflow / executeWorkflow / listExecutions)
- `defineWorkflow(name, steps)` = step 一覧を持つ workflow 定義を作成
- `executeWorkflow(client, workflow, input)` = 定義済 workflow を input 付きで実行
- `retryStep(fn, options)` = exponential backoff で step retry (maxAttempts / baseDelayMs)
- `eventDrivenTrigger(client, eventName, workflow)` = event 名で workflow start を登録
