# @kiwa-lab/crypto

Cryptographic operation harness for kiwa — JWT / RSA / AES / hash / HMAC / X.509 を統一 interface で叩ける test infra (node:crypto ラッパー)。

## Installation

```bash
pnpm add -D @kiwa-lab/crypto
# or
npm install -D @kiwa-lab/crypto
# or
yarn add -D @kiwa-lab/crypto
```

## Supported primitives

| Primitive | Algorithms | Primary API |
|---|---|---|
| JWT | HS256 / RS256 / ES256 | `signJWT` / `verifyJWT` |
| RSA | sign / verify / encrypt / decrypt | `rsaSign` / `rsaVerify` |
| AES | CBC / GCM | `aesEncrypt` / `aesDecrypt` |
| hash | sha256 / sha512 / blake2 | `hashData` |
| HMAC | sha256 / sha512 | `hmacDigest` |
| X.509 | parse | `parseX509` |

## Quick start

```ts
import { describe, expect, it } from 'vitest';
import { signJWT, verifyJWT, hashData, aesEncrypt, aesDecrypt } from '@kiwa-lab/crypto';

describe('auth pipeline', () => {
  it('JWT sign+verify + AES-GCM roundtrip', async () => {
    const token = signJWT({ sub: 'u-1' }, { algorithm: 'HS256', secret: 's' });
    const verified = verifyJWT(token, { algorithm: 'HS256', secret: 's' });
    expect(verified.valid).toBe(true);
    const key = hashData('password', { algorithm: 'sha256' }).slice(0, 32);
    const enc = aesEncrypt('payload', { mode: 'gcm', key });
    const dec = aesDecrypt(enc.ciphertext, { mode: 'gcm', key, iv: enc.iv, authTag: enc.authTag });
    expect(dec).toBe('payload');
  });
});
```

## API reference

- `signJWT(payload: JWTPayload, options): string` — HS256/RS256/ES256 sign
- `verifyJWT(token, options): JWTVerifyResult` — signature + claim 検証
- `rsaSign(data, { privateKey }) / rsaVerify(data, sig, { publicKey })` — RSA sign/verify
- `aesEncrypt(plaintext, { mode, key }) / aesDecrypt(ct, { mode, key, iv })` — CBC/GCM
- `hashData(input, { algorithm: HashAlgorithm }): string` — sha256/sha512/blake2
- `hmacDigest(data, { algorithm: HmacAlgorithm, secret }): string` — HMAC digest
- `parseX509(pem: string): X509CertInfo` — 証明書 metadata 抽出
- `generateKeyPair(type: KeyPairType): KeyPairResult` — RSA/EC keypair

## Test integration

vitest + `/kiwa-crypto` skill で auth / session / webhook signature の暗号処理を deterministic に verify。

## License

UNLICENSED — see [github.com/cardene777/kiwa](https://github.com/cardene777/kiwa).
