import type { CaBLEBLEHandshake, CaBLEQRCodePayload } from './types.js';

/**
 * Derive the shared secret both parties compute from the QR payload nonce
 * + session id. Real caBLE runs an ECDH between the initiator's ephemeral
 * key (advertised in the QR) and the responder's own ephemeral key,
 * mixing the nonce as a KDF salt. The mock keeps a deterministic string
 * derivation so tests can assert both sides arrived at the same value
 * without invoking a real crypto library.
 */
function deriveSharedSecret(payload: CaBLEQRCodePayload): string {
  return `shared-secret::${payload.sessionId}::${payload.nonce}`;
}

/**
 * Encode the BLE advertisement payload the responder (phone) broadcasts.
 * Real caBLE ships a 20-byte encrypted blob carrying the session id +
 * responder's ephemeral public key. The mock keeps the same shape as a
 * base64url-looking string built from the session id + shared secret so
 * tests can assert the payload survives the ceremony without cracking a
 * BLE PDU decoder.
 */
function encodeAdvertisement(sessionId: string, sharedSecret: string): string {
  return `ble-adv::${sessionId}::${sharedSecret.length}`;
}

/**
 * Run the BLE advertisement handshake. Real caBLE step 2 — the responder
 * broadcasts a 20-byte BLE advertisement, the initiator picks it up over
 * a scan, and both sides derive a shared secret from the QR nonce +
 * responder's ephemeral key + session id.
 *
 * The mock computes the shared secret deterministically on both sides and
 * flags the handshake as `verified: true` when they match. Tests can
 * introduce a divergent shared secret by mutating the return value — the
 * ceremony downstream (WebSocket tunnel, credential migration) does not
 * gate on `verified`, so the caller keeps the check where it makes the
 * fidelity axis most legible.
 *
 * Throws when the QR payload session id is empty — real caBLE refuses to
 * derive a shared secret without a session correlation key.
 */
export function performBLEHandshake(
  payload: CaBLEQRCodePayload,
): CaBLEBLEHandshake {
  if (payload.sessionId.length === 0) {
    throw new Error(
      'performBLEHandshake: sessionId is empty — cannot correlate BLE advertisement with QR payload',
    );
  }
  const initiatorSecret = deriveSharedSecret(payload);
  const responderSecret = deriveSharedSecret(payload);
  const verified = initiatorSecret === responderSecret;
  return {
    sessionId: payload.sessionId,
    sharedSecret: initiatorSecret,
    advertisementPayload: encodeAdvertisement(payload.sessionId, initiatorSecret),
    verified,
  };
}
