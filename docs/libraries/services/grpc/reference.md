# @kiwa-lab/grpc リファレンス

in-process service registry、RPC invocation、status、metadata、deadline、interceptor、cancel token の公開 API です。

## service と method

`createGrpcServer({ provider })` は `provider` と service Map を持つ server を作ります。provider の既定値は `grpc-js` です。provider は `grpc-js`、`nice-grpc`、`twirp`、`connect` を受け取りますが、invocation の実行方法を切り替えません。

`defineService(name, methods)` は method Map を作ります。同じ service name を `addService` すると既存 service を上書きします。同じ method name が method array に複数ある場合は後ろの definition が残ります。

| method type | handler input | invoke API | result |
| --- | --- | --- | --- |
| `unary` | request、任意 metadata | `invokeUnary` | `UnaryResult` |
| `server-stream` | request、任意 metadata | `invokeServerStream` | `StreamResult` |
| `client-stream` | request の AsyncIterable、任意 metadata | `invokeClientStream` | `UnaryResult` |
| `bidi` | request の AsyncIterable、任意 metadata | `invokeBidi` | `StreamResult` |

client stream と bidi の public invoke API は request array を受け取ります。stream result の `responses` は handler 完了までに yield した全 value です。

## result と status

`UnaryResult` は `ok`、任意の `response`、`status`、`trailingMetadata` を持ちます。`StreamResult` は `responses` array を持ちます。成功 status は `{ code: 0, message: "" }` です。

method 未登録または type 不一致では code `12`、message `method not found: service/method` の結果を返します。handler error は numeric code を持てばその値、なければ code `2` と error message に変換されます。trailing metadata は現在常に空配列です。

`STATUS_CODES` は 0 から 16 の gRPC status code mapping です。`encodeStatus` は `grpc-status` と URL encode した `grpc-message` を返し、`decodeStatus` はそれを戻します。

## metadata

`createMetadata(record)` は key を小文字化した entry array を返します。`mergeMetadata(a, b)` は key ごとに後ろの b を優先し、同じ key を一つにします。

## deadline と cancel

`createDeadlineContext(deadlineMs, now)` は start timestamp を保持します。`remainingDeadlineMs` は 0 未満にならず、`isDeadlineExceeded` は残り時間が 0 の場合に true です。これらは純粋な計算で、RPC invocation を自動 cancel しません。

`createCancelToken` は `isCanceled`、`cancel`、`reason`、`onCancel` を返します。cancel は最初の一度だけ handler を呼び、cancel 後に登録した handler は直ちに呼ばれます。invoke helper とは自動接続されません。

## interceptor

`composeInterceptors(interceptors)` は `(context, final)` を受け取る chain を作ります。interceptor が同じ `next()` を二回呼ぶと error になります。RPC invocation はこの chain を自動実行しないため、interceptor を使う test では戻り値の function を明示的に呼びます。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| 'next() called multiple times in same interceptor' | [packages/grpc/src/interceptor.ts](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/interceptor.ts#L27) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `composeInterceptors`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/interceptor.ts#L20) `packages/grpc/src/interceptor.ts`

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

#### `createCancelToken`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/cancel.ts#L12) `packages/grpc/src/cancel.ts`

bidirectional cancel token。 real gRPC の client / server 両方向 cancel propagation を mock。 handler を register して cancel 発火時に notification。

```ts
export declare function createCancelToken(): CancelToken;
```

#### `createDeadlineContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/deadline.ts#L11) `packages/grpc/src/deadline.ts`

gRPC の deadline (call が終わる期限) を propagate する context 作成。 real gRPC の `context.WithDeadline` 相当 mock。 remainingMs で propagation 判定。

```ts
export declare function createDeadlineContext(deadlineMs: number, now?: () => number): DeadlineContext;
```

#### `createGrpcServer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/server.ts#L35) `packages/grpc/src/server.ts`

```ts
export declare function createGrpcServer(options?: CreateGrpcServerOptions): GrpcServer;
```

#### `createMetadata`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/metadata.ts#L6) `packages/grpc/src/metadata.ts`

```ts
export declare function createMetadata(entries?: Record<string, string>): MetadataEntry[];
```

#### `decodeStatus`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/status.ts#L36) `packages/grpc/src/status.ts`

```ts
export declare function decodeStatus(headers: Record<string, string>): GrpcStatus;
```

#### `defineService`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/server.ts#L50) `packages/grpc/src/server.ts`

```ts
export declare function defineService(name: string, methods: Array<{
    name: string;
    type: MethodType;
    handler: (...args: any[]) => any;
}>): ServiceDefinition;
```

#### `encodeStatus`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/status.ts#L29) `packages/grpc/src/status.ts`

```ts
export declare function encodeStatus(status: GrpcStatus): {
    'grpc-status': string;
    'grpc-message': string;
};
```

#### `invokeBidi`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/invoke.ts#L91) `packages/grpc/src/invoke.ts`

```ts
export declare function invokeBidi<Req, Res>(server: GrpcServer, serviceName: string, methodName: string, reqs: Req[], metadata?: GrpcMetadata): Promise<StreamResult<Res>>;
```

#### `invokeClientStream`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/invoke.ts#L70) `packages/grpc/src/invoke.ts`

```ts
export declare function invokeClientStream<Req, Res>(server: GrpcServer, serviceName: string, methodName: string, reqs: Req[], metadata?: GrpcMetadata): Promise<UnaryResult<Res>>;
```

#### `invokeServerStream`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/invoke.ts#L51) `packages/grpc/src/invoke.ts`

```ts
export declare function invokeServerStream<Req, Res>(server: GrpcServer, serviceName: string, methodName: string, req: Req, metadata?: GrpcMetadata): Promise<StreamResult<Res>>;
```

#### `invokeUnary`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/invoke.ts#L33) `packages/grpc/src/invoke.ts`

```ts
export declare function invokeUnary<Req, Res>(server: GrpcServer, serviceName: string, methodName: string, req: Req, metadata?: GrpcMetadata): Promise<UnaryResult<Res>>;
```

#### `isDeadlineExceeded`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/deadline.ts#L19) `packages/grpc/src/deadline.ts`

```ts
export declare function isDeadlineExceeded(ctx: DeadlineContext): boolean;
```

#### `mergeMetadata`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/metadata.ts#L10) `packages/grpc/src/metadata.ts`

```ts
export declare function mergeMetadata(a: MetadataEntry[], b: MetadataEntry[]): MetadataEntry[];
```

#### `remainingDeadlineMs`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/deadline.ts#L15) `packages/grpc/src/deadline.ts`

```ts
export declare function remainingDeadlineMs(ctx: DeadlineContext): number;
```

#### `STATUS_CODES`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/status.ts#L1) `packages/grpc/src/status.ts`

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

#### `BidiHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/invoke.ts#L7) `packages/grpc/src/invoke.ts`

```ts
export type BidiHandler<Req = unknown, Res = unknown> = (reqs: AsyncIterable<Req>, metadata?: GrpcMetadata) => AsyncIterable<Res>;
```

#### `CancelToken`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/cancel.ts#L1) `packages/grpc/src/cancel.ts`

```ts
export interface CancelToken {
    isCanceled: () => boolean;
    cancel: (reason?: string) => void;
    reason: () => string | undefined;
    onCancel: (handler: (reason?: string) => void) => void;
}
```

#### `ClientStreamHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/invoke.ts#L6) `packages/grpc/src/invoke.ts`

```ts
export type ClientStreamHandler<Req = unknown, Res = unknown> = (reqs: AsyncIterable<Req>, metadata?: GrpcMetadata) => Promise<Res> | Res;
```

#### `DeadlineContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/deadline.ts#L1) `packages/grpc/src/deadline.ts`

```ts
export interface DeadlineContext {
    startAt: number;
    deadlineMs: number;
    now: () => number;
}
```

#### `GrpcMetadata`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/server.ts#L8) `packages/grpc/src/server.ts`

```ts
export type GrpcMetadata = MetadataEntry[];
```

#### `GrpcProvider`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/server.ts#L4) `packages/grpc/src/server.ts`

```ts
export type GrpcProvider = 'grpc-js' | 'nice-grpc' | 'twirp' | 'connect';
```

#### `GrpcServer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/server.ts#L24) `packages/grpc/src/server.ts`

```ts
export interface GrpcServer {
    provider: GrpcProvider;
    services: Map<string, ServiceDefinition>;
    addService: (service: ServiceDefinition) => void;
    getMethod: (service: string, method: string) => MethodDefinition | undefined;
}
```

#### `GrpcStatus`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/status.ts#L23) `packages/grpc/src/status.ts`

```ts
export interface GrpcStatus {
    code: GrpcStatusCode;
    message: string;
    details?: unknown;
}
```

#### `GrpcStatusCode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/status.ts#L21) `packages/grpc/src/status.ts`

```ts
export type GrpcStatusCode = (typeof STATUS_CODES)[keyof typeof STATUS_CODES];
```

#### `Interceptor`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/interceptor.ts#L11) `packages/grpc/src/interceptor.ts`

```ts
export type Interceptor = (ctx: InterceptorContext, next: () => Promise<{
    response?: unknown;
    status: GrpcStatus;
}>) => Promise<{
    response?: unknown;
    status: GrpcStatus;
}>;
```

#### `InterceptorContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/interceptor.ts#L4) `packages/grpc/src/interceptor.ts`

```ts
export interface InterceptorContext {
    service: string;
    method: string;
    metadata: GrpcMetadata;
    request: unknown;
}
```

#### `MetadataEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/metadata.ts#L1) `packages/grpc/src/metadata.ts`

```ts
export interface MetadataEntry {
    key: string;
    value: string;
}
```

#### `MethodDefinition`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/server.ts#L12) `packages/grpc/src/server.ts`

```ts
export interface MethodDefinition {
    name: string;
    type: MethodType;
    handler: (...args: any[]) => any;
}
```

#### `MethodType`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/server.ts#L6) `packages/grpc/src/server.ts`

```ts
export type MethodType = 'unary' | 'server-stream' | 'client-stream' | 'bidi';
```

#### `ServerStreamHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/invoke.ts#L5) `packages/grpc/src/invoke.ts`

```ts
export type ServerStreamHandler<Req = unknown, Res = unknown> = (req: Req, metadata?: GrpcMetadata) => AsyncIterable<Res>;
```

#### `ServiceDefinition`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/server.ts#L19) `packages/grpc/src/server.ts`

```ts
export interface ServiceDefinition {
    name: string;
    methods: Map<string, MethodDefinition>;
}
```

#### `StreamResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/invoke.ts#L16) `packages/grpc/src/invoke.ts`

```ts
export interface StreamResult<Res> {
    ok: boolean;
    responses: Res[];
    status: GrpcStatus;
    trailingMetadata: GrpcMetadata;
}
```

#### `UnaryHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/invoke.ts#L4) `packages/grpc/src/invoke.ts`

```ts
export type UnaryHandler<Req = unknown, Res = unknown> = (req: Req, metadata?: GrpcMetadata) => Promise<Res> | Res;
```

#### `UnaryResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/invoke.ts#L9) `packages/grpc/src/invoke.ts`

```ts
export interface UnaryResult<Res> {
    ok: boolean;
    response?: Res;
    status: GrpcStatus;
    trailingMetadata: GrpcMetadata;
}
```
<!-- kiwa-public-api:end -->
