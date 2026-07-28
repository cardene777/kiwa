---
title: "@kiwa-lab/upload presign の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/upload</code> <code v-pre>presign</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/presign.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createPresignedUrl</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/presign.ts#L28) <code v-pre>packages/upload/src/presign.ts</code>

provider 別 presigned URL 発行 mock。 real SDK が生成する URL 形式に近い shape で host / query / signature を組み立てる。

```ts
export declare function createPresignedUrl(options: PresignedUrlOptions): PresignedUrlResult;
```

### 型

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
