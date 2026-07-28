---
title: "@kiwa-lab/grpc invoke の API 契約"
---

# <code v-pre>@kiwa-lab/grpc</code> <code v-pre>invoke</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/invoke.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>invokeBidi</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/invoke.ts#L91) <code v-pre>packages/grpc/src/invoke.ts</code>

```ts
export declare function invokeBidi<Req, Res>(server: GrpcServer, serviceName: string, methodName: string, reqs: Req[], metadata?: GrpcMetadata): Promise<StreamResult<Res>>;
```

#### <code v-pre>invokeClientStream</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/invoke.ts#L70) <code v-pre>packages/grpc/src/invoke.ts</code>

```ts
export declare function invokeClientStream<Req, Res>(server: GrpcServer, serviceName: string, methodName: string, reqs: Req[], metadata?: GrpcMetadata): Promise<UnaryResult<Res>>;
```

#### <code v-pre>invokeServerStream</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/invoke.ts#L51) <code v-pre>packages/grpc/src/invoke.ts</code>

```ts
export declare function invokeServerStream<Req, Res>(server: GrpcServer, serviceName: string, methodName: string, req: Req, metadata?: GrpcMetadata): Promise<StreamResult<Res>>;
```

#### <code v-pre>invokeUnary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/invoke.ts#L33) <code v-pre>packages/grpc/src/invoke.ts</code>

```ts
export declare function invokeUnary<Req, Res>(server: GrpcServer, serviceName: string, methodName: string, req: Req, metadata?: GrpcMetadata): Promise<UnaryResult<Res>>;
```

### 型

#### <code v-pre>BidiHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/invoke.ts#L7) <code v-pre>packages/grpc/src/invoke.ts</code>

```ts
export type BidiHandler<Req = unknown, Res = unknown> = (reqs: AsyncIterable<Req>, metadata?: GrpcMetadata) => AsyncIterable<Res>;
```

#### <code v-pre>ClientStreamHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/invoke.ts#L6) <code v-pre>packages/grpc/src/invoke.ts</code>

```ts
export type ClientStreamHandler<Req = unknown, Res = unknown> = (reqs: AsyncIterable<Req>, metadata?: GrpcMetadata) => Promise<Res> | Res;
```

#### <code v-pre>ServerStreamHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/invoke.ts#L5) <code v-pre>packages/grpc/src/invoke.ts</code>

```ts
export type ServerStreamHandler<Req = unknown, Res = unknown> = (req: Req, metadata?: GrpcMetadata) => AsyncIterable<Res>;
```

#### <code v-pre>StreamResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/invoke.ts#L16) <code v-pre>packages/grpc/src/invoke.ts</code>

```ts
export interface StreamResult<Res> {
    ok: boolean;
    responses: Res[];
    status: GrpcStatus;
    trailingMetadata: GrpcMetadata;
}
```

#### <code v-pre>UnaryHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/invoke.ts#L4) <code v-pre>packages/grpc/src/invoke.ts</code>

```ts
export type UnaryHandler<Req = unknown, Res = unknown> = (req: Req, metadata?: GrpcMetadata) => Promise<Res> | Res;
```

#### <code v-pre>UnaryResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/invoke.ts#L9) <code v-pre>packages/grpc/src/invoke.ts</code>

```ts
export interface UnaryResult<Res> {
    ok: boolean;
    response?: Res;
    status: GrpcStatus;
    trailingMetadata: GrpcMetadata;
}
```
