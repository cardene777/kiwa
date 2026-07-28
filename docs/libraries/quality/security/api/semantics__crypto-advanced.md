---
title: "@kiwa-lab/security semantics__crypto-advanced の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/security</code> <code v-pre>semantics&#95;&#95;crypto-advanced</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>deriveKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L105) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export declare function deriveKey(session: CryptoSession, input: KdfInput): AxisAdvStep<CryptoState>;
```

#### <code v-pre>encapsulatePq</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L176) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export declare function encapsulatePq(session: CryptoSession, input: PqKemInput): AxisAdvStep<CryptoState>;
```

#### <code v-pre>rotateKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L139) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export declare function rotateKey(session: CryptoSession, input: KeyRotationInput): AxisAdvStep<CryptoState>;
```

#### <code v-pre>sealAead</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L89) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export declare function sealAead(session: CryptoSession, input: AeadInput): AxisAdvStep<CryptoState>;
```

#### <code v-pre>signWithHsm</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L158) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export declare function signWithHsm(session: CryptoSession, input: HsmSignInput): AxisAdvStep<CryptoState>;
```

#### <code v-pre>startCryptoSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L73) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export declare function startCryptoSession(input: {
    target: SecurityAdvTarget;
    sessionId: string;
}): CryptoSession;
```

#### <code v-pre>wrapEnvelope</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L124) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export declare function wrapEnvelope(session: CryptoSession, input: EnvelopeInput): AxisAdvStep<CryptoState>;
```

### 型

#### <code v-pre>AeadAlgo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L16) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

Cryptography advanced axis — AEAD + KDF + envelope encryption + key rotation + HSM signing + post-quantum KEM state machine。 Deterministic mock で 6 signal 系統を提供。 real driver 経路では Vault transit engine や AWS KMS / GCP KMS に対して encryption を発火する。

```ts
export type AeadAlgo = 'AES-256-GCM' | 'ChaCha20-Poly1305' | 'AES-256-GCM-SIV';
```

#### <code v-pre>AeadInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L37) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export interface AeadInput {
    algo: AeadAlgo;
    plaintextLen: number;
    aadLen: number;
}
```

#### <code v-pre>CryptoSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L29) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export interface CryptoSession {
    target: SecurityAdvTarget;
    sessionId: string;
    state: CryptoState;
    history: AxisAdvStep<CryptoState>[];
    currentKeyId: string | null;
}
```

#### <code v-pre>CryptoState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L20) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export type CryptoState = 'idle' | 'aead-sealed' | 'kdf-derived' | 'envelope-wrapped' | 'key-rotated' | 'hsm-signed' | 'pq-encapsulated';
```

#### <code v-pre>EnvelopeInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L50) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export interface EnvelopeInput {
    cek: string;
    kek: string;
    masterKeyProvider: 'kms' | 'vault' | 'hsm';
}
```

#### <code v-pre>HsmSignInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L62) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export interface HsmSignInput {
    keyId: string;
    digest: string;
    algorithm: 'ECDSA-P256' | 'RSA-PSS-2048' | 'Ed25519';
}
```

#### <code v-pre>KdfAlgo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L17) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export type KdfAlgo = 'HKDF-SHA256' | 'HKDF-SHA512' | 'PBKDF2' | 'Argon2id' | 'scrypt';
```

#### <code v-pre>KdfInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L43) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export interface KdfInput {
    algo: KdfAlgo;
    saltLen: number;
    info: string;
    iterations: number;
}
```

#### <code v-pre>KeyRotationInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L56) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export interface KeyRotationInput {
    oldKeyId: string;
    newKeyId: string;
    reason: 'scheduled' | 'compromised' | 'policy';
}
```

#### <code v-pre>PqKemAlgo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L18) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export type PqKemAlgo = 'ML-KEM-768' | 'ML-KEM-1024' | 'Kyber768';
```

#### <code v-pre>PqKemInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/semantics/crypto-advanced.ts#L68) <code v-pre>packages/security/src/semantics/crypto-advanced.ts</code>

```ts
export interface PqKemInput {
    algo: PqKemAlgo;
    publicKeyLen: number;
}
```
