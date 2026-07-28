# @kiwa-lab/upload

`@kiwa-lab/upload` は、S3、GCS、Cloudflare R2、Cloudinary に送る upload request の契約を、外部ストレージへ接続せずに test する harness です。object を保存した後に get で取得できること、サイズ上限を超えた object が残らないこと、multipart の part が順に結合されることを確認できます。

<img src="/images/kiwa-docs/services/upload-overview.webp" alt="ファイルを検証して保存しURLを発行する流れ" width="1693" height="929" loading="lazy" decoding="async">

## 保存前の validation と保存後の状態を確認する

client は bucket、key、body を受け取り、許可されたサイズなら in-memory object store に保存します。結果の status だけでなく、`get` で object があることを確認すると、保存前の validation と保存後の後続処理を分けずに test できます。サイズ超過では failure result を返し、object は作りません。

presigned URL、checksum、multipart upload も同じ境界を test できます。ただし、URL は IAM policy、CORS、expiry、実署名を証明しません。provider の actual PUT、virus scan、network retry、resumable upload は実際の storage integration environment で確認してください。

## 使う場面

アバター、添付ファイル、export file の upload を実装し、アプリケーションが正しい bucket、key、容量制限、後処理を選ぶことを固定したい場合に使います。非同期の後処理は [queue](../queue/)、アクセス権の判断は [auth](../auth/) と組み合わせます。

## 読み進める

[Quickstart](./quickstart) では object を保存し、拒否された object が残らないことを確認します。[使い方](./how-to) では presigned URL、multipart、checksum を扱います。すべての API は [リファレンス](./reference) にあります。
