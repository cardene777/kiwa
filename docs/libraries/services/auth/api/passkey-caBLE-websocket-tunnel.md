---
title: "@kiwa-lab/auth passkey-caBLE-websocket-tunnel の API 契約"
---

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>passkey-caBLE-websocket-tunnel</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/websocket-tunnel.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>establishWebSocketTunnel</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/websocket-tunnel.ts#L25) <code v-pre>packages/auth/src/passkey/caBLE/websocket-tunnel.ts</code>

Establish the WebSocket tunnel the initiator (laptop) opens against the tunnel server hint advertised in the QR payload. Real caBLE step 3 — both sides send frames over a duplex WebSocket protected by the BLE handshake shared secret. The mock keeps an in-memory FIFO of messages the initiator sent so downstream credential migration + signature roundtrip can inspect the wire log without spinning up a real WebSocket server. `close()` flips the tunnel into a rejected state — subsequent `send()` / `drain()` throws so tests can assert lifecycle correctness. Throws when the handshake was not verified — real caBLE refuses to establish the tunnel if the BLE handshake shared secrets diverged. Callers that want to exercise the "handshake failed but tunnel opened" negative path can mint a synthetic handshake with `verified: true` before calling this function.

```ts
export declare function establishWebSocketTunnel(qr: CaBLEQRCodePayload, handshake: CaBLEBLEHandshake): CaBLEWebSocketTunnel;
```


