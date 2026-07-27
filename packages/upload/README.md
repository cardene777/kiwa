# @kiwa-lab/upload

Object storage upload mock harness for kiwa — S3 / GCS / R2 / Cloudinary の upload + presigned URL + multipart + checksum を in-process で叩く test infra。

## Installation

```bash
pnpm add -D @kiwa-lab/upload
# or
npm install -D @kiwa-lab/upload
# or
yarn add -D @kiwa-lab/upload
```

## Supported providers

| Provider | Status | ID prefix | Presign |
|---|---|---|---|
| AWS S3 | ✅ | `s3-` | ✅ |
| GCS | ✅ | `gcs-` | ✅ |
| Cloudflare R2 | ✅ | `r2-` | ✅ |
| Cloudinary | ✅ | `cld-` | ✅ |

## Quick start

```ts
import { createUploadClient, createPresignedUrl, verifyUpload } from '@kiwa-lab/upload';

const client = createUploadClient({ provider: 's3', maxSizeBytes: 5 * 1024 * 1024 });

const result = await client.upload({
  bucket: 'user-avatars', key: 'u1/avatar.png',
  body: Buffer.from('image-bytes'), contentType: 'image/png',
});
// result = { id: 's3-1', status: 'uploaded', size, etag, ... }

const url = createPresignedUrl({
  provider: 's3', operation: 'put', bucket: 'x', key: 'y', expiresInSec: 3600, secret: 'k',
});

const verify = verifyUpload({ body: Buffer.from('data'), expectedChecksum: 'sha256:...' });
```

## API reference

- `createUploadClient(options?: CreateUploadClientOptions): UploadClient` — provider mock client 生成
- `UploadClient.upload(req: UploadRequest): Promise<UploadResult>` — 1 object upload (queued 経路)
- `UploadClient.get(bucket, key): UploadedObjectRecord | undefined` — 既 upload 取得
- `UploadClient.list(bucket): UploadedObjectRecord[]` — bucket 内一覧
- `createPresignedUrl(options: PresignedUrlOptions): PresignedUrlResult` — presigned PUT/GET URL 生成
- `uploadMultipart(client, req, parts): Promise<MultipartUploadResult>` — chunked upload
- `verifyUpload(input): VerifyUploadResult` / `computeChecksum(body, algo)` — checksum 検証

## Test integration

```ts
import { describe, expect, it } from 'vitest';
import { createUploadClient } from '@kiwa-lab/upload';

describe('avatar upload', () => {
  it('小 file が uploaded', async () => {
    const c = createUploadClient({ provider: 's3' });
    const r = await c.upload({ bucket: 'a', key: 'k', body: Buffer.from('x') });
    expect(r.status).toBe('uploaded');
  });
});
```

`/kiwa-upload` skill を起動すると multipart + presigned + checksum 3 経路の test を生成できる。

<!-- kiwa-docs:start -->
## Documentation

公開ドキュメントを正本として管理しています。

- [概要](https://cardene777.github.io/kiwa/libraries/services/upload/)
- [はじめる](https://cardene777.github.io/kiwa/libraries/services/upload/quickstart)
- [使い方](https://cardene777.github.io/kiwa/libraries/services/upload/how-to)
- [リファレンス](https://cardene777.github.io/kiwa/libraries/services/upload/reference)

編集元は [docs/libraries/services/upload](../../docs/libraries/services/upload/) です。
<!-- kiwa-docs:end -->

## License

UNLICENSED — see [cardene777/kiwa](https://github.com/cardene777/kiwa) for repo terms.
