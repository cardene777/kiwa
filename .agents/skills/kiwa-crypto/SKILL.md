---
name: kiwa-crypto
description: |
  @kiwa-lab/crypto を使って JWT、AES、RSA、HMAC、KDF の application-level test を作る skill。
  成功する verification と改ざんや不一致を拒否する failure case を対にして確認する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-crypto crypto test を作る

`@kiwa-lab/crypto` は key management service、HSM、production secret を置き換えない。application が token、signature、ciphertext、password-derived key をどう検証するかを Node.js crypto を使って test する library である。

## 入力と出力

`--module` は対象名、`--category` は `jwt`、`rsa`、`aes`、`hash`、`hmac`、`x509` のいずれか、`--output` は test file の path を指定する。出力先を省略したときは `tests/{module}.crypto.test.ts` を使う。fixture には test 専用の key material だけを使う。

## 生成する test

JWT では `signJWT` と `verifyJWT` を使い、valid result の payload と、secret または algorithm が違う failure result を確認する。AES GCM では `aesEncrypt` と `aesDecrypt` の round trip と、auth tag の改変による拒否を確認する。password は `deriveKey` と `verifyPassword`、Webhook signature は `hmacDigest` を使う。

RSA や Ed25519 を使う application では test 用 key pair をその場で作り、sign と verify の対を確認する。private key、plain password、decrypted data、production secret を output、snapshot、log に残さない。

## 実行と確認

生成後は output file を読み、algorithm、key type、failure case、payload を利用する前の verify が application の security policy と一致することを確認する。次に output だけを実行する。

```bash
pnpm exec vitest run {output}
```

KMS、HSM、key rotation、X.509 trust chain、JWT expiry、transport security は実運用に近い隔離環境の security test で確認する。

## 実行例

```text
/kiwa:kiwa-crypto --module auth --category jwt --output tests/auth.crypto.test.ts
/kiwa:kiwa-crypto --module encrypted-note --category aes --output tests/encrypted-note.crypto.test.ts
```
