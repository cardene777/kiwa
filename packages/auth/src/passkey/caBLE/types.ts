import type { PasskeyCredential } from '../types.js';
import type { WebAuthnCredential } from '../../webauthn/types.js';

/**
 * caBLE 3 step SSOT vocabulary. Modeled after the FIDO Alliance CTAP 2.2
 * hybrid transport spec — phone → laptop credential handoff runs QR code
 * generation → BLE advertisement handshake → WebSocket tunnel establishment
 * → credential migration → signature roundtrip. Each step surfaces its own
 * artifact so the fidelity harness can assert on the wire format without
 * driving a real Bluetooth stack.
 */
export type CaBLEStep =
  | 'qr-code'
  | 'ble-handshake'
  | 'websocket-tunnel'
  | 'credential-migration'
  | 'signature-roundtrip';

/**
 * QR code payload the initiator (laptop) prints for the phone to scan.
 * Real caBLE uses a base32-encoded EC public key + tunnel server hint +
 * random nonce. The mock keeps the same three fields as literal strings
 * so tests can assert the payload survives round-trip encoding without
 * running through a QR image decoder.
 */
export interface CaBLEQRCodePayload {
  /** Ephemeral EC P-256 public key advertised by the initiator. */
  readonly publicKey: string;
  /** Tunnel server hint — the phone dials this WebSocket endpoint. */
  readonly tunnelServerHint: string;
  /** Random nonce mixed into the BLE handshake to prevent replay. */
  readonly nonce: string;
  /** Monotonic session id — one per hybrid transport ceremony. */
  readonly sessionId: string;
}

/**
 * BLE advertisement handshake artifact. Real caBLE uses a 20-byte
 * advertisement carrying an encrypted session identifier. The mock keeps
 * the same shape as a plain object so tests can assert the initiator +
 * responder derived the same shared secret without decoding raw BLE bytes.
 */
export interface CaBLEBLEHandshake {
  readonly sessionId: string;
  /** Deterministic shared secret both parties derived from `nonce`. */
  readonly sharedSecret: string;
  /** Advertisement payload (base64url encoded). */
  readonly advertisementPayload: string;
  /** `true` when both sides derived matching secrets. */
  readonly verified: boolean;
}

/**
 * WebSocket tunnel handle. Real caBLE runs a duplex WebSocket over the
 * tunnel server. The mock keeps an in-memory message queue keyed by
 * session id — both sides `send()` / `receive()` through the same object
 * so tests can assert the ordering + payload without spinning up a real
 * WebSocket server.
 */
export interface CaBLEWebSocketTunnel {
  readonly sessionId: string;
  readonly tunnelServerHint: string;
  readonly established: boolean;
  /** Push a message from initiator → responder. */
  send(payload: string): void;
  /** Drain every pending message the initiator sent. */
  drain(): readonly string[];
  /** Close the tunnel — subsequent send / drain calls throw. */
  close(): void;
  /** `true` after `close()` has been called. */
  readonly closed: boolean;
}

/**
 * Credential migration payload — the responder (phone) ships the passkey
 * credential over the WebSocket tunnel. Real caBLE encrypts this with the
 * shared secret; the mock keeps the raw {@link PasskeyCredential} plus a
 * deterministic "encrypted" tag so tests can assert the migration went
 * through the tunnel without leaking the credential material outside.
 */
export interface CaBLECredentialMigration {
  readonly sessionId: string;
  readonly credentialId: string;
  readonly encryptedPayload: string;
  readonly credential: PasskeyCredential;
}

/**
 * Signature roundtrip artifact — the responder (phone) signs a challenge
 * with the passkey private key and streams the signature back through the
 * tunnel. Verified by the initiator against the stored credential public
 * key. Mirrors the WebAuthn L3 §7.2 assertion signature check the
 * cross-device flow terminates in.
 */
export interface CaBLESignatureRoundtrip {
  readonly sessionId: string;
  readonly credentialId: string;
  readonly challenge: string;
  readonly signature: string;
  /** `true` when the initiator verified the signature. */
  readonly verified: boolean;
}

/**
 * Options accepted by `startCaBLESession`. The initiator picks the tunnel
 * server hint (a hostname string in real caBLE, a made-up literal in the
 * mock) and the passkey to migrate. Every field is required — real caBLE
 * refuses to start a hybrid transport ceremony with any of these missing.
 */
export interface CaBLESessionOptions {
  /** Initiator device id — the laptop that scanned the QR. */
  readonly initiatorDeviceId: string;
  /** Responder device id — the phone that produced the QR. */
  readonly responderDeviceId: string;
  /** Credential to migrate — must live on the responder device. */
  readonly credential: PasskeyCredential;
  /** Tunnel server hint the initiator will dial. */
  readonly tunnelServerHint: string;
  /** Nonce mixed into the handshake — caller-supplied so tests are stable. */
  readonly nonce: string;
}

/**
 * caBLE hybrid transport session — collects every artifact produced by the
 * 3 steps + migration + signature roundtrip. `complete()` runs the whole
 * chain and returns this shape so a single assertion can inspect every
 * fidelity axis in one place.
 */
export interface CaBLESession {
  readonly sessionId: string;
  readonly qrCode: CaBLEQRCodePayload;
  readonly handshake: CaBLEBLEHandshake;
  readonly tunnel: CaBLEWebSocketTunnel;
  readonly migration: CaBLECredentialMigration;
  readonly signature: CaBLESignatureRoundtrip;
  /** Steps that ran to completion — always populated in FIDO 3-step order. */
  readonly stepsCompleted: readonly CaBLEStep[];
}

/**
 * Public re-export so callers building on the caBLE surface do not need to
 * reach into the base passkey module for the credential shape.
 */
export type { PasskeyCredential, WebAuthnCredential };
