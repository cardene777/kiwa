# @kiwa-lab/workflow API reference

## Overview

`@kiwa-lab/workflow` は Temporal / Inngest / Trigger.dev / AWS Step Functions 4 provider を統一 interface で mock する durable workflow / step orchestration test infra。 step 定義 + execute + retry (exponential backoff) + event-driven trigger を in-process 叩ける。

## Supported providers

| provider | step model | retry model | event source |
|---|---|---|---|
| temporal | Activity | RetryPolicy (initialInterval + max) | Signal / Query |
| inngest | step.run | attempts + retryAfter | event.send |
| triggerdev | task run | maxAttempts + backoff | trigger.send |
| step-functions | Task state | Retry array | EventBridge |

## Main API

### `createWorkflowClient(options: CreateWorkflowClientOptions): WorkflowClient`

provider 別 mock client、 workflow 定義を register する主 entry。

### `defineWorkflow(name, steps: WorkflowStep[]): WorkflowDefinition`

step 一覧を宣言、 `WorkflowStep = { id, fn, retryPolicy?, timeout? }`。

### `executeWorkflow(client, definition, input): Promise<WorkflowExecutionResult>`

workflow を実行、 step を順次 (or 並列) invoke、 `{ status: 'completed'|'failed', output?, error?, steps: [{id, status, result?, attempts}] }` を返す。

### `retryStep(fn, options: RetryOptions): Promise<RetryResult>`

step 単独の retry loop、 `{ maxAttempts, baseMs, factor, maxMs? }` で backoff、 `{ result?, error?, attempts, elapsedMs }` を返す。

### `eventDrivenTrigger(client, eventType, handler): EventTriggerHandle`

event を subscribe、 `emitEvent(client, event)` で workflow を起動、 `.next()` で 1 iteration 待機。

## Types

- `WorkflowProvider = 'temporal' | 'inngest' | 'triggerdev' | 'step-functions'`
- `WorkflowStep` = `{ id, fn: (ctx) => Promise<any>, retryPolicy?, timeout?, dependsOn? }`
- `WorkflowExecutionResult` = `{ status, output?, error?, steps }`
- `RetryOptions` = `{ maxAttempts, baseMs, factor?, maxMs? }`
- `EmittedEvent` = `{ type, payload, occurredAt }`

## Usage examples

### 3-step sequential workflow

```typescript
import { createWorkflowClient, defineWorkflow, executeWorkflow } from '@kiwa-lab/workflow';
import { describe, expect, it } from 'vitest';

describe('order fulfillment workflow', () => {
  it('validate → charge → ship の 3 step 完了', async () => {
    const client = createWorkflowClient({ provider: 'temporal' });
    const wf = defineWorkflow('order-fulfillment', [
      { id: 'validate', fn: async ({ input }) => ({ valid: input.total > 0 }) },
      { id: 'charge', fn: async () => ({ chargeId: 'ch-1' }) },
      { id: 'ship', fn: async () => ({ trackingId: 'trk-1' }) },
    ]);
    const result = await executeWorkflow(client, wf, { total: 1000 });
    expect(result.status).toBe('completed');
    expect(result.steps.map((s) => s.id)).toEqual(['validate', 'charge', 'ship']);
  });
});
```

### Retry with backoff

```typescript
import { retryStep } from '@kiwa-lab/workflow';

let attempts = 0;
const result = await retryStep(
  async () => {
    attempts += 1;
    if (attempts < 3) throw new Error('transient');
    return 'ok';
  },
  { maxAttempts: 5, baseMs: 100, factor: 2 },
);
console.log(result.attempts, result.result); // 3 "ok"
```

## Related skills

- [`/kiwa-workflow`](../skills/kiwa-workflow) — workflow test 生成 skill
