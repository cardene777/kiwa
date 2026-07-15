# @kiwa-lab/workflow

Durable workflow / step orchestration mock harness for kiwa — Temporal / Inngest / Trigger.dev / AWS Step Functions を in-process で叩く test infra。

## Installation

```bash
pnpm add -D @kiwa-lab/workflow
# or
npm install -D @kiwa-lab/workflow
# or
yarn add -D @kiwa-lab/workflow
```

## Supported providers

| Provider | Status | ID prefix |
|---|---|---|
| Temporal | ✅ | `wf-` |
| Inngest | ✅ | `ing-` |
| Trigger.dev | ✅ | `trg-` |
| AWS Step Functions | ✅ | `sfn-` |

## Quick start

```ts
import { createWorkflowClient, defineWorkflow, retryStep, eventDrivenTrigger } from '@kiwa-lab/workflow';

const client = createWorkflowClient({ provider: 'temporal' });

const wf = defineWorkflow('order-flow', [
  { name: 'validate', handler: async (input) => ({ ok: true, orderId: (input as any).id }) },
  { name: 'charge', handler: async (input) => ({ charged: true }) },
  { name: 'ship', handler: async () => ({ shipped: true }) },
]);
client.register(wf);

const result = await client.execute('order-flow', { id: 'o1' });
// result = { id: 'wf-1', status: 'completed', output: { shipped: true }, ... }

const retryResult = await retryStep(async () => fetch('/api'), {
  maxAttempts: 3, baseDelayMs: 100,
});

const trigger = eventDrivenTrigger('order.placed', (event) => client.execute('order-flow', event));
```

## API reference

- `createWorkflowClient(options?: CreateWorkflowClientOptions): WorkflowClient` — provider mock 生成
- `WorkflowClient.register(workflow: WorkflowDefinition): void` — workflow 登録
- `WorkflowClient.execute(name, input): Promise<WorkflowExecutionResult>` — 全 step 順次実行
- `WorkflowClient.listExecutions(): WorkflowExecutionRecord[]` — 実行履歴
- `defineWorkflow(name, steps): WorkflowDefinition` — step 列で workflow 定義
- `executeWorkflow(workflow, input, ctx?): Promise<WorkflowOutput>` — pure executor
- `retryStep(fn, options?): Promise<RetryResult>` — exponential backoff retry
- `eventDrivenTrigger(eventName, handler) / emitEvent(name, payload)` — event → workflow start

## Test integration

```ts
import { describe, expect, it } from 'vitest';
import { createWorkflowClient, defineWorkflow } from '@kiwa-lab/workflow';

describe('order workflow', () => {
  it('全 step 完了で completed', async () => {
    const c = createWorkflowClient();
    c.register(defineWorkflow('t', [{ name: 's1', handler: async () => ({ ok: true }) }]));
    const r = await c.execute('t', {});
    expect(r.status).toBe('completed');
  });
});
```

`/kiwa-workflow` skill を起動すると step / retry / event-driven 3 経路の test を生成できる。

## License

UNLICENSED — see [cardene777/kiwa](https://github.com/cardene777/kiwa) for repo terms.
