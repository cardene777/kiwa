# @kiwa-lab/crypto API reference

## Overview

`@kiwa-lab/crypto` は JWT (RS256/HS256/ES256) / RSA / AES (CBC/GCM) / hash (SHA / BLAKE2) / HMAC / X.509 cert parse を統一 interface で扱う cryptographic test infra。 内部は `node:crypto` を wrap した薄い layer で、 test 時の決定性 (deterministic KID / nonce) を担保する。

## Supported operations

| category | algorithms |
|---|---|
| JWT | HS256 / HS384 / HS512 / RS256 / RS384 / RS512 / ES256 / ES384 |
| RSA | sign / verify / encrypt / decrypt / generateKeyPair (2048/3072/4096) |
| AES | encrypt / decrypt (CBC + GCM、 128/192/256 bit) |
| Hash | sha1 / sha256 / sha384 / sha512 / blake2b |
| HMAC | sha1 / sha256 / sha512 |
| X.509 | parse (issuer / subject / notBefore / notAfter / SAN) |
| KeyPair | RSA / EC (P-256/P-384/P-521) |

## Main API

### `signJWT(payload: JWTPayload, secret, options: { algorithm, header? }): string`

JWT を発行、 `{ alg, typ, kid? }` header + payload + signature の 3 part を base64url join。

### `verifyJWT(token: string, secret, options: { algorithms }): JWTVerifyResult`

`{ valid, payload?, header?, error? }` を返す。 alg 一致 chk + signature verify + exp / nbf / iat の時刻 chk。

### `rsaSign(data, privateKey): Buffer` / `rsaVerify(data, signature, publicKey): RsaVerifyResult`

RSA-PSS 相当の署名 / 検証。

### `aesEncrypt(data, key, mode: AesMode, iv?): AesEncryptResult` / `aesDecrypt(ciphertext, key, mode, iv?): Buffer`

CBC / GCM 対応、 `{ ciphertext, iv, authTag? }`。 GCM は authTag 必須。

### `hashData(data, algorithm: HashAlgorithm): string`

hex string で hash を返す。

### `hmacDigest(data, key, algorithm: HmacAlgorithm): string`

HMAC hex digest。

### `parseX509(pemOrDer: string | Buffer): X509CertInfo`

`{ issuer, subject, notBefore, notAfter, serialNumber, san?, publicKey? }`。

### `generateKeyPair(type: KeyPairType, options?): KeyPairResult`

`{ publicKey, privateKey, jwk? }` を返す。

## Types

- `JWTAlgorithm = 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512' | 'ES256' | 'ES384'`
- `JWTPayload` = `{ iss?, sub?, aud?, exp?, nbf?, iat?, jti?, [key: string]: unknown }`
- `AesMode = 'cbc' | 'gcm'`
- `HashAlgorithm = 'sha1' | 'sha256' | 'sha384' | 'sha512' | 'blake2b'`
- `KeyPairType = 'rsa-2048' | 'rsa-3072' | 'rsa-4096' | 'ec-p256' | 'ec-p384'`

## Usage examples

### JWT sign + verify (RS256)

```typescript
import { signJWT, verifyJWT, generateKeyPair } from '@kiwa-lab/crypto';
import { describe, expect, it } from 'vitest';

describe('access token', () => {
  it('RS256 で sign + verify', () => {
    const { publicKey, privateKey } = generateKeyPair('rsa-2048');
    const token = signJWT(
      { sub: 'user-1', exp: Math.floor(Date.now() / 1000) + 3600 },
      privateKey,
      { algorithm: 'RS256', header: { kid: 'k1' } },
    );
    const result = verifyJWT(token, publicKey, { algorithms: ['RS256'] });
    expect(result.valid).toBe(true);
    expect(result.payload.sub).toBe('user-1');
  });
});
```

### AES-GCM encrypt / decrypt

```typescript
import { aesEncrypt, aesDecrypt, hashData } from '@kiwa-lab/crypto';

const key = Buffer.alloc(32, 'k'); // 256 bit
const plaintext = 'secret payload';
const { ciphertext, iv, authTag } = aesEncrypt(plaintext, key, 'gcm');
const decrypted = aesDecrypt(ciphertext, key, 'gcm', iv, authTag).toString();
expect(decrypted).toBe(plaintext);
console.log(hashData(plaintext, 'sha256'));
```

## Related skills

- [`/kiwa-crypto`](../skills/kiwa-crypto) — crypto test 生成 skill
