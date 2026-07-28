---
title: "@kiwa-lab/feature-flag observability の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/feature-flag</code> <code v-pre>observability</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/observability.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createHookRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/observability.ts#L22) <code v-pre>packages/feature-flag/src/observability.ts</code>

```ts
export declare function createHookRegistry(): HookRegistry;
```

#### <code v-pre>evaluateObservable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/observability.ts#L36) <code v-pre>packages/feature-flag/src/observability.ts</code>

```ts
export declare function evaluateObservable(client: FlagClient, key: string, user: FlagUser, hooks: HookRegistry): EvaluateFlagResult;
```

### 型

#### <code v-pre>EvalHookEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/observability.ts#L4) <code v-pre>packages/feature-flag/src/observability.ts</code>

```ts
export type EvalHookEvent = 'before-eval' | 'after-eval' | 'error';
```

#### <code v-pre>HookCallback</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/observability.ts#L14) <code v-pre>packages/feature-flag/src/observability.ts</code>

```ts
export type HookCallback = (ctx: HookContext) => void;
```

#### <code v-pre>HookContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/observability.ts#L6) <code v-pre>packages/feature-flag/src/observability.ts</code>

```ts
export interface HookContext {
    event: EvalHookEvent;
    key: string;
    user: FlagUser;
    result?: EvaluateFlagResult;
    error?: string;
}
```

#### <code v-pre>HookRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/feature-flag/src/observability.ts#L16) <code v-pre>packages/feature-flag/src/observability.ts</code>

```ts
export interface HookRegistry {
    register: (event: EvalHookEvent, cb: HookCallback) => () => void;
    emit: (event: EvalHookEvent, ctx: HookContext) => void;
    count: (event: EvalHookEvent) => number;
}
```
