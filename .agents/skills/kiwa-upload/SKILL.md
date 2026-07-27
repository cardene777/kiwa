---
name: kiwa-upload
description: |
  @kiwa-lab/upload を使って application の object upload workflow を test にする skill。
  presigned URL shape、multipart の結合、checksum、サイズ制限と保存後の状態を process 内で確認する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-upload upload test を作る

`@kiwa-lab/upload` は S3、GCS、R2、Cloudinary の実 bucket へ接続しない。application が選ぶ bucket、key、body、容量制限と、保存後に object が存在するかを test する harness である。

## 入力と出力

`--module` は対象名、`--provider` は `s3`、`gcs`、`r2`、`cloudinary` のいずれか、`--output` は test file の path を指定する。出力先を省略したときは `tests/{module}.upload.test.ts` を使う。実 application にある key naming、size limit、content type、失敗時の処理を input として使う。

## 生成する test

single upload は `createUploadClient` と `client.upload` を使い、result の status だけでなく `client.get(bucket, key)` で保存結果を確認する。size limit の失敗では object が存在しないことを assertion に含める。

presigned URL は `createPresignedUrl` で作り、provider、bucket、key、operation を確認する。URL は実署名ではない。multipart は `uploadMultipart` に part number と Buffer を渡し、結果の part count、total size、復元した object body を確認する。`verifyUpload` は渡した body の checksum と size を比較する helper である。

## 実行と確認

生成後は output file を読み、bucket、key、サイズ上限が application の値と一致し、失敗時に後続処理が object を参照しないことを確認する。作成した file だけを実行する。

```bash
pnpm exec vitest run {output}
```

IAM policy、credential、CORS、URL expiry、実 provider retry、resumable session、virus scan は実 storage integration test で確認する。

## 実行例

```text
/kiwa:kiwa-upload --module avatar-upload --provider s3 --output tests/avatar-upload.upload.test.ts
/kiwa:kiwa-upload --module export-file --provider r2 --output tests/export-file.upload.test.ts
```
