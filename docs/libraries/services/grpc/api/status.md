---
title: "@kiwa-lab/grpc status の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/grpc</code> <code v-pre>status</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/status.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>decodeStatus</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/status.ts#L36) <code v-pre>packages/grpc/src/status.ts</code>

```ts
export declare function decodeStatus(headers: Record<string, string>): GrpcStatus;
```

#### <code v-pre>encodeStatus</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/status.ts#L29) <code v-pre>packages/grpc/src/status.ts</code>

```ts
export declare function encodeStatus(status: GrpcStatus): {
    'grpc-status': string;
    'grpc-message': string;
};
```

#### <code v-pre>STATUS&#95;CODES</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/status.ts#L1) <code v-pre>packages/grpc/src/status.ts</code>

```ts
export declare const STATUS_CODES: Readonly<{
    OK: 0;
    CANCELLED: 1;
    UNKNOWN: 2;
    INVALID_ARGUMENT: 3;
    DEADLINE_EXCEEDED: 4;
    NOT_FOUND: 5;
    ALREADY_EXISTS: 6;
    PERMISSION_DENIED: 7;
    RESOURCE_EXHAUSTED: 8;
    FAILED_PRECONDITION: 9;
    ABORTED: 10;
    OUT_OF_RANGE: 11;
    UNIMPLEMENTED: 12;
    INTERNAL: 13;
    UNAVAILABLE: 14;
    DATA_LOSS: 15;
    UNAUTHENTICATED: 16;
}>;
```

### 型

#### <code v-pre>GrpcStatus</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/status.ts#L23) <code v-pre>packages/grpc/src/status.ts</code>

```ts
export interface GrpcStatus {
    code: GrpcStatusCode;
    message: string;
    details?: unknown;
}
```

#### <code v-pre>GrpcStatusCode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/status.ts#L21) <code v-pre>packages/grpc/src/status.ts</code>

```ts
export type GrpcStatusCode = (typeof STATUS_CODES)[keyof typeof STATUS_CODES];
```
