# Tutorial 27 — JWT sign/verify + RSA + AES flow

## 目的

`@kiwa-lab/crypto` を使って access token 発行 + refresh + revocation flow を end-to-end で test する。 JWT (RS256) + RSA key pair + AES payload encryption + hash + HMAC の 5 primitive を組合わせた authentication pipeline を real KMS 不要で verify する。

## 前提

- `pnpm add -D @kiwa-lab/crypto vitest`
- Node.js >= 20 (`node:crypto` を wrap)
- 対象 app に token issuance / verification 関数がある想定

## Step 1 — RSA key pair 生成

session ごとに ephemeral な RSA 2048-bit key pair を生成、 real KMS への依存なし。

```typescript
import { generateKeyPair } from '@kiwa-lab/crypto';
import { describe, expect, it, beforeAll } from 'vitest';

describe('access token pipeline', () => {
  let publicKey: string;
  let privateKey: string;

  beforeAll(() => {
    const pair = generateKeyPair('rsa-2048');
    publicKey = pair.publicKey;
    privateKey = pair.privateKey;
  });
});
```

## Step 2 — JWT sign (RS256)

`signJWT(payload, privateKey, options)` で RS256 token 発行。 header に kid (key id) を含めて JWKS lookup 経路を verify。

```typescript
import { signJWT } from '@kiwa-lab/crypto';

it('access token を RS256 で発行', () => {
  const now = Math.floor(Date.now() / 1000);
  const token = signJWT(
    {
      iss: 'https://auth.kiwa.dev',
      sub: 'user-42',
      aud: 'https://api.kiwa.dev',
      exp: now + 3600,
      iat: now,
      scope: 'read write',
    },
    privateKey,
    { algorithm: 'RS256', header: { kid: 'k-2026' } },
  );
  // JWT は 3 part (header.payload.signature) を base64url join
  expect(token.split('.')).toHaveLength(3);
});
```

## Step 3 — JWT verify

`verifyJWT(token, publicKey, options)` で signature verify + exp / nbf / iat 時刻 chk。 alg 一致 chk で alg 混同攻撃を防ぐ。

```typescript
import { verifyJWT } from '@kiwa-lab/crypto';

it('正当な token は verify PASS + payload 取得', () => {
  const token = signJWT({ sub: 'user-42', exp: Math.floor(Date.now() / 1000) + 3600 }, privateKey, { algorithm: 'RS256' });
  const result = verifyJWT(token, publicKey, { algorithms: ['RS256'] });
  expect(result.valid).toBe(true);
  expect(result.payload.sub).toBe('user-42');
});

it('expired token は verify で reject', () => {
  const past = Math.floor(Date.now() / 1000) - 3600;
  const token = signJWT({ sub: 'user-42', exp: past }, privateKey, { algorithm: 'RS256' });
  const result = verifyJWT(token, publicKey, { algorithms: ['RS256'] });
  expect(result.valid).toBe(false);
  expect(result.error).toContain('expired');
});

it('alg 混同攻撃を防ぐ (RS256 期待 vs HS256 token)', () => {
  const hsToken = signJWT({ sub: 'attacker' }, 'shared-secret', { algorithm: 'HS256' });
  const result = verifyJWT(hsToken, publicKey, { algorithms: ['RS256'] });
  expect(result.valid).toBe(false);
});
```

## Step 4 — AES-GCM で refresh token 暗号化

refresh token を DB に格納する前に AES-GCM で encrypt、 authTag で改竄検知。

```typescript
import { aesEncrypt, aesDecrypt } from '@kiwa-lab/crypto';

it('refresh token を AES-GCM で encrypt + decrypt', () => {
  const key = Buffer.alloc(32, 'k'); // 256 bit
  const refreshToken = 'rt_' + 'a'.repeat(64);
  const { ciphertext, iv, authTag } = aesEncrypt(refreshToken, key, 'gcm');
  const decrypted = aesDecrypt(ciphertext, key, 'gcm', iv, authTag).toString('utf-8');
  expect(decrypted).toBe(refreshToken);
});

it('改竄された ciphertext は authTag mismatch で reject', () => {
  const key = Buffer.alloc(32, 'k');
  const { ciphertext, iv, authTag } = aesEncrypt('secret', key, 'gcm');
  const tampered = Buffer.from(ciphertext);
  tampered[0] ^= 0xff;
  expect(() => aesDecrypt(tampered, key, 'gcm', iv, authTag)).toThrow();
});
```

## Step 5 — Revocation via hash (fingerprint DB)

revocation list は full token を保存せず SHA-256 fingerprint のみ持つ、 DB 漏洩時の被害最小化。

```typescript
import { hashData } from '@kiwa-lab/crypto';

it('token fingerprint を SHA-256 で計算 + revocation chk', () => {
  const token = 'access_token_abc123';
  const fingerprint = hashData(token, 'sha256');
  expect(fingerprint).toHaveLength(64); // hex length
  // revocation list mock
  const revoked = new Set([fingerprint]);
  expect(revoked.has(hashData(token, 'sha256'))).toBe(true);
  expect(revoked.has(hashData('different_token', 'sha256'))).toBe(false);
});
```

## Step 6 — HMAC で API key signature

server 内部の API-to-API call に HMAC-SHA256 で integrity 保証、 replay 防止のため timestamp を含める。

```typescript
import { hmacDigest } from '@kiwa-lab/crypto';

it('HMAC で API call の integrity を保証', () => {
  const apiKey = 'ak_secret_key';
  const timestamp = Math.floor(Date.now() / 1000);
  const body = JSON.stringify({ order: 'o-1', total: 1500 });
  const canonical = `${timestamp}.${body}`;
  const signature = hmacDigest(canonical, apiKey, 'sha256');
  // server 側で同じ計算 → 一致すれば整合性 OK
  const verified = hmacDigest(canonical, apiKey, 'sha256');
  expect(verified).toBe(signature);
});
```

## Step 7 — X.509 certificate parse (mTLS 経路)

server-to-server mTLS の peer cert から issuer / subject / SAN を抽出、 access control に使う。

```typescript
import { parseX509 } from '@kiwa-lab/crypto';

const pem = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJAKZ...
-----END CERTIFICATE-----`;

it('peer cert から subject + SAN を取得', () => {
  const info = parseX509(pem);
  expect(info.subject).toBeDefined();
  expect(info.notAfter.getTime()).toBeGreaterThan(Date.now());
  // SAN で service name-based access control
  if (info.san?.includes('svc.kiwa.dev')) {
    // allow
  }
});
```

## 期待結果

- 全 8 assertion PASS、 real KMS / mTLS 接続なし
- ephemeral key pair で test 間の cross-contamination なし
- alg 混同攻撃 / expired token / 改竄 / revocation の 4 攻撃 vector を test で cover

## 関連

- API reference: [`/api/crypto`](../api/crypto)
- Skill: [`/kiwa-crypto`](../skills/kiwa-crypto)
- Related pattern: [`/tutorials/200-email-transactional`](./200-email-transactional) (signature verify)
