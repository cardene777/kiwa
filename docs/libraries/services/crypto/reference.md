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

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>aesDecrypt</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/aes.ts#L35) <code v-pre>packages/crypto/src/aes.ts</code>

```ts
export declare function aesDecrypt(input: {
    ciphertext: Buffer;
    iv: Buffer;
    authTag?: Buffer;
}, key: Buffer, mode?: AesMode): Buffer;
```

#### <code v-pre>aesEncrypt</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/aes.ts#L19) <code v-pre>packages/crypto/src/aes.ts</code>

```ts
export declare function aesEncrypt(plaintext: string | Buffer, key: Buffer, mode?: AesMode): AesEncryptResult;
```

#### <code v-pre>deriveKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/kdf.ts#L28) <code v-pre>packages/crypto/src/kdf.ts</code>

password → derived key の KDF ラッパー。 PBKDF2 と scrypt は node:crypto、 Argon2 は node:crypto 未対応のため scrypt を argon2-mock として代替 (bytes 契約は同一)。

```ts
export declare function deriveKey(password: string, opts?: KdfOptions): KdfResult;
```

#### <code v-pre>ed25519Sign</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/ed25519.ts#L12) <code v-pre>packages/crypto/src/ed25519.ts</code>

Ed25519 で data に署名。 PEM 形式の privateKey (generateKeyPair('ed25519') の出力) を受取り、 base64 signature を返す。 real Ed25519 実装は node:crypto 経路。

```ts
export declare function ed25519Sign(data: string, privateKeyPem: string): Ed25519SignResult;
```

#### <code v-pre>ed25519Verify</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/ed25519.ts#L23) <code v-pre>packages/crypto/src/ed25519.ts</code>

```ts
export declare function ed25519Verify(data: string, signatureBase64: string, publicKeyPem: string): Ed25519VerifyResult;
```

#### <code v-pre>generateKeyPair</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/keypair.ts#L11) <code v-pre>packages/crypto/src/keypair.ts</code>

```ts
export declare function generateKeyPair(type?: KeyPairType, options?: {
    modulusLength?: number;
    namedCurve?: string;
}): KeyPairResult;
```

#### <code v-pre>generateRsaKeyPair</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/rsa.ts#L47) <code v-pre>packages/crypto/src/rsa.ts</code>

```ts
export declare function generateRsaKeyPair(modulusLength?: number): {
    publicKey: string;
    privateKey: string;
};
```

#### <code v-pre>hashData</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/hash.ts#L7) <code v-pre>packages/crypto/src/hash.ts</code>

```ts
export declare function hashData(data: string | Buffer, algorithm?: HashAlgorithm, encoding?: 'hex' | 'base64' | 'binary'): string;
```

#### <code v-pre>hmacDigest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/hash.ts#L17) <code v-pre>packages/crypto/src/hash.ts</code>

```ts
export declare function hmacDigest(data: string | Buffer, secret: string | Buffer, algorithm?: HmacAlgorithm, encoding?: 'hex' | 'base64' | 'binary'): string;
```

#### <code v-pre>parseX509</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/x509.ts#L15) <code v-pre>packages/crypto/src/x509.ts</code>

```ts
export declare function parseX509(pem: string): X509CertInfo;
```

#### <code v-pre>rsaDecrypt</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/rsa.ts#L43) <code v-pre>packages/crypto/src/rsa.ts</code>

```ts
export declare function rsaDecrypt(cipher: Buffer, privateKey: KeyLike): Buffer;
```

#### <code v-pre>rsaEncrypt</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/rsa.ts#L38) <code v-pre>packages/crypto/src/rsa.ts</code>

```ts
export declare function rsaEncrypt(data: string | Buffer, publicKey: KeyLike): Buffer;
```

#### <code v-pre>rsaSign</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/rsa.ts#L15) <code v-pre>packages/crypto/src/rsa.ts</code>

```ts
export declare function rsaSign(data: string | Buffer, privateKey: KeyLike, algorithm?: string): Buffer;
```

#### <code v-pre>rsaVerify</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/rsa.ts#L21) <code v-pre>packages/crypto/src/rsa.ts</code>

```ts
export declare function rsaVerify(data: string | Buffer, signature: Buffer, publicKey: KeyLike, algorithm?: string): RsaVerifyResult;
```

#### <code v-pre>signJWT</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/jwt.ts#L37) <code v-pre>packages/crypto/src/jwt.ts</code>

```ts
export declare function signJWT(payload: JWTPayload, secret: string | KeyLike, algorithm?: JWTAlgorithm): string;
```

#### <code v-pre>streamDecrypt</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/stream.ts#L29) <code v-pre>packages/crypto/src/stream.ts</code>

```ts
export declare function streamDecrypt(result: StreamEncryptResult, key: Buffer): string;
```

#### <code v-pre>streamEncrypt</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/stream.ts#L16) <code v-pre>packages/crypto/src/stream.ts</code>

stream cipher (AES-CTR / ChaCha20-Poly1305) で byte 流を encrypt。 real TLS record layer / Signal Protocol の対称暗号 stream mode 相当。

```ts
export declare function streamEncrypt(plaintext: string, key: Buffer, algorithm?: StreamCipherAlgorithm): StreamEncryptResult;
```

#### <code v-pre>verifyJWT</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/jwt.ts#L58) <code v-pre>packages/crypto/src/jwt.ts</code>

```ts
export declare function verifyJWT(token: string, secret: string | KeyLike, algorithm?: JWTAlgorithm): JWTVerifyResult;
```

#### <code v-pre>verifyPassword</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/kdf.ts#L49) <code v-pre>packages/crypto/src/kdf.ts</code>

password + 既存 salt/params で KDF を再実行、 hashHex 一致で verification 成功。

```ts
export declare function verifyPassword(password: string, stored: KdfResult): boolean;
```

#### <code v-pre>x25519Ecdh</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/ed25519.ts#L37) <code v-pre>packages/crypto/src/ed25519.ts</code>

X25519 ECDH で共有秘密を導出。 real Signal Protocol / DTLS 相当の一時鍵交換を mock。

```ts
export declare function x25519Ecdh(privateKeyPem: string, remotePublicKeyPem: string): EcdhResult;
```

### 型

#### <code v-pre>AesEncryptResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/aes.ts#L5) <code v-pre>packages/crypto/src/aes.ts</code>

```ts
export interface AesEncryptResult {
    ciphertext: Buffer;
    iv: Buffer;
    authTag?: Buffer;
}
```

#### <code v-pre>AesMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/aes.ts#L3) <code v-pre>packages/crypto/src/aes.ts</code>

```ts
export type AesMode = 'aes-256-cbc' | 'aes-256-gcm' | 'aes-128-cbc' | 'aes-128-gcm';
```

#### <code v-pre>EcdhResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/ed25519.ts#L29) <code v-pre>packages/crypto/src/ed25519.ts</code>

```ts
export interface EcdhResult {
    sharedSecretHex: string;
    algorithm: 'x25519';
}
```

#### <code v-pre>Ed25519SignResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/ed25519.ts#L3) <code v-pre>packages/crypto/src/ed25519.ts</code>

```ts
export interface Ed25519SignResult {
    signature: string;
    algorithm: 'ed25519';
}
```

#### <code v-pre>Ed25519VerifyResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/ed25519.ts#L18) <code v-pre>packages/crypto/src/ed25519.ts</code>

```ts
export interface Ed25519VerifyResult {
    valid: boolean;
    algorithm: 'ed25519';
}
```

#### <code v-pre>HashAlgorithm</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/hash.ts#L3) <code v-pre>packages/crypto/src/hash.ts</code>

```ts
export type HashAlgorithm = 'sha256' | 'sha384' | 'sha512' | 'blake2b512' | 'blake2s256' | 'sha1' | 'md5';
```

#### <code v-pre>HmacAlgorithm</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/hash.ts#L5) <code v-pre>packages/crypto/src/hash.ts</code>

```ts
export type HmacAlgorithm = HashAlgorithm;
```

#### <code v-pre>JWTAlgorithm</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/jwt.ts#L3) <code v-pre>packages/crypto/src/jwt.ts</code>

```ts
export type JWTAlgorithm = 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512' | 'ES256';
```

#### <code v-pre>JWTPayload</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/jwt.ts#L5) <code v-pre>packages/crypto/src/jwt.ts</code>

```ts
export type JWTPayload = Record<string, unknown>;
```

#### <code v-pre>JWTVerifyResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/jwt.ts#L7) <code v-pre>packages/crypto/src/jwt.ts</code>

```ts
export interface JWTVerifyResult {
    valid: boolean;
    payload?: JWTPayload;
    algorithm: JWTAlgorithm;
    reason?: string;
}
```

#### <code v-pre>KdfAlgorithm</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/kdf.ts#L3) <code v-pre>packages/crypto/src/kdf.ts</code>

```ts
export type KdfAlgorithm = 'pbkdf2' | 'scrypt' | 'argon2-mock';
```

#### <code v-pre>KdfOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/kdf.ts#L5) <code v-pre>packages/crypto/src/kdf.ts</code>

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

#### <code v-pre>KdfResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/kdf.ts#L16) <code v-pre>packages/crypto/src/kdf.ts</code>

```ts
export interface KdfResult {
    algorithm: KdfAlgorithm;
    hashHex: string;
    saltHex: string;
    iterations: number;
    keyLength: number;
}
```

#### <code v-pre>KeyPairResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/keypair.ts#L5) <code v-pre>packages/crypto/src/keypair.ts</code>

```ts
export interface KeyPairResult {
    publicKey: string;
    privateKey: string;
    type: KeyPairType;
}
```

#### <code v-pre>KeyPairType</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/keypair.ts#L3) <code v-pre>packages/crypto/src/keypair.ts</code>

```ts
export type KeyPairType = 'rsa' | 'ec' | 'ed25519';
```

#### <code v-pre>RsaVerifyResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/rsa.ts#L10) <code v-pre>packages/crypto/src/rsa.ts</code>

```ts
export interface RsaVerifyResult {
    valid: boolean;
    reason?: string;
}
```

#### <code v-pre>StreamCipherAlgorithm</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/stream.ts#L3) <code v-pre>packages/crypto/src/stream.ts</code>

```ts
export type StreamCipherAlgorithm = 'aes-256-ctr' | 'chacha20-poly1305';
```

#### <code v-pre>StreamEncryptResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/stream.ts#L5) <code v-pre>packages/crypto/src/stream.ts</code>

```ts
export interface StreamEncryptResult {
    ciphertext: string;
    iv: string;
    authTag?: string;
    algorithm: StreamCipherAlgorithm;
}
```

#### <code v-pre>X509CertInfo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/x509.ts#L3) <code v-pre>packages/crypto/src/x509.ts</code>

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
