---
title: "@kiwa-lab/upload checksum の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/upload</code> <code v-pre>checksum</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/checksum.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>computeChecksum</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/checksum.ts#L39) <code v-pre>packages/upload/src/checksum.ts</code>

```ts
export declare function computeChecksum(body: Buffer | Uint8Array | string, algorithm?: ChecksumAlgorithm): string;
```

#### <code v-pre>verifyUpload</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/checksum.ts#L24) <code v-pre>packages/upload/src/checksum.ts</code>

upload された object の checksum + size を検証。 provider 側の etag と caller side で 事前計算した checksum の一致確認に使う。

```ts
export declare function verifyUpload(input: VerifyUploadInput): VerifyUploadResult;
```

### 型

#### <code v-pre>ChecksumAlgorithm</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/checksum.ts#L3) <code v-pre>packages/upload/src/checksum.ts</code>

```ts
export type ChecksumAlgorithm = 'md5' | 'sha1' | 'sha256';
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
