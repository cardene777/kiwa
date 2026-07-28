# @kiwa-lab/crypto

`@kiwa-lab/crypto` は JWT、RSA、AES、hash、HMAC、X.509、KDF、Ed25519、X25519 を扱うコードをテストするための Node.js crypto wrapper です。暗号方式そのものを実装するためではなく、アプリケーションが署名、復号、token verification の結果を安全に扱うことを確認します。

<img src="/images/kiwa-docs/services/crypto-overview.webp" alt="署名したデータを検証して有効または拒否を判定する流れ" width="1747" height="900" loading="lazy" decoding="async">

## 対象にする境界

JWT では署名と claim verification、AES では ciphertext と integrity、RSA と Ed25519 では signature verification、X25519 では鍵共有を確認します。test では成功する round trip と、secret、signature、ciphertext を改変した拒否ケースを分けます。

## 使う場面

認証 token、Webhook signature、暗号化した application data、password-derived key を扱う機能を test するときに使います。入力、algorithm、key material を fixture として明示し、期待する plaintext や verify result を assertion します。

## 使わない場面

鍵管理サービス、HSM、証明書 trust chain、production secret の配布を置き換えるものではありません。実運用の key と連携する test は隔離された環境で実行し、このパッケージの fixture に production secret を保存しないでください。

## primitive を選ぶ

JWT は `signJWT` と `verifyJWT`、共有鍵暗号は `aesEncrypt` と `aesDecrypt`、message authenticity は `hmacDigest`、公開鍵署名は RSA または Ed25519 を使います。AES GCM の復号には ciphertext、iv、auth tag が必要です。

## lifecycle

connection や background process は作りません。cleanup の対象は呼び出し側が作った test key、平文、stream です。secret をログ、snapshot、共有 fixture に残さないでください。

## 次に読む

[はじめる](./quickstart) では HS256 JWT の署名と拒否を確認します。[使い方](./how-to) では AES GCM の改ざん検知と password verification を扱います。primitive ごとの key length、戻り値、失敗条件は [リファレンス](./reference) を参照してください。
