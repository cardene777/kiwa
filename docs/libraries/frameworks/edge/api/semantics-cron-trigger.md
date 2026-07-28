---
title: "@kiwa-lab/edge semantics-cron-trigger の API 契約"
---

# <code v-pre>@kiwa-lab/edge</code> <code v-pre>semantics-cron-trigger</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cron-trigger.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>completeCron</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cron-trigger.ts#L90) <code v-pre>packages/edge/src/semantics/cron-trigger.ts</code>

Finish a running invocation successfully. Transitions `running` → `completed` and emits `cron.completed`. Rejects if not `running`.

```ts
export declare function completeCron(session: CronSession, input: {
    durationMs: number;
}): AxisStep<CronState>;
```

#### <code v-pre>failCron</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cron-trigger.ts#L115) <code v-pre>packages/edge/src/semantics/cron-trigger.ts</code>

Fail a running invocation. Increments `retryCount`; if retries remain the session re-enters the `scheduled` state (to be picked up again), otherwise it terminates in `failed`. Emits `cron.failed` with `willRetry` reflecting the decision. Rejects if the session already `completed`.

```ts
export declare function failCron(session: CronSession, input: {
    reason: string;
}): AxisStep<CronState>;
```

#### <code v-pre>scheduleCron</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cron-trigger.ts#L33) <code v-pre>packages/edge/src/semantics/cron-trigger.ts</code>

Schedule a cron invocation. Emits `cron.scheduled` and seeds the session in the `scheduled` state. `triggerType` defaults to `scheduled` (a plain time trigger) and `maxRetries` defaults to 3.

```ts
export declare function scheduleCron(input: {
    id: string;
    platform: EdgePlatform;
    triggerType?: CronTriggerType;
    cronSpec: string;
    maxRetries?: number;
}): CronSession;
```

#### <code v-pre>startCron</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cron-trigger.ts#L69) <code v-pre>packages/edge/src/semantics/cron-trigger.ts</code>

Begin executing a scheduled invocation. Transitions `scheduled` → `running`, stamps `startedAt`, and emits `cron.started`. Rejects if the session is not currently `scheduled` (already running / terminal).

```ts
export declare function startCron(session: CronSession): AxisStep<CronState>;
```

### 型

#### <code v-pre>CronSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cron-trigger.ts#L16) <code v-pre>packages/edge/src/semantics/cron-trigger.ts</code>

```ts
export interface CronSession {
    id: string;
    platform: EdgePlatform;
    triggerType: CronTriggerType;
    cronSpec: string;
    state: CronState;
    startedAt: number | null;
    retryCount: number;
    maxRetries: number;
    history: AxisStep<CronState>[];
}
```

#### <code v-pre>CronState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cron-trigger.ts#L11) <code v-pre>packages/edge/src/semantics/cron-trigger.ts</code>

Cron trigger — scheduled invocation lifecycle. Edge platforms fire scheduled handlers from distinct sources (Cloudflare Cron Triggers + Queue consumers + Email routing, Vercel Cron jobs, Deno Deploy cron) yet share the same observable lifecycle: an event is scheduled, starts running, then either completes or fails. A failed run re-enters the schedule until `maxRetries` is exhausted, at which point it terminates in `failed`.

```ts
export type CronState = 'scheduled' | 'running' | 'completed' | 'failed';
```

#### <code v-pre>CronTriggerType</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cron-trigger.ts#L14) <code v-pre>packages/edge/src/semantics/cron-trigger.ts</code>

Which trigger source fired the scheduled handler.

```ts
export type CronTriggerType = 'scheduled' | 'queue' | 'email';
```
