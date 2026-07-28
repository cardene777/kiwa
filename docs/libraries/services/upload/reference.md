# @kiwa-lab/upload リファレンス

オブジェクトストレージ mock の公開 API です。最初の保存と拒否は [Quickstart](./quickstart)、presigned URL、multipart、checksum は [使い方](./how-to) で実行できます。この page では、保存状態を変える API と、入力だけを検証する API を区別して確認してください。

## 操作の入口

`createUploadClient` は S3、GCS、R2、Cloudinary 名の in-memory client を作ります。`UploadClient.upload`、`get`、`list`、`delete` はその client の object store を操作します。`clear` は object をすべて消すため、test の後始末または shared client の再利用前に使います。

`createPresignedUrl` は PUT または GET 用の URL shape を作りますが、URL を使って object を保存しません。`uploadMultipart` は part を並べ替えて結合し、最後に一つの object を保存します。`verifyUpload` と `computeChecksum` は渡した body を比較する API で、store から object を読む API ではありません。

## 設定

`provider` に S3、GCS、R2、Cloudinary を指定します。`maxSizeBytes` でアップロードの最大サイズを設定できます。

`upload` の失敗は throw ではなく `status: "failed"` の result を返します。`failOn` または最大サイズを超える場合は store に記録されません。`clear` は保存済み object をすべて消去します。

`uploadMultipart(client, bucket, key, parts, contentType)` は part の配列を受け取ります。README のような request object を引数に取る API ではありません。

## 後始末

外部接続は作りません。client はテストごとに作成してください。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>uploadMultipart: parts must not be empty</code> | [packages/upload/src/multipart.ts](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/multipart.ts#L28) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/upload/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [checksum.ts](./api/checksum) | 2 | 3 |
| [client.ts](./api/client) | 1 | 6 |
| [enhancements.ts](./api/enhancements) | 7 | 10 |
| [multipart.ts](./api/multipart) | 1 | 2 |
| [presign.ts](./api/presign) | 1 | 3 |

<!-- kiwa-public-api:end -->
