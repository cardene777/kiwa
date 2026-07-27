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
| `invalid key length for ${mode}: expected ${expected} bytes, got ${key.length}` | [packages/crypto/src/aes.ts](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/aes.ts#L22) |
| 'authTag required for GCM decryption' | [packages/crypto/src/aes.ts](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/aes.ts#L42) |
| `unsupported algorithm: ${algorithm}` | [packages/crypto/src/jwt.ts](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/jwt.ts#L53) |
| `unsupported key type: ${type}` | [packages/crypto/src/keypair.ts](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/keypair.ts#L35) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `aesDecrypt`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/aes.ts#L35) `packages/crypto/src/aes.ts`

```ts
export declare function aesDecrypt(input: {
    ciphertext: Buffer;
    iv: Buffer;
    authTag?: Buffer;
}, key: Buffer, mode?: AesMode): Buffer;
```

#### `aesEncrypt`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/aes.ts#L19) `packages/crypto/src/aes.ts`

```ts
export declare function aesEncrypt(plaintext: string | Buffer, key: Buffer, mode?: AesMode): AesEncryptResult;
```

#### `deriveKey`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/kdf.ts#L28) `packages/crypto/src/kdf.ts`

password → derived key の KDF ラッパー。 PBKDF2 と scrypt は node:crypto、 Argon2 は node:crypto 未対応のため scrypt を argon2-mock として代替 (bytes 契約は同一)。

```ts
export declare function deriveKey(password: string, opts?: KdfOptions): KdfResult;
```

#### `ed25519Sign`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/ed25519.ts#L12) `packages/crypto/src/ed25519.ts`

Ed25519 で data に署名。 PEM 形式の privateKey (generateKeyPair('ed25519') の出力) を受取り、 base64 signature を返す。 real Ed25519 実装は node:crypto 経路。

```ts
export declare function ed25519Sign(data: string, privateKeyPem: string): Ed25519SignResult;
```

#### `ed25519Verify`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/ed25519.ts#L23) `packages/crypto/src/ed25519.ts`

```ts
export declare function ed25519Verify(data: string, signatureBase64: string, publicKeyPem: string): Ed25519VerifyResult;
```

#### `generateKeyPair`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/keypair.ts#L11) `packages/crypto/src/keypair.ts`

```ts
export declare function generateKeyPair(type?: KeyPairType, options?: {
    modulusLength?: number;
    namedCurve?: string;
}): KeyPairResult;
```

#### `generateRsaKeyPair`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/rsa.ts#L47) `packages/crypto/src/rsa.ts`

```ts
export declare function generateRsaKeyPair(modulusLength?: number): {
    publicKey: string;
    privateKey: string;
};
```

#### `hashData`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/hash.ts#L7) `packages/crypto/src/hash.ts`

```ts
export declare function hashData(data: string | Buffer, algorithm?: HashAlgorithm, encoding?: 'hex' | 'base64' | 'binary'): string;
```

#### `hmacDigest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/hash.ts#L17) `packages/crypto/src/hash.ts`

```ts
export declare function hmacDigest(data: string | Buffer, secret: string | Buffer, algorithm?: HmacAlgorithm, encoding?: 'hex' | 'base64' | 'binary'): string;
```

#### `parseX509`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/x509.ts#L15) `packages/crypto/src/x509.ts`

```ts
export declare function parseX509(pem: string): X509CertInfo;
```

#### `rsaDecrypt`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/rsa.ts#L43) `packages/crypto/src/rsa.ts`

```ts
export declare function rsaDecrypt(cipher: Buffer, privateKey: KeyLike): Buffer;
```

#### `rsaEncrypt`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/rsa.ts#L38) `packages/crypto/src/rsa.ts`

```ts
export declare function rsaEncrypt(data: string | Buffer, publicKey: KeyLike): Buffer;
```

#### `rsaSign`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/rsa.ts#L15) `packages/crypto/src/rsa.ts`

```ts
export declare function rsaSign(data: string | Buffer, privateKey: KeyLike, algorithm?: string): Buffer;
```

#### `rsaVerify`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/rsa.ts#L21) `packages/crypto/src/rsa.ts`

```ts
export declare function rsaVerify(data: string | Buffer, signature: Buffer, publicKey: KeyLike, algorithm?: string): RsaVerifyResult;
```

#### `signJWT`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/jwt.ts#L37) `packages/crypto/src/jwt.ts`

```ts
export declare function signJWT(payload: JWTPayload, secret: string | KeyLike, algorithm?: JWTAlgorithm): string;
```

#### `streamDecrypt`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/stream.ts#L29) `packages/crypto/src/stream.ts`

```ts
export declare function streamDecrypt(result: StreamEncryptResult, key: Buffer): string;
```

#### `streamEncrypt`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/stream.ts#L16) `packages/crypto/src/stream.ts`

stream cipher (AES-CTR / ChaCha20-Poly1305) で byte 流を encrypt。 real TLS record layer / Signal Protocol の対称暗号 stream mode 相当。

```ts
export declare function streamEncrypt(plaintext: string, key: Buffer, algorithm?: StreamCipherAlgorithm): StreamEncryptResult;
```

#### `verifyJWT`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/jwt.ts#L58) `packages/crypto/src/jwt.ts`

```ts
export declare function verifyJWT(token: string, secret: string | KeyLike, algorithm?: JWTAlgorithm): JWTVerifyResult;
```

#### `verifyPassword`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/kdf.ts#L49) `packages/crypto/src/kdf.ts`

password + 既存 salt/params で KDF を再実行、 hashHex 一致で verification 成功。

```ts
export declare function verifyPassword(password: string, stored: KdfResult): boolean;
```

#### `x25519Ecdh`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/ed25519.ts#L37) `packages/crypto/src/ed25519.ts`

X25519 ECDH で共有秘密を導出。 real Signal Protocol / DTLS 相当の一時鍵交換を mock。

```ts
export declare function x25519Ecdh(privateKeyPem: string, remotePublicKeyPem: string): EcdhResult;
```

### 型

#### `AesEncryptResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/aes.ts#L5) `packages/crypto/src/aes.ts`

```ts
export interface AesEncryptResult {
    ciphertext: Buffer;
    iv: Buffer;
    authTag?: Buffer;
}
```

#### `AesMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/aes.ts#L3) `packages/crypto/src/aes.ts`

```ts
export type AesMode = 'aes-256-cbc' | 'aes-256-gcm' | 'aes-128-cbc' | 'aes-128-gcm';
```

#### `EcdhResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/ed25519.ts#L29) `packages/crypto/src/ed25519.ts`

```ts
export interface EcdhResult {
    sharedSecretHex: string;
    algorithm: 'x25519';
}
```

#### `Ed25519SignResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/ed25519.ts#L3) `packages/crypto/src/ed25519.ts`

```ts
export interface Ed25519SignResult {
    signature: string;
    algorithm: 'ed25519';
}
```

#### `Ed25519VerifyResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/ed25519.ts#L18) `packages/crypto/src/ed25519.ts`

```ts
export interface Ed25519VerifyResult {
    valid: boolean;
    algorithm: 'ed25519';
}
```

#### `HashAlgorithm`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/hash.ts#L3) `packages/crypto/src/hash.ts`

```ts
export type HashAlgorithm = 'sha256' | 'sha384' | 'sha512' | 'blake2b512' | 'blake2s256' | 'sha1' | 'md5';
```

#### `HmacAlgorithm`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/hash.ts#L5) `packages/crypto/src/hash.ts`

```ts
export type HmacAlgorithm = HashAlgorithm;
```

#### `JWTAlgorithm`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/jwt.ts#L3) `packages/crypto/src/jwt.ts`

```ts
export type JWTAlgorithm = 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512' | 'ES256';
```

#### `JWTPayload`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/jwt.ts#L5) `packages/crypto/src/jwt.ts`

```ts
export type JWTPayload = Record<string, unknown>;
```

#### `JWTVerifyResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/jwt.ts#L7) `packages/crypto/src/jwt.ts`

```ts
export interface JWTVerifyResult {
    valid: boolean;
    payload?: JWTPayload;
    algorithm: JWTAlgorithm;
    reason?: string;
}
```

#### `KdfAlgorithm`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/kdf.ts#L3) `packages/crypto/src/kdf.ts`

```ts
export type KdfAlgorithm = 'pbkdf2' | 'scrypt' | 'argon2-mock';
```

#### `KdfOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/kdf.ts#L5) `packages/crypto/src/kdf.ts`

```ts
export interface KdfOptions {
    algorithm?: KdfAlgorithm;
    saltBytes?: number;
    iterations?: number;
    keyLength?: number;
    digest?: 'sha256' | 'sha512';
    N?: number;
    r?: number;
    p?: number;
}
```

#### `KdfResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/kdf.ts#L16) `packages/crypto/src/kdf.ts`

```ts
export interface KdfResult {
    algorithm: KdfAlgorithm;
    hashHex: string;
    saltHex: string;
    iterations: number;
    keyLength: number;
}
```

#### `KeyPairResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/keypair.ts#L5) `packages/crypto/src/keypair.ts`

```ts
export interface KeyPairResult {
    publicKey: string;
    privateKey: string;
    type: KeyPairType;
}
```

#### `KeyPairType`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/keypair.ts#L3) `packages/crypto/src/keypair.ts`

```ts
export type KeyPairType = 'rsa' | 'ec' | 'ed25519';
```

#### `RsaVerifyResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/rsa.ts#L10) `packages/crypto/src/rsa.ts`

```ts
export interface RsaVerifyResult {
    valid: boolean;
    reason?: string;
}
```

#### `StreamCipherAlgorithm`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/stream.ts#L3) `packages/crypto/src/stream.ts`

```ts
export type StreamCipherAlgorithm = 'aes-256-ctr' | 'chacha20-poly1305';
```

#### `StreamEncryptResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/stream.ts#L5) `packages/crypto/src/stream.ts`

```ts
export interface StreamEncryptResult {
    ciphertext: string;
    iv: string;
    authTag?: string;
    algorithm: StreamCipherAlgorithm;
}
```

#### `X509CertInfo`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/x509.ts#L3) `packages/crypto/src/x509.ts`

```ts
export interface X509CertInfo {
    subject: string;
    issuer: string;
    validFrom: string;
    validTo: string;
    serialNumber: string;
    fingerprint: string;
    fingerprint256: string;
    keyUsage?: readonly string[];
    isValidNow: boolean;
}
```
<!-- kiwa-public-api:end -->
