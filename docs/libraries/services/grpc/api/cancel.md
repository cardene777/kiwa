---
title: "@kiwa-lab/grpc cancel の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/grpc</code> <code v-pre>cancel</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/cancel.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createCancelToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/cancel.ts#L12) <code v-pre>packages/grpc/src/cancel.ts</code>

bidirectional cancel token。 real gRPC の client / server 両方向 cancel propagation を mock。 handler を register して cancel 発火時に notification。

```ts
export declare function createCancelToken(): CancelToken;
```

### 型

#### <code v-pre>CancelToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/cancel.ts#L1) <code v-pre>packages/grpc/src/cancel.ts</code>

```ts
export interface CancelToken {
    isCanceled: () => boolean;
    cancel: (reason?: string) => void;
    reason: () => string | undefined;
    onCancel: (handler: (reason?: string) => void) => void;
}
```
