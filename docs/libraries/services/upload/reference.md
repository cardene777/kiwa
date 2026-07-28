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
| <code v-pre>uploadMultipart: parts must not be empty</code> | [packages/upload/src/multipart.ts](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/multipart.ts#L28) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>computeChecksum</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/checksum.ts#L39) <code v-pre>packages/upload/src/checksum.ts</code>

```ts
export declare function computeChecksum(body: Buffer | Uint8Array | string, algorithm?: ChecksumAlgorithm): string;
```

#### <code v-pre>createCircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L153) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export declare function createCircuitBreaker(client: UploadClient, options?: CircuitBreakerOptions): CircuitBreaker;
```

#### <code v-pre>createHookRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L106) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export declare function createHookRegistry(): HookRegistry;
```

#### <code v-pre>createIdempotencyCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L64) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export declare function createIdempotencyCache(): IdempotencyCache;
```

#### <code v-pre>createPresignedUrl</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/presign.ts#L28) <code v-pre>packages/upload/src/presign.ts</code>

provider 別 presigned URL 発行 mock。 real SDK が生成する URL 形式に近い shape で host / query / signature を組み立てる。

```ts
export declare function createPresignedUrl(options: PresignedUrlOptions): PresignedUrlResult;
```

#### <code v-pre>createUploadClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/client.ts#L53) <code v-pre>packages/upload/src/client.ts</code>

provider 別のみ mock 差 (id prefix / etag format) を持たせつつ、 全 API 共通 interface。 実 provider (S3 / GCS / R2 / Cloudinary) の SDK を差し替えても同じ signature で呼べる想定。

```ts
export declare function createUploadClient(options?: CreateUploadClientOptions): UploadClient;
```

#### <code v-pre>uploadBatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L41) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export declare function uploadBatch(client: UploadClient, requests: readonly UploadRequest[], concurrency?: number): Promise<BatchUploadResult>;
```

#### <code v-pre>uploadIdempotent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L74) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export declare function uploadIdempotent(client: UploadClient, req: UploadRequest, idempotencyKey: string, cache: IdempotencyCache): Promise<UploadResult & {
    cached: boolean;
}>;
```

#### <code v-pre>uploadMultipart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/multipart.ts#L21) <code v-pre>packages/upload/src/multipart.ts</code>

multipart chunked upload workflow。 部分 part を結合して 1 回の upload に集約する mock。 実 provider (S3 multipart / GCS resumable / R2 multipart) と同じ「N part を 1 object に統合」 経路を再現。

```ts
export declare function uploadMultipart(client: UploadClient, bucket: string, key: string, parts: MultipartPart[], contentType?: string): Promise<MultipartUploadResult>;
```

#### <code v-pre>uploadObservable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L120) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export declare function uploadObservable(client: UploadClient, req: UploadRequest, hooks: HookRegistry): Promise<UploadResult>;
```

#### <code v-pre>uploadWithRetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L14) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export declare function uploadWithRetry(client: UploadClient, req: UploadRequest, options?: RetryOptions): Promise<UploadResult & {
    attempts: number;
}>;
```

#### <code v-pre>verifyUpload</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/checksum.ts#L24) <code v-pre>packages/upload/src/checksum.ts</code>

upload された object の checksum + size を検証。 provider 側の etag と caller side で 事前計算した checksum の一致確認に使う。

```ts
export declare function verifyUpload(input: VerifyUploadInput): VerifyUploadResult;
```

### 型

#### <code v-pre>BatchUploadResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L34) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export interface BatchUploadResult {
    total: number;
    succeeded: number;
    failed: number;
    results: UploadResult[];
}
```

#### <code v-pre>ChecksumAlgorithm</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/checksum.ts#L3) <code v-pre>packages/upload/src/checksum.ts</code>

```ts
export type ChecksumAlgorithm = 'md5' | 'sha1' | 'sha256';
```

#### <code v-pre>CircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L146) <code v-pre>packages/upload/src/enhancements.ts</code>

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

#### <code v-pre>CircuitBreakerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L140) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export interface CircuitBreakerOptions {
    failureThreshold?: number;
    resetTimeoutMs?: number;
    now?: () => number;
}
```

#### <code v-pre>CircuitState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L138) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export type CircuitState = 'closed' | 'open' | 'half-open';
```

#### <code v-pre>CreateUploadClientOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/client.ts#L41) <code v-pre>packages/upload/src/client.ts</code>

```ts
export interface CreateUploadClientOptions {
    provider?: UploadProvider;
    maxSizeBytes?: number;
    failOn?: (req: UploadRequest) => boolean;
    now?: () => number;
    idSeed?: number;
}
```

#### <code v-pre>HookCallback</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L98) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export type HookCallback = (ctx: HookContext) => void;
```

#### <code v-pre>HookContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L90) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export interface HookContext {
    event: UploadHookEvent;
    request: UploadRequest;
    result?: UploadResult;
    error?: string;
    durationMs?: number;
}
```

#### <code v-pre>HookRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L100) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export interface HookRegistry {
    register: (event: UploadHookEvent, cb: HookCallback) => () => void;
    emit: (event: UploadHookEvent, ctx: HookContext) => void;
    count: (event: UploadHookEvent) => number;
}
```

#### <code v-pre>IdempotencyCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L57) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export interface IdempotencyCache {
    get: (key: string) => UploadResult | undefined;
    set: (key: string, value: UploadResult) => void;
    size: () => number;
    clear: () => void;
}
```

#### <code v-pre>MultipartPart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/multipart.ts#L3) <code v-pre>packages/upload/src/multipart.ts</code>

```ts
export interface MultipartPart {
    partNumber: number;
    body: Buffer | Uint8Array | string;
}
```

#### <code v-pre>MultipartUploadResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/multipart.ts#L8) <code v-pre>packages/upload/src/multipart.ts</code>

```ts
export interface MultipartUploadResult {
    bucket: string;
    key: string;
    parts: number;
    totalSize: number;
    result: UploadResult;
}
```

#### <code v-pre>PresignedOperation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/presign.ts#L4) <code v-pre>packages/upload/src/presign.ts</code>

```ts
export type PresignedOperation = 'get' | 'put';
```

#### <code v-pre>PresignedUrlOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/presign.ts#L6) <code v-pre>packages/upload/src/presign.ts</code>

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

#### <code v-pre>PresignedUrlResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/presign.ts#L16) <code v-pre>packages/upload/src/presign.ts</code>

```ts
export interface PresignedUrlResult {
    url: string;
    provider: UploadProvider;
    operation: PresignedOperation;
    expiresAt: number;
    signature: string;
}
```

#### <code v-pre>RetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L8) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    onRetry?: (attempt: number, reason: string) => void;
}
```

#### <code v-pre>UploadClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/client.ts#L32) <code v-pre>packages/upload/src/client.ts</code>

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

#### <code v-pre>UploadedObjectRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/client.ts#L27) <code v-pre>packages/upload/src/client.ts</code>

```ts
export interface UploadedObjectRecord extends UploadResult {
    request: UploadRequest;
    body: Buffer;
}
```

#### <code v-pre>UploadHookEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/enhancements.ts#L88) <code v-pre>packages/upload/src/enhancements.ts</code>

```ts
export type UploadHookEvent = 'before-upload' | 'after-upload' | 'error';
```

#### <code v-pre>UploadProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/client.ts#L3) <code v-pre>packages/upload/src/client.ts</code>

```ts
export type UploadProvider = 's3' | 'gcs' | 'r2' | 'cloudinary';
```

#### <code v-pre>UploadRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/client.ts#L5) <code v-pre>packages/upload/src/client.ts</code>

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

#### <code v-pre>UploadResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/client.ts#L15) <code v-pre>packages/upload/src/client.ts</code>

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

#### <code v-pre>VerifyUploadInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/checksum.ts#L5) <code v-pre>packages/upload/src/checksum.ts</code>

```ts
export interface VerifyUploadInput {
    body: Buffer | Uint8Array | string;
    expectedSize?: number;
    expectedChecksum?: string;
    algorithm?: ChecksumAlgorithm;
}
```

#### <code v-pre>VerifyUploadResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/checksum.ts#L12) <code v-pre>packages/upload/src/checksum.ts</code>

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
