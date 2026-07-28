---
title: "@kiwa-lab/auth passkey__caBLE__ble-handshake の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>passkey&#95;&#95;caBLE&#95;&#95;ble-handshake</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/ble-handshake.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>performBLEHandshake</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/ble-handshake.ts#L43) <code v-pre>packages/auth/src/passkey/caBLE/ble-handshake.ts</code>

Run the BLE advertisement handshake. Real caBLE step 2 — the responder broadcasts a 20-byte BLE advertisement, the initiator picks it up over a scan, and both sides derive a shared secret from the QR nonce + responder's ephemeral key + session id. The mock computes the shared secret deterministically on both sides and flags the handshake as `verified: true` when they match. Tests can introduce a divergent shared secret by mutating the return value — the ceremony downstream (WebSocket tunnel, credential migration) does not gate on `verified`, so the caller keeps the check where it makes the fidelity axis most legible. Throws when the QR payload session id is empty — real caBLE refuses to derive a shared secret without a session correlation key.

```ts
export declare function performBLEHandshake(payload: CaBLEQRCodePayload): CaBLEBLEHandshake;
```


