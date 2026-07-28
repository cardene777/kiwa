---
title: "@kiwa-lab/grpc deadline の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/grpc</code> <code v-pre>deadline</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/deadline.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createDeadlineContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/deadline.ts#L11) <code v-pre>packages/grpc/src/deadline.ts</code>

gRPC の deadline (call が終わる期限) を propagate する context 作成。 real gRPC の `context.WithDeadline` 相当 mock。 remainingMs で propagation 判定。

```ts
export declare function createDeadlineContext(deadlineMs: number, now?: () => number): DeadlineContext;
```

#### <code v-pre>isDeadlineExceeded</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/deadline.ts#L19) <code v-pre>packages/grpc/src/deadline.ts</code>

```ts
export declare function isDeadlineExceeded(ctx: DeadlineContext): boolean;
```

#### <code v-pre>remainingDeadlineMs</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/deadline.ts#L15) <code v-pre>packages/grpc/src/deadline.ts</code>

```ts
export declare function remainingDeadlineMs(ctx: DeadlineContext): number;
```

### 型

#### <code v-pre>DeadlineContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/deadline.ts#L1) <code v-pre>packages/grpc/src/deadline.ts</code>

```ts
export interface DeadlineContext {
    startAt: number;
    deadlineMs: number;
    now: () => number;
}
```
