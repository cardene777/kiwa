---
title: "@kiwa-lab/grpc interceptor の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/grpc</code> <code v-pre>interceptor</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/interceptor.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>composeInterceptors</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/interceptor.ts#L20) <code v-pre>packages/grpc/src/interceptor.ts</code>

interceptor chain builder。 real gRPC (grpc-js / nice-grpc) の interceptor middleware 相当。 順序どおり呼び、 各 interceptor が before/after で ctx を操作。

```ts
export declare function composeInterceptors(interceptors: readonly Interceptor[]): (ctx: InterceptorContext, final: () => Promise<{
    response?: unknown;
    status: GrpcStatus;
}>) => Promise<{
    response?: unknown;
    status: GrpcStatus;
}>;
```

### 型

#### <code v-pre>Interceptor</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/interceptor.ts#L11) <code v-pre>packages/grpc/src/interceptor.ts</code>

```ts
export type Interceptor = (ctx: InterceptorContext, next: () => Promise<{
    response?: unknown;
    status: GrpcStatus;
}>) => Promise<{
    response?: unknown;
    status: GrpcStatus;
}>;
```

#### <code v-pre>InterceptorContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/interceptor.ts#L4) <code v-pre>packages/grpc/src/interceptor.ts</code>

```ts
export interface InterceptorContext {
    service: string;
    method: string;
    metadata: GrpcMetadata;
    request: unknown;
}
```
