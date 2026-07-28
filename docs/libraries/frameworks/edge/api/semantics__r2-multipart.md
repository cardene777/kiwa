---
title: "@kiwa-lab/edge semantics__r2-multipart の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/edge</code> <code v-pre>semantics&#95;&#95;r2-multipart</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/r2-multipart.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>completeMultipart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/r2-multipart.ts#L152) <code v-pre>packages/edge/src/semantics/r2-multipart.ts</code>

Complete the multipart upload once all parts are uploaded and verified. Emits `r2.multipart-completed`. Rejects if any part is missing or unverified.

```ts
export declare function completeMultipart(session: R2MultipartSession): AxisStep<R2State>;
```

#### <code v-pre>initiateMultipart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/r2-multipart.ts#L32) <code v-pre>packages/edge/src/semantics/r2-multipart.ts</code>

Initiate a multipart upload with a known total part count. Emits `r2.multipart-initiated` and enters `initiated`.

```ts
export declare function initiateMultipart(input: {
    platform: EdgePlatform;
    uploadId: string;
    totalParts: number;
}): R2MultipartSession;
```

#### <code v-pre>uploadPart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/r2-multipart.ts#L64) <code v-pre>packages/edge/src/semantics/r2-multipart.ts</code>

Upload a single part with declared checksum. Transitions to `uploading` (first part) and emits `r2.part-uploaded`. Rejects if the part number is outside `[1, totalParts]`.

```ts
export declare function uploadPart(session: R2MultipartSession, input: {
    partNumber: number;
    sizeBytes: number;
    checksum: string;
}): AxisStep<R2State>;
```

#### <code v-pre>verifyChecksum</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/r2-multipart.ts#L104) <code v-pre>packages/edge/src/semantics/r2-multipart.ts</code>

Verify part checksum by comparing against expected. If mismatch, transitions to `checksum-failed` and requires the part to be re-uploaded. On match, marks verified and emits `r2.checksum-verified`.

```ts
export declare function verifyChecksum(session: R2MultipartSession, input: {
    partNumber: number;
    expected: string;
}): AxisStep<R2State>;
```

### 型

#### <code v-pre>R2MultipartSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/r2-multipart.ts#L19) <code v-pre>packages/edge/src/semantics/r2-multipart.ts</code>

```ts
export interface R2MultipartSession {
    platform: EdgePlatform;
    uploadId: string;
    parts: Map<number, R2Part>;
    totalParts: number;
    state: R2State;
    history: AxisStep<R2State>[];
}
```

#### <code v-pre>R2Part</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/r2-multipart.ts#L12) <code v-pre>packages/edge/src/semantics/r2-multipart.ts</code>

```ts
export interface R2Part {
    partNumber: number;
    sizeBytes: number;
    checksum: string;
    verified: boolean;
}
```

#### <code v-pre>R2State</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/r2-multipart.ts#L10) <code v-pre>packages/edge/src/semantics/r2-multipart.ts</code>

R2 multipart upload axis — resumable object storage upload flow. Real R2 / S3-compatible stores split large objects into ordered parts (5MB+ each), verify each part checksum, and commit on completion. The helper tracks per-part state and aggregate integrity so failed uploads can be resumed from the last verified part.

```ts
export type R2State = 'initiated' | 'uploading' | 'checksum-failed' | 'completed' | 'aborted';
```
