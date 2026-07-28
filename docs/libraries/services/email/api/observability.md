---
title: "@kiwa-lab/email observability の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/email</code> <code v-pre>observability</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/email/src/observability.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createHookRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/observability.ts#L22) <code v-pre>packages/email/src/observability.ts</code>

observability hook registry。 send 前 / 後 / error 3 phase で callback を発火。

```ts
export declare function createHookRegistry(): HookRegistry;
```

#### <code v-pre>sendObservable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/observability.ts#L48) <code v-pre>packages/email/src/observability.ts</code>

observable send: before-send / after-send / error hook を発火しつつ send。 hook throw は catch して error hook に流す (send 自体は継続)。

```ts
export declare function sendObservable(client: EmailClient, msg: EmailMessage, hooks: HookRegistry): Promise<EmailSendResult>;
```

### 型

#### <code v-pre>HookCallback</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/observability.ts#L13) <code v-pre>packages/email/src/observability.ts</code>

```ts
export type HookCallback = (ctx: HookContext) => void | Promise<void>;
```

#### <code v-pre>HookContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/observability.ts#L5) <code v-pre>packages/email/src/observability.ts</code>

```ts
export interface HookContext {
    event: SendHookEvent;
    message: EmailMessage;
    result?: EmailSendResult;
    error?: string;
    durationMs?: number;
}
```

#### <code v-pre>HookRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/observability.ts#L15) <code v-pre>packages/email/src/observability.ts</code>

```ts
export interface HookRegistry {
    register: (event: SendHookEvent, cb: HookCallback) => () => void;
    emit: (event: SendHookEvent, ctx: HookContext) => Promise<void>;
    count: (event: SendHookEvent) => number;
}
```

#### <code v-pre>SendHookEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/observability.ts#L3) <code v-pre>packages/email/src/observability.ts</code>

```ts
export type SendHookEvent = 'before-send' | 'after-send' | 'error';
```
