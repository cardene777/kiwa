# @kiwa-lab/crypto リファレンス

## JWT

`signJWT` は HS256、RS256、ES256 で token を署名します。`verifyJWT` は signature と claim を検証し、`JWTVerifyResult` を返します。payload を認可に使う前に `valid` を確認します。

## encryption と signature

`aesEncrypt` と `aesDecrypt` は CBC と GCM を扱います。GCM の encryption result は ciphertext、iv、auth tag を返し、復号時にすべて必要です。`rsaSign` と `rsaVerify` は RSA signature、`rsaEncrypt` と `rsaDecrypt` は RSA encryption を扱います。`ed25519Sign` と `ed25519Verify` は Ed25519 signature、`x25519Ecdh` は鍵共有を扱います。

## digest と key

`hashData` は sha256、sha512、blake2 を計算します。`hmacDigest` は sha256 と sha512 の HMAC を計算します。`deriveKey` と `verifyPassword` は KDF を扱います。`generateRsaKeyPair` と `generateKeyPair` は test 用の key pair を作ります。

## 証明書と stream

`parseX509` は PEM certificate の metadata を返します。`streamEncrypt` と `streamDecrypt` は stream cipher の結果を扱います。certificate の trust chain verification と production certificate management は対象外です。

## 制約

AES 256 は 32 byte、AES 128 は 16 byte の key だけを受け付けます。外部接続は作りませんが、鍵素材を test ごとに分離し、plain text と secret を log に出さない責任は呼び出し側にあります。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>invalid key length for $&#123;mode&#125;: expected $&#123;expected&#125; bytes, got $&#123;key.length&#125;</code> | [packages/crypto/src/aes.ts](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/aes.ts#L22) |
| <code v-pre>authTag required for GCM decryption</code> | [packages/crypto/src/aes.ts](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/aes.ts#L42) |
| <code v-pre>unsupported algorithm: $&#123;algorithm&#125;</code> | [packages/crypto/src/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/jwt.ts#L53) |
| <code v-pre>unsupported key type: $&#123;type&#125;</code> | [packages/crypto/src/keypair.ts](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/keypair.ts#L35) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [aes.ts](./api/aes) | 2 | 2 |
| [ed25519.ts](./api/ed25519) | 3 | 3 |
| [hash.ts](./api/hash) | 2 | 2 |
| [jwt.ts](./api/jwt) | 2 | 3 |
| [kdf.ts](./api/kdf) | 2 | 3 |
| [keypair.ts](./api/keypair) | 1 | 2 |
| [rsa.ts](./api/rsa) | 5 | 1 |
| [stream.ts](./api/stream) | 2 | 2 |
| [x509.ts](./api/x509) | 1 | 1 |

<!-- kiwa-public-api:end -->
