# @kiwa-lab/upload リファレンス

オブジェクトストレージ mock の公開 API です。最初の保存と拒否は [Quickstart](./quickstart)、presigned URL、multipart、checksum は [使い方](./how-to) で実行できます。この page では、保存状態を変える API と、入力だけを検証する API を区別して確認してください。

## 操作の入口

`createUploadClient` は S3、GCS、R2、Cloudinary 名の in-memory client を作ります。`UploadClient.upload`、`get`、`list`、`delete` はその client の object store を操作します。`clear` は object をすべて消すため、test の後始末または shared client の再利用前に使います。

`createPresignedUrl` は PUT または GET 用の URL shape を作りますが、URL を使って object を保存しません。`uploadMultipart` は part を並べ替えて結合し、最後に一つの object を保存します。`verifyUpload` と `computeChecksum` は渡した body を比較する API で、store から object を読む API ではありません。

## 設定

`provider` に S3、GCS、R2、Cloudinary を指定します。`maxSizeBytes` でアップロードの最大サイズを設定できます。

`upload` の失敗は throw ではなく `status: "failed"` の result を返します。`failOn` または最大サイズを超える場合は store に記録されません。`clear` は保存済み object をすべて消去します。

`uploadMultipart(client, bucket, key, parts, contentType)` は part の配列を受け取ります。README のような request object を引数に取る API ではありません。

## 後始末

外部接続は作りません。client はテストごとに作成してください。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| 'uploadMultipart: parts must not be empty' | [packages/upload/src/multipart.ts](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/multipart.ts#L28) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `computeChecksum`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/checksum.ts#L39) `packages/upload/src/checksum.ts`

```ts
export declare function computeChecksum(body: Buffer | Uint8Array | string, algorithm?: ChecksumAlgorithm): string;
```

#### `createCircuitBreaker`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L153) `packages/upload/src/enhancements.ts`

```ts
export declare function createCircuitBreaker(client: UploadClient, options?: CircuitBreakerOptions): CircuitBreaker;
```

#### `createHookRegistry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L106) `packages/upload/src/enhancements.ts`

```ts
export declare function createHookRegistry(): HookRegistry;
```

#### `createIdempotencyCache`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L64) `packages/upload/src/enhancements.ts`

```ts
export declare function createIdempotencyCache(): IdempotencyCache;
```

#### `createPresignedUrl`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/presign.ts#L28) `packages/upload/src/presign.ts`

provider 別 presigned URL 発行 mock。 real SDK が生成する URL 形式に近い shape で host / query / signature を組み立てる。

```ts
export declare function createPresignedUrl(options: PresignedUrlOptions): PresignedUrlResult;
```

#### `createUploadClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/client.ts#L53) `packages/upload/src/client.ts`

provider 別のみ mock 差 (id prefix / etag format) を持たせつつ、 全 API 共通 interface。 実 provider (S3 / GCS / R2 / Cloudinary) の SDK を差し替えても同じ signature で呼べる想定。

```ts
export declare function createUploadClient(options?: CreateUploadClientOptions): UploadClient;
```

#### `uploadBatch`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L41) `packages/upload/src/enhancements.ts`

```ts
export declare function uploadBatch(client: UploadClient, requests: readonly UploadRequest[], concurrency?: number): Promise<BatchUploadResult>;
```

#### `uploadIdempotent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L74) `packages/upload/src/enhancements.ts`

```ts
export declare function uploadIdempotent(client: UploadClient, req: UploadRequest, idempotencyKey: string, cache: IdempotencyCache): Promise<UploadResult & {
    cached: boolean;
}>;
```

#### `uploadMultipart`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/multipart.ts#L21) `packages/upload/src/multipart.ts`

multipart chunked upload workflow。 部分 part を結合して 1 回の upload に集約する mock。 実 provider (S3 multipart / GCS resumable / R2 multipart) と同じ「N part を 1 object に統合」 経路を再現。

```ts
export declare function uploadMultipart(client: UploadClient, bucket: string, key: string, parts: MultipartPart[], contentType?: string): Promise<MultipartUploadResult>;
```

#### `uploadObservable`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L120) `packages/upload/src/enhancements.ts`

```ts
export declare function uploadObservable(client: UploadClient, req: UploadRequest, hooks: HookRegistry): Promise<UploadResult>;
```

#### `uploadWithRetry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L14) `packages/upload/src/enhancements.ts`

```ts
export declare function uploadWithRetry(client: UploadClient, req: UploadRequest, options?: RetryOptions): Promise<UploadResult & {
    attempts: number;
}>;
```

#### `verifyUpload`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/checksum.ts#L24) `packages/upload/src/checksum.ts`

upload された object の checksum + size を検証。 provider 側の etag と caller side で 事前計算した checksum の一致確認に使う。

```ts
export declare function verifyUpload(input: VerifyUploadInput): VerifyUploadResult;
```

### 型

#### `BatchUploadResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L34) `packages/upload/src/enhancements.ts`

```ts
export interface BatchUploadResult {
    total: number;
    succeeded: number;
    failed: number;
    results: UploadResult[];
}
```

#### `ChecksumAlgorithm`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/checksum.ts#L3) `packages/upload/src/checksum.ts`

```ts
export type ChecksumAlgorithm = 'md5' | 'sha1' | 'sha256';
```

#### `CircuitBreaker`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L146) `packages/upload/src/enhancements.ts`

```ts
export interface CircuitBreaker {
    state: () => CircuitState;
    upload: (req: UploadRequest) => Promise<UploadResult & {
        circuitState: CircuitState;
    }>;
    reset: () => void;
    failureCount: () => number;
}
```

#### `CircuitBreakerOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L140) `packages/upload/src/enhancements.ts`

```ts
export interface CircuitBreakerOptions {
    failureThreshold?: number;
    resetTimeoutMs?: number;
    now?: () => number;
}
```

#### `CircuitState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L138) `packages/upload/src/enhancements.ts`

```ts
export type CircuitState = 'closed' | 'open' | 'half-open';
```

#### `CreateUploadClientOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/client.ts#L41) `packages/upload/src/client.ts`

```ts
export interface CreateUploadClientOptions {
    provider?: UploadProvider;
    maxSizeBytes?: number;
    failOn?: (req: UploadRequest) => boolean;
    now?: () => number;
    idSeed?: number;
}
```

#### `HookCallback`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L98) `packages/upload/src/enhancements.ts`

```ts
export type HookCallback = (ctx: HookContext) => void;
```

#### `HookContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L90) `packages/upload/src/enhancements.ts`

```ts
export interface HookContext {
    event: UploadHookEvent;
    request: UploadRequest;
    result?: UploadResult;
    error?: string;
    durationMs?: number;
}
```

#### `HookRegistry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L100) `packages/upload/src/enhancements.ts`

```ts
export interface HookRegistry {
    register: (event: UploadHookEvent, cb: HookCallback) => () => void;
    emit: (event: UploadHookEvent, ctx: HookContext) => void;
    count: (event: UploadHookEvent) => number;
}
```

#### `IdempotencyCache`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L57) `packages/upload/src/enhancements.ts`

```ts
export interface IdempotencyCache {
    get: (key: string) => UploadResult | undefined;
    set: (key: string, value: UploadResult) => void;
    size: () => number;
    clear: () => void;
}
```

#### `MultipartPart`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/multipart.ts#L3) `packages/upload/src/multipart.ts`

```ts
export interface MultipartPart {
    partNumber: number;
    body: Buffer | Uint8Array | string;
}
```

#### `MultipartUploadResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/multipart.ts#L8) `packages/upload/src/multipart.ts`

```ts
export interface MultipartUploadResult {
    bucket: string;
    key: string;
    parts: number;
    totalSize: number;
    result: UploadResult;
}
```

#### `PresignedOperation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/presign.ts#L4) `packages/upload/src/presign.ts`

```ts
export type PresignedOperation = 'get' | 'put';
```

#### `PresignedUrlOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/presign.ts#L6) `packages/upload/src/presign.ts`

```ts
export interface PresignedUrlOptions {
    provider: UploadProvider;
    bucket: string;
    key: string;
    operation: PresignedOperation;
    expiresIn?: number;
    secret?: string;
    region?: string;
}
```

#### `PresignedUrlResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/presign.ts#L16) `packages/upload/src/presign.ts`

```ts
export interface PresignedUrlResult {
    url: string;
    provider: UploadProvider;
    operation: PresignedOperation;
    expiresAt: number;
    signature: string;
}
```

#### `RetryOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L8) `packages/upload/src/enhancements.ts`

```ts
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    onRetry?: (attempt: number, reason: string) => void;
}
```

#### `UploadClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/client.ts#L32) `packages/upload/src/client.ts`

```ts
export interface UploadClient {
    provider: UploadProvider;
    upload: (req: UploadRequest) => Promise<UploadResult>;
    get: (bucket: string, key: string) => UploadedObjectRecord | undefined;
    delete: (bucket: string, key: string) => boolean;
    list: (bucket: string) => UploadedObjectRecord[];
    clear: () => void;
}
```

#### `UploadedObjectRecord`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/client.ts#L27) `packages/upload/src/client.ts`

```ts
export interface UploadedObjectRecord extends UploadResult {
    request: UploadRequest;
    body: Buffer;
}
```

#### `UploadHookEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L88) `packages/upload/src/enhancements.ts`

```ts
export type UploadHookEvent = 'before-upload' | 'after-upload' | 'error';
```

#### `UploadProvider`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/client.ts#L3) `packages/upload/src/client.ts`

```ts
export type UploadProvider = 's3' | 'gcs' | 'r2' | 'cloudinary';
```

#### `UploadRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/client.ts#L5) `packages/upload/src/client.ts`

```ts
export interface UploadRequest {
    bucket: string;
    key: string;
    body: Buffer | Uint8Array | string;
    contentType?: string;
    metadata?: Record<string, string>;
    cacheControl?: string;
    acl?: 'private' | 'public-read';
}
```

#### `UploadResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/client.ts#L15) `packages/upload/src/client.ts`

```ts
export interface UploadResult {
    id: string;
    provider: UploadProvider;
    status: 'uploaded' | 'failed';
    bucket: string;
    key: string;
    size: number;
    etag: string;
    uploadedAt: number;
    reason?: string;
}
```

#### `VerifyUploadInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/checksum.ts#L5) `packages/upload/src/checksum.ts`

```ts
export interface VerifyUploadInput {
    body: Buffer | Uint8Array | string;
    expectedSize?: number;
    expectedChecksum?: string;
    algorithm?: ChecksumAlgorithm;
}
```

#### `VerifyUploadResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/checksum.ts#L12) `packages/upload/src/checksum.ts`

```ts
export interface VerifyUploadResult {
    valid: boolean;
    size: number;
    checksum: string;
    algorithm: ChecksumAlgorithm;
    reason?: string;
}
```
<!-- kiwa-public-api:end -->
