---
title: "@kiwa-lab/webhook observability の API 契約"
---

# <code v-pre>@kiwa-lab/webhook</code> <code v-pre>observability</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/observability.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createHookRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/observability.ts#L20) <code v-pre>packages/webhook/src/observability.ts</code>

```ts
export declare function createHookRegistry(): HookRegistry;
```

#### <code v-pre>verifyObservable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/observability.ts#L38) <code v-pre>packages/webhook/src/observability.ts</code>

```ts
export declare function verifyObservable(verifier: WebhookVerifier, incoming: IncomingWebhook, hooks: HookRegistry): WebhookVerifyOutcome;
```

### 型

#### <code v-pre>HookCallback</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/observability.ts#L12) <code v-pre>packages/webhook/src/observability.ts</code>

```ts
export type HookCallback = (ctx: HookContext) => void;
```

#### <code v-pre>HookContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/observability.ts#L5) <code v-pre>packages/webhook/src/observability.ts</code>

```ts
export interface HookContext {
    event: VerifyHookEvent;
    incoming: IncomingWebhook;
    outcome?: WebhookVerifyOutcome;
    durationMs?: number;
}
```

#### <code v-pre>HookRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/observability.ts#L14) <code v-pre>packages/webhook/src/observability.ts</code>

```ts
export interface HookRegistry {
    register: (event: VerifyHookEvent, cb: HookCallback) => () => void;
    emit: (event: VerifyHookEvent, ctx: HookContext) => void;
    count: (event: VerifyHookEvent) => number;
}
```

#### <code v-pre>VerifyHookEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/observability.ts#L3) <code v-pre>packages/webhook/src/observability.ts</code>

```ts
export type VerifyHookEvent = 'before-verify' | 'after-verify' | 'rejected';
```
