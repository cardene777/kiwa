import type { CaBLEQRCodePayload, CaBLESessionOptions } from './types.js';

let sessionCounter = 0;

/**
 * Reset the module-scoped session counter — test-only affordance so
 * consecutive suites start with `cable-session-1` instead of an arbitrary
 * offset. Called from `__resetPasskeyCounters`.
 */
export function __resetCaBLESessionCounter(): void {
  sessionCounter = 0;
}

/**
 * Build the QR code payload the initiator (laptop) prints for the phone to
 * scan. Real caBLE encodes an ephemeral EC P-256 public key + tunnel server
 * hint + random nonce as a `FIDO:/` URI base32-encoded into a QR image.
 *
 * The mock keeps the same three fields as literal strings so tests can
 * assert the payload survives the ceremony without running through a QR
 * image decoder. The `sessionId` is a monotonic id — the WebSocket tunnel
 * + BLE handshake use it as the correlation key so every step of the
 * ceremony refers to the same session.
 *
 * Throws when the tunnel server hint or nonce is empty — real caBLE
 * refuses to advertise a QR that would produce a degenerate handshake.
 */
export function generateCaBLEQRCode(
  options: CaBLESessionOptions,
): CaBLEQRCodePayload {
  if (options.tunnelServerHint.length === 0) {
    throw new Error(
      'generateCaBLEQRCode: tunnelServerHint is empty — cannot advertise a hybrid transport ceremony without a tunnel endpoint',
    );
  }
  if (options.nonce.length === 0) {
    throw new Error(
      'generateCaBLEQRCode: nonce is empty — cannot derive a replay-safe handshake without a nonce',
    );
  }
  sessionCounter += 1;
  const sessionId = `cable-session-${sessionCounter}`;
  // Deterministic tag: the mock does not run a real EC key generator, but
  // callers still need a public key literal that changes per session so
  // downstream fidelity tests can assert QR replay never reuses a key.
  const publicKey = `cable-pubkey::${sessionId}::${options.credential.credentialId}`;
  return {
    publicKey,
    tunnelServerHint: options.tunnelServerHint,
    nonce: options.nonce,
    sessionId,
  };
}

/**
 * Encode a QR code payload as the `FIDO:/` URI a real caBLE QR image would
 * carry. The mock returns a stable string built from the four payload
 * fields so tests can assert the URI shape without invoking a QR image
 * library.
 */
export function encodeCaBLEQRURI(payload: CaBLEQRCodePayload): string {
  return `FIDO:/${payload.sessionId}?pubkey=${payload.publicKey}&tunnel=${payload.tunnelServerHint}&nonce=${payload.nonce}`;
}
