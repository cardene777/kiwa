# @kiwa-lab/upload

Object storage upload provider mock harness for kiwa — S3 / GCS / R2 / Cloudinary を統一 interface で invoke する in-process mock。

## API

- `createUploadClient(options)` = provider mock client (upload / list / delete)
- `createPresignedUrl(options)` = provider 別 presigned PUT/GET URL 生成
- `uploadMultipart(client, parts)` = multipart chunked upload workflow
- `verifyUpload(record, expected)` = checksum + size 検証
