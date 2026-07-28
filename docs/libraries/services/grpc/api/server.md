---
title: "@kiwa-lab/grpc server の API 契約"
---

# <code v-pre>@kiwa-lab/grpc</code> <code v-pre>server</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/server.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createGrpcServer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/server.ts#L35) <code v-pre>packages/grpc/src/server.ts</code>

```ts
export declare function createGrpcServer(options?: CreateGrpcServerOptions): GrpcServer;
```

#### <code v-pre>defineService</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/server.ts#L50) <code v-pre>packages/grpc/src/server.ts</code>

```ts
export declare function defineService(name: string, methods: Array<{
    name: string;
    type: MethodType;
    handler: (...args: any[]) => any;
}>): ServiceDefinition;
```

### 型

#### <code v-pre>GrpcMetadata</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/server.ts#L8) <code v-pre>packages/grpc/src/server.ts</code>

```ts
export type GrpcMetadata = MetadataEntry[];
```

#### <code v-pre>GrpcProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/server.ts#L4) <code v-pre>packages/grpc/src/server.ts</code>

```ts
export type GrpcProvider = 'grpc-js' | 'nice-grpc' | 'twirp' | 'connect';
```

#### <code v-pre>GrpcServer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/server.ts#L24) <code v-pre>packages/grpc/src/server.ts</code>

```ts
export interface GrpcServer {
    provider: GrpcProvider;
    services: Map<string, ServiceDefinition>;
    addService: (service: ServiceDefinition) => void;
    getMethod: (service: string, method: string) => MethodDefinition | undefined;
}
```

#### <code v-pre>MethodDefinition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/server.ts#L12) <code v-pre>packages/grpc/src/server.ts</code>

```ts
export interface MethodDefinition {
    name: string;
    type: MethodType;
    handler: (...args: any[]) => any;
}
```

#### <code v-pre>MethodType</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/server.ts#L6) <code v-pre>packages/grpc/src/server.ts</code>

```ts
export type MethodType = 'unary' | 'server-stream' | 'client-stream' | 'bidi';
```

#### <code v-pre>ServiceDefinition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/server.ts#L19) <code v-pre>packages/grpc/src/server.ts</code>

```ts
export interface ServiceDefinition {
    name: string;
    methods: Map<string, MethodDefinition>;
}
```
