---
name: kiwa-upload
description: |
  @kiwa-lab/upload (S3 / GCS / R2 / Cloudinary 統一 mock harness) を使った object storage upload 経路の test 生成 skill。
  `createUploadClient` + `createPresignedUrl` で presigned PUT/GET、 `uploadMultipart` で chunked upload、 `verifyUpload` で checksum + size 検証を in-process で叩ける。 real bucket に接続せず upload workflow の test を書く。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-upload — object storage upload test 生成

`@kiwa-lab/upload` の 4 provider (S3 / GCS / R2 / Cloudinary) 統一 mock を使った upload test を Vitest 形式で生成する。 実 bucket 不要で multipart / presigned URL / checksum verify の test を書く。

## 目的

user avatar upload / bulk import / video upload 等 file upload workflow で「browser → presigned URL → multipart chunks → checksum verify → success record」 の完全 path を test 化する。 provider 差 (S3 CompleteMultipartUpload / GCS resumable / R2 same as S3 / Cloudinary API) を吸収した抽象。

## 前提

- `pnpm add -D @kiwa-lab/upload` install 済
- Vitest 環境
- 対象 module に upload 経路 (frontend upload input + server-side signer 等) が存在

## オプション

- `--module {name}` — test 対象 module (avatar-upload / bulk-import / video 等)
- `--provider {s3|gcs|r2|cloudinary}` — 主要 provider (省略時 = 4 provider 全対応)
- `--output {path}` — 生成 test の path

## 実行フロー

### Step 1: presigned URL test 生成

`createPresignedUrl({ provider, bucket, key, expiresIn: 300 })` で URL を生成、 return の `url` / `method` / `headers` / `expiresAt` を assert。 provider 別 URL format (S3 = `x-amz-*` query / GCS = signed) を cover。

### Step 2: multipart upload test 生成

`createUploadClient({ provider })` + `uploadMultipart(client, [part1, part2, part3])` で chunked upload、 全 part upload 完了後の `record` の checksum を verify。 part fail → retry path も追加。

### Step 3: checksum verify test 生成

`verifyUpload(record, { checksum: 'sha256:...', size: 1024 })` の真偽を assert。 checksum mismatch / size mismatch / both mismatch の 3 failure path を it.each で cover。

## 使用例

```bash
/kiwa-upload --module avatar-upload --provider s3
/kiwa-upload --module bulk-import --output tests/integration/bulk-import.upload.test.ts
```
