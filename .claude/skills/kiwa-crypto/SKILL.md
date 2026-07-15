---
name: kiwa-crypto
description: |
  @kiwa-lab/crypto (JWT / RSA / AES / hash / HMAC / X.509 統一 mock harness) を使った cryptographic operation test 生成 skill。
  `signJWT` / `verifyJWT` (HS256/RS256/ES256) / `rsaSign` + `rsaVerify` / `aesEncrypt` + `aesDecrypt` (CBC/GCM) / `hashData` / `hmacDigest` / `parseX509` / `generateKeyPair` を統一 interface で叩ける (node:crypto ラッパー)。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-crypto — cryptographic operation test 生成

`@kiwa-lab/crypto` の 6 category (JWT / RSA / AES / hash / HMAC / X.509) primitive を使った crypto test を Vitest 形式で生成する。

## 目的

crypto operation を algorithm 差 (HS256 vs RS256 vs ES256、 CBC vs GCM、 sha256 vs sha512 vs blake2b) を含めて network 呼出なしで verify する。 認証 / 署名検証 / 暗号化 / hash-based ID の contract を test 化する。

## 前提

- `pnpm add -D @kiwa-lab/crypto` install 済
- Vitest 環境
- 対象 module に crypto operation (JWT auth / RSA signing / AES 保護 / hash 生成) が存在

## オプション

- `--module {name}` — test 対象 module
- `--category {jwt|rsa|aes|hash|hmac|x509}` — 主要 category
- `--output {path}` — 生成 test path

## 実行フロー

### Step 1: JWT sign + verify workflow test 生成

`signJWT({ sub: 'user-1' }, secret, 'HS256')` で token 生成、 `verifyJWT(token, secret, 'HS256')` で payload 復元 assert。 3 algorithm (HS256 / RS256 / ES256) を it.each で cover、 expired token / invalid signature の failure path 追加。

### Step 2: AES / RSA encrypt round-trip test 生成

`aesEncrypt(plaintext, key, 'GCM')` → `aesDecrypt(cipher, key, 'GCM')` の round-trip 一致 verify。 RSA `rsaSign` + `rsaVerify` は `generateKeyPair('rsa')` で key pair 生成後、 sign → verify の pair 動作を it.each で 5 case cover。

### Step 3: hash / HMAC / X.509 test 生成

`hashData(data, 'sha256')` の deterministic 出力、 `hmacDigest(data, secret, 'sha256')` の HMAC 生成、 `parseX509(pem)` の subject / issuer / validity 抽出を it で cover。

## 使用例

```bash
/kiwa-crypto --module auth --category jwt --output tests/integration/auth.crypto.test.ts
/kiwa-crypto --module encryption --category aes
```
