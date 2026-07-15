# @kiwa-lab/crypto

Cryptographic mock harness for kiwa — JWT / RSA / AES / hash / HMAC / X.509 を統一 interface で in-process 実行する test infra。

## API

- `signJWT(payload, secret, algorithm)` / `verifyJWT(token, secret, algorithm)` = JWT sign+verify (HS256 / RS256 / ES256)
- `rsaSign(data, privateKey)` / `rsaVerify(data, signature, publicKey)` / `rsaEncrypt(data, publicKey)` / `rsaDecrypt(cipher, privateKey)` = RSA operations
- `aesEncrypt(plaintext, key, mode)` / `aesDecrypt(cipher, key, mode)` = AES CBC / GCM
- `hashData(data, algorithm)` = sha256 / sha512 / blake2b512
- `hmacDigest(data, secret, algorithm)` = HMAC-SHA256 等
- `parseX509(pem)` = X.509 cert subject / issuer / validity 抽出
- `generateKeyPair(type)` = RSA / EC key pair generator
