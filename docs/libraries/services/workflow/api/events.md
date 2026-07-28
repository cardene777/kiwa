---
title: "@kiwa-lab/workflow events の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/workflow</code> <code v-pre>events</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/events.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>emitEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/events.ts#L59) <code v-pre>packages/workflow/src/events.ts</code>

event を emit して登録済 workflow を全 execute する。 emit 順で workflow 実行が並ぶ。

```ts
export declare function emitEvent(client: WorkflowClient, event: EmittedEvent): Promise<WorkflowExecutionResult[]>;
```

#### <code v-pre>eventDrivenTrigger</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/events.ts#L24) <code v-pre>packages/workflow/src/events.ts</code>

event 名で workflow を trigger 登録する。 event が emit されると同名の workflow が execute される (Inngest event-driven / AWS EventBridge → SFN の挙動を再現)。

```ts
export declare function eventDrivenTrigger(client: WorkflowClient, eventName: string, workflow: WorkflowDefinition): EventTriggerHandle;
```

### 型

#### <code v-pre>EmittedEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/events.ts#L4) <code v-pre>packages/workflow/src/events.ts</code>

```ts
export interface EmittedEvent {
    name: string;
    payload: WorkflowInput;
    emittedAt: number;
}
```

#### <code v-pre>EventTriggerHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/events.ts#L10) <code v-pre>packages/workflow/src/events.ts</code>

```ts
export interface EventTriggerHandle {
    eventName: string;
    workflowName: string;
    handledCount: () => number;
    dispose: () => void;
}
```
