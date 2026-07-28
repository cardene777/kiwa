---
title: "@kiwa-lab/upload client の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/upload</code> <code v-pre>client</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/client.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createUploadClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/client.ts#L53) <code v-pre>packages/upload/src/client.ts</code>

provider 別のみ mock 差 (id prefix / etag format) を持たせつつ、 全 API 共通 interface。 実 provider (S3 / GCS / R2 / Cloudinary) の SDK を差し替えても同じ signature で呼べる想定。

```ts
export declare function createUploadClient(options?: CreateUploadClientOptions): UploadClient;
```

### 型

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
