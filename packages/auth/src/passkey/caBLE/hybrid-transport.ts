import { performBLEHandshake } from './ble-handshake.js';
import { generateCaBLEQRCode } from './qr-code.js';
import type {
  CaBLECredentialMigration,
  CaBLESession,
  CaBLESessionOptions,
  CaBLESignatureRoundtrip,
  CaBLEStep,
  CaBLEWebSocketTunnel,
} from './types.js';
import type { PasskeyCredential } from '../types.js';
import { establishWebSocketTunnel } from './websocket-tunnel.js';

const STEP_ORDER: readonly CaBLEStep[] = [
  'qr-code',
  'ble-handshake',
  'websocket-tunnel',
  'credential-migration',
  'signature-roundtrip',
];

/**
 * Ship the passkey credential from responder (phone) to initiator (laptop)
 * over the established WebSocket tunnel. Real caBLE encrypts the payload
 * with the BLE handshake shared secret; the mock keeps the raw
 * {@link PasskeyCredential} plus a deterministic "encrypted" tag so tests
 * can assert the migration went through the tunnel without leaking the
 * credential material outside.
 */
export function migrateCredential(
  tunnel: CaBLEWebSocketTunnel,
  credential: PasskeyCredential,
): CaBLECredentialMigration {
  if (!tunnel.established) {
    throw new Error(
      `migrateCredential: cannot migrate credential over unestablished tunnel "${tunnel.sessionId}"`,
    );
  }
  if (tunnel.closed) {
    throw new Error(
      `migrateCredential: cannot migrate credential over closed tunnel "${tunnel.sessionId}"`,
    );
  }
  const encryptedPayload = `enc::${tunnel.sessionId}::${credential.credentialId}::${credential.userId}`;
  tunnel.send(encryptedPayload);
  return {
    sessionId: tunnel.sessionId,
    credentialId: credential.credentialId,
    encryptedPayload,
    credential,
  };
}

/**
 * Sign the challenge with the migrated credential + verify the signature
 * on the initiator side. Real caBLE terminates the hybrid transport
 * ceremony in a WebAuthn L3 §7.2 assertion signature check; the mock
 * builds a deterministic signature string from the credential id +
 * challenge + session id so tests can assert the roundtrip without
 * running through a real signature verifier.
 *
 * Throws when the tunnel is not established / has been closed / the
 * challenge is empty — real caBLE cannot produce a WebAuthn L3 §7.2
 * assertion over any of those conditions.
 */
export function performSignatureRoundtrip(
  tunnel: CaBLEWebSocketTunnel,
  credential: PasskeyCredential,
  challenge: string,
): CaBLESignatureRoundtrip {
  if (!tunnel.established) {
    throw new Error(
      `performSignatureRoundtrip: cannot sign over unestablished tunnel "${tunnel.sessionId}"`,
    );
  }
  if (tunnel.closed) {
    throw new Error(
      `performSignatureRoundtrip: cannot sign over closed tunnel "${tunnel.sessionId}"`,
    );
  }
  if (challenge.length === 0) {
    throw new Error(
      'performSignatureRoundtrip: challenge is empty — cannot produce a WebAuthn L3 §7.2 assertion signature over an empty challenge',
    );
  }
  const signature = `sig::${credential.credentialId}::${challenge}::${tunnel.sessionId}`;
  tunnel.send(signature);
  // The mock signature is minted with the credential id in the tag, so
  // verification is a tautology in the happy path — callers that need the
  // negative branch can build a synthetic {@link CaBLESignatureRoundtrip}
  // with `verified: false`. Real caBLE runs an ES256 / EdDSA verifier here.
  return {
    sessionId: tunnel.sessionId,
    credentialId: credential.credentialId,
    challenge,
    signature,
    verified: true,
  };
}

/**
 * Run the full caBLE hybrid transport ceremony end-to-end. Chains the 3
 * FIDO caBLE steps (QR code → BLE handshake → WebSocket tunnel) followed
 * by credential migration + signature roundtrip so a single call produces
 * the {@link CaBLESession} artifact the fidelity harness inspects.
 *
 * The `challenge` picks the value the responder (phone) signs at the
 * assertion step. Real caBLE surfaces this from the RP; the mock lets the
 * caller supply it directly so tests can assert per-ceremony signature
 * stability.
 */
export function runCaBLESession(
  options: CaBLESessionOptions,
  challenge: string,
): CaBLESession {
  const qrCode = generateCaBLEQRCode(options);
  const handshake = performBLEHandshake(qrCode);
  const tunnel = establishWebSocketTunnel(qrCode, handshake);
  const migration = migrateCredential(tunnel, options.credential);
  const signature = performSignatureRoundtrip(
    tunnel,
    options.credential,
    challenge,
  );
  return {
    sessionId: qrCode.sessionId,
    qrCode,
    handshake,
    tunnel,
    migration,
    signature,
    stepsCompleted: [...STEP_ORDER],
  };
}
