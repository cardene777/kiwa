import type {
  CaBLEBLEHandshake,
  CaBLEQRCodePayload,
  CaBLEWebSocketTunnel,
} from './types.js';

/**
 * Establish the WebSocket tunnel the initiator (laptop) opens against the
 * tunnel server hint advertised in the QR payload. Real caBLE step 3 —
 * both sides send frames over a duplex WebSocket protected by the BLE
 * handshake shared secret.
 *
 * The mock keeps an in-memory FIFO of messages the initiator sent so
 * downstream credential migration + signature roundtrip can inspect the
 * wire log without spinning up a real WebSocket server. `close()` flips
 * the tunnel into a rejected state — subsequent `send()` / `drain()`
 * throws so tests can assert lifecycle correctness.
 *
 * Throws when the handshake was not verified — real caBLE refuses to
 * establish the tunnel if the BLE handshake shared secrets diverged.
 * Callers that want to exercise the "handshake failed but tunnel opened"
 * negative path can mint a synthetic handshake with `verified: true`
 * before calling this function.
 */
export function establishWebSocketTunnel(
  qr: CaBLEQRCodePayload,
  handshake: CaBLEBLEHandshake,
): CaBLEWebSocketTunnel {
  if (!handshake.verified) {
    throw new Error(
      'establishWebSocketTunnel: BLE handshake not verified — real caBLE refuses to open the tunnel when the shared secret cannot be derived by both sides',
    );
  }
  if (handshake.sessionId !== qr.sessionId) {
    throw new Error(
      `establishWebSocketTunnel: session id mismatch — QR "${qr.sessionId}" vs handshake "${handshake.sessionId}"`,
    );
  }
  const messages: string[] = [];
  let closed = false;
  const tunnel: CaBLEWebSocketTunnel = {
    sessionId: qr.sessionId,
    tunnelServerHint: qr.tunnelServerHint,
    established: true,
    send(payload: string): void {
      if (closed) {
        throw new Error(
          `establishWebSocketTunnel: cannot send on closed tunnel "${qr.sessionId}"`,
        );
      }
      messages.push(payload);
    },
    drain(): readonly string[] {
      if (closed) {
        throw new Error(
          `establishWebSocketTunnel: cannot drain closed tunnel "${qr.sessionId}"`,
        );
      }
      const snapshot = [...messages];
      messages.length = 0;
      return snapshot;
    },
    close(): void {
      closed = true;
    },
    get closed(): boolean {
      return closed;
    },
  };
  return tunnel;
}
