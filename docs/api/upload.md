# @kiwa-lab/upload API reference

## Overview

`@kiwa-lab/upload` は S3 / GCS / R2 / Cloudinary 4 provider を統一 interface で mock する object storage upload test infra。 multipart chunked upload / presigned URL / checksum 検証を real bucket 接続なしで叩ける。

## Supported providers

| provider | presigned expiry (default) | multipart part size | checksum |
|---|---|---|---|
| s3 | 3600s | 5 MiB min | MD5 / SHA256 |
| gcs | 3600s | 8 MiB min | CRC32C / MD5 |
| r2 | 3600s | 5 MiB min | SHA256 |
| cloudinary | 3600s | signed transformation | MD5 |

## Main API

### `createUploadClient(options: CreateUploadClientOptions): UploadClient`

provider 別 mock client、 `bucket` + `region` + `credentials` config。 `.upload(request)` / `.download(key)` / `.listObjects(prefix)` を提供。

### `createPresignedUrl(client, options: PresignedUrlOptions): PresignedUrlResult`

`{ operation: 'put'|'get'|'delete', key, expiresIn, contentType?, contentLength?, headers? }` を受け取り、 `{ url, method, headers, expiresAt }` を返す。 URL 署名 (mock hmac) 込み。

### `uploadMultipart(client, key, parts: MultipartPart[]): Promise<MultipartUploadResult>`

複数 chunk を multipart upload、 `{ uploadId, etag, parts: [{partNumber, etag, size}] }` を返す。 test で「N chunk で分割 upload された」 を verify。

### `verifyUpload(input: VerifyUploadInput): VerifyUploadResult`

upload 済 object の checksum + size を verify、 `{ valid, algorithm, expected, actual, sizeMatch }` を返す。

### `computeChecksum(data: Uint8Array | string, algorithm: ChecksumAlgorithm): string`

md5 / sha256 / crc32c / sha1 の checksum を計算、 hex string で返す。

## Types

- `UploadProvider = 's3' | 'gcs' | 'r2' | 'cloudinary'`
- `UploadRequest` = `{ key, data, contentType?, metadata?, checksum? }`
- `UploadResult` = `{ key, url, etag, size, uploadedAt, checksum? }`
- `PresignedOperation = 'put' | 'get' | 'delete'`
- `ChecksumAlgorithm = 'md5' | 'sha256' | 'crc32c' | 'sha1'`

## Usage examples

### Presigned PUT URL 発行 → upload → verify

```typescript
import { createUploadClient, createPresignedUrl, verifyUpload } from '@kiwa-lab/upload';
import { describe, expect, it } from 'vitest';

describe('avatar upload flow', () => {
  it('presigned URL 経由で 100KB PNG upload + checksum verify', async () => {
    const client = createUploadClient({ provider: 's3', bucket: 'avatars' });
    const presigned = createPresignedUrl(client, {
      operation: 'put',
      key: 'user-1/avatar.png',
      expiresIn: 3600,
      contentType: 'image/png',
    });
    expect(presigned.url).toContain('avatars');
    const data = new Uint8Array(100_000);
    await client.upload({ key: 'user-1/avatar.png', data, contentType: 'image/png' });
    const verify = verifyUpload({ client, key: 'user-1/avatar.png', expectedSize: 100_000, algorithm: 'md5' });
    expect(verify.valid).toBe(true);
  });
});
```

### Multipart upload (5 chunk)

```typescript
import { createUploadClient, uploadMultipart } from '@kiwa-lab/upload';

const client = createUploadClient({ provider: 'r2', bucket: 'videos' });
const parts = Array.from({ length: 5 }, (_, i) => ({
  partNumber: i + 1,
  data: new Uint8Array(5 * 1024 * 1024),
}));
const result = await uploadMultipart(client, 'lecture-1.mp4', parts);
console.log(result.uploadId, result.etag, result.parts.length); // "up-1" "etag-final" 5
```

## Related skills

- [`/kiwa-upload`](../skills/kiwa-upload) — upload test 生成 skill
