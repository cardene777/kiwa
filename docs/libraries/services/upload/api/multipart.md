---
title: "@kiwa-lab/upload multipart の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/upload</code> <code v-pre>multipart</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/multipart.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>uploadMultipart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/multipart.ts#L21) <code v-pre>packages/upload/src/multipart.ts</code>

multipart chunked upload workflow。 部分 part を結合して 1 回の upload に集約する mock。 実 provider (S3 multipart / GCS resumable / R2 multipart) と同じ「N part を 1 object に統合」 経路を再現。

```ts
export declare function uploadMultipart(client: UploadClient, bucket: string, key: string, parts: MultipartPart[], contentType?: string): Promise<MultipartUploadResult>;
```

### 型

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
