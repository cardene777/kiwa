---
title: "@kiwa-lab/auth passkey__caBLE__qr-code の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>passkey&#95;&#95;caBLE&#95;&#95;qr-code</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/qr-code.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>encodeCaBLEQRURI</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/qr-code.ts#L61) <code v-pre>packages/auth/src/passkey/caBLE/qr-code.ts</code>

Encode a QR code payload as the `FIDO:/` URI a real caBLE QR image would carry. The mock returns a stable string built from the four payload fields so tests can assert the URI shape without invoking a QR image library.

```ts
export declare function encodeCaBLEQRURI(payload: CaBLEQRCodePayload): string;
```

#### <code v-pre>generateCaBLEQRCode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/qr-code.ts#L28) <code v-pre>packages/auth/src/passkey/caBLE/qr-code.ts</code>

Build the QR code payload the initiator (laptop) prints for the phone to scan. Real caBLE encodes an ephemeral EC P-256 public key + tunnel server hint + random nonce as a `FIDO:/` URI base32-encoded into a QR image. The mock keeps the same three fields as literal strings so tests can assert the payload survives the ceremony without running through a QR image decoder. The `sessionId` is a monotonic id — the WebSocket tunnel + BLE handshake use it as the correlation key so every step of the ceremony refers to the same session. Throws when the tunnel server hint or nonce is empty — real caBLE refuses to advertise a QR that would produce a degenerate handshake.

```ts
export declare function generateCaBLEQRCode(options: CaBLESessionOptions): CaBLEQRCodePayload;
```


