# @kiwa-lab/crypto の使い方

この package は Node.js crypto API を使って test fixture を作ります。JWT は verify result の `valid` を確認してから payload を利用し、AES GCM は ciphertext、iv、auth tag をすべて渡して復号します。application の production secret、private key、customer data を fixture、snapshot、log に置かないでください。

次の file を `tests/auth.crypto.test.ts` として保存してください。JWT、AES GCM、password-derived key、HMAC の成功と拒否を同じ file で確認します。

```ts
import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  aesDecrypt,
  aesEncrypt,
  deriveKey,
  hmacDigest,
  signJWT,
  verifyJWT,
  verifyPassword,
} from "@kiwa-lab/crypto";

describe("authentication crypto", () => {
  it("uses only a JWT verified with its expected secret and algorithm", () => {
    const token = signJWT({ sub: "user-42", role: "admin" }, "srv-secret", "HS256");
    const verified = verifyJWT(token, "srv-secret", "HS256");
    const rejected = verifyJWT(token, "wrong-secret", "HS256");

    expect(verified).toMatchObject({ valid: true, payload: { sub: "user-42", role: "admin" } });
    expect(rejected).toMatchObject({ valid: false, reason: "signature mismatch" });
  });

  it("round-trips AES GCM and rejects a modified authentication tag", () => {
    const key = randomBytes(32);
    const encrypted = aesEncrypt("sensitive message", key, "aes-256-gcm");
    const tag = Buffer.from(encrypted.authTag!);
    tag[0] = tag[0]! ^ 0xff;

    expect(aesDecrypt(encrypted, key, "aes-256-gcm").toString("utf8")).toBe("sensitive message");
    expect(() => aesDecrypt(
      { ciphertext: encrypted.ciphertext, iv: encrypted.iv, authTag: tag },
      key,
      "aes-256-gcm",
    )).toThrow();
  });

  it("stores a derived password value and detects a modified HMAC payload", () => {
    const stored = deriveKey("user-pw-2024", { algorithm: "pbkdf2", iterations: 2000 });
    const payload = "{\"event\":\"account.created\"}";
    const signature = hmacDigest(payload, "webhook-secret", "sha256");

    expect(verifyPassword("user-pw-2024", stored)).toBe(true);
    expect(verifyPassword("wrong-pw", stored)).toBe(false);
    expect(hmacDigest(payload, "webhook-secret", "sha256")).toBe(signature);
    expect(hmacDigest(`${payload}changed`, "webhook-secret", "sha256")).not.toBe(signature);
  });
});
```

```bash
pnpm exec vitest run tests/auth.crypto.test.ts
```

`verifyJWT` の `valid` が false の result から payload を利用しないでください。JWT expiry はこの helper が解釈しないため、expiry policy は application または採用する JWT runtime の test で確認します。AES GCM の auth tag を失った場合や改変した場合は、plaintext の代替値を返さず request を拒否してください。

`deriveKey` の出力だけを password record として保存します。plain password、secret、private key、decrypted value を log や snapshot に出さないでください。KMS、HSM、key rotation、X.509 trust chain、transport security は実運用に近い隔離環境の security test で確認します。
