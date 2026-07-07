import {
  providerAdvEventName,
  type AxisAdvStep,
  type NeutralAdvEventName,
  type SecurityAdvTarget,
} from './types.js';

/**
 * Cryptography advanced axis — AEAD + KDF + envelope encryption + key rotation
 * + HSM signing + post-quantum KEM state machine。
 *
 * Deterministic mock で 6 signal 系統を提供。 real driver 経路では Vault
 * transit engine や AWS KMS / GCP KMS に対して encryption を発火する。
 */

export type AeadAlgo = 'AES-256-GCM' | 'ChaCha20-Poly1305' | 'AES-256-GCM-SIV';
export type KdfAlgo = 'HKDF-SHA256' | 'HKDF-SHA512' | 'PBKDF2' | 'Argon2id' | 'scrypt';
export type PqKemAlgo = 'ML-KEM-768' | 'ML-KEM-1024' | 'Kyber768';

export type CryptoState =
  | 'idle'
  | 'aead-sealed'
  | 'kdf-derived'
  | 'envelope-wrapped'
  | 'key-rotated'
  | 'hsm-signed'
  | 'pq-encapsulated';

export interface CryptoSession {
  target: SecurityAdvTarget;
  sessionId: string;
  state: CryptoState;
  history: AxisAdvStep<CryptoState>[];
  currentKeyId: string | null;
}

export interface AeadInput {
  algo: AeadAlgo;
  plaintextLen: number;
  aadLen: number;
}

export interface KdfInput {
  algo: KdfAlgo;
  saltLen: number;
  info: string;
  iterations: number;
}

export interface EnvelopeInput {
  cek: string;
  kek: string;
  masterKeyProvider: 'kms' | 'vault' | 'hsm';
}

export interface KeyRotationInput {
  oldKeyId: string;
  newKeyId: string;
  reason: 'scheduled' | 'compromised' | 'policy';
}

export interface HsmSignInput {
  keyId: string;
  digest: string;
  algorithm: 'ECDSA-P256' | 'RSA-PSS-2048' | 'Ed25519';
}

export interface PqKemInput {
  algo: PqKemAlgo;
  publicKeyLen: number;
}

export function startCryptoSession(input: {
  target: SecurityAdvTarget;
  sessionId: string;
}): CryptoSession {
  if (input.sessionId.length === 0) {
    throw new Error('startCryptoSession: sessionId must not be empty');
  }
  return {
    target: input.target,
    sessionId: input.sessionId,
    state: 'idle',
    history: [],
    currentKeyId: null,
  };
}

export function sealAead(session: CryptoSession, input: AeadInput): AxisAdvStep<CryptoState> {
  if (input.plaintextLen < 0 || input.aadLen < 0) {
    throw new Error('sealAead: lengths must be non-negative');
  }
  if (input.plaintextLen > 1024 * 1024 * 64) {
    throw new Error('sealAead: plaintext > 64MB not supported by mock');
  }
  session.state = 'aead-sealed';
  return emit(session, 'crypto.aead_sealed', {
    algo: input.algo,
    plaintextLen: input.plaintextLen,
    aadLen: input.aadLen,
    ciphertextLen: input.plaintextLen + 16,
  });
}

export function deriveKey(session: CryptoSession, input: KdfInput): AxisAdvStep<CryptoState> {
  if (input.saltLen < 8) {
    throw new Error('deriveKey: salt must be >= 8 bytes');
  }
  if (input.iterations < 1) {
    throw new Error('deriveKey: iterations must be >= 1');
  }
  if ((input.algo === 'PBKDF2' || input.algo === 'Argon2id') && input.iterations < 10000) {
    throw new Error('deriveKey: password-based KDF requires >= 10000 iterations');
  }
  session.state = 'kdf-derived';
  return emit(session, 'crypto.kdf_derived', {
    algo: input.algo,
    saltLen: input.saltLen,
    iterations: input.iterations,
    info: input.info,
  });
}

export function wrapEnvelope(
  session: CryptoSession,
  input: EnvelopeInput,
): AxisAdvStep<CryptoState> {
  if (input.cek.length === 0 || input.kek.length === 0) {
    throw new Error('wrapEnvelope: cek and kek must not be empty');
  }
  session.state = 'envelope-wrapped';
  return emit(session, 'crypto.envelope_wrapped', {
    provider: input.masterKeyProvider,
    cekLen: input.cek.length,
    kekLen: input.kek.length,
  });
}

export function rotateKey(
  session: CryptoSession,
  input: KeyRotationInput,
): AxisAdvStep<CryptoState> {
  if (input.oldKeyId === input.newKeyId) {
    throw new Error('rotateKey: oldKeyId and newKeyId must differ');
  }
  if (input.oldKeyId.length === 0 || input.newKeyId.length === 0) {
    throw new Error('rotateKey: key ids must not be empty');
  }
  session.currentKeyId = input.newKeyId;
  session.state = 'key-rotated';
  return emit(session, 'crypto.key_rotated', {
    oldKeyId: input.oldKeyId,
    newKeyId: input.newKeyId,
    reason: input.reason,
  });
}

export function signWithHsm(
  session: CryptoSession,
  input: HsmSignInput,
): AxisAdvStep<CryptoState> {
  if (input.digest.length === 0) {
    throw new Error('signWithHsm: digest must not be empty');
  }
  if (input.keyId.length === 0) {
    throw new Error('signWithHsm: keyId must not be empty');
  }
  session.state = 'hsm-signed';
  return emit(session, 'crypto.hsm_signed', {
    keyId: input.keyId,
    algorithm: input.algorithm,
    digestLen: input.digest.length,
  });
}

export function encapsulatePq(
  session: CryptoSession,
  input: PqKemInput,
): AxisAdvStep<CryptoState> {
  if (input.publicKeyLen < 800) {
    throw new Error('encapsulatePq: ML-KEM public key must be >= 800 bytes');
  }
  session.state = 'pq-encapsulated';
  return emit(session, 'crypto.pq_kem_encapsulated', {
    algo: input.algo,
    publicKeyLen: input.publicKeyLen,
    ciphertextLen: input.algo === 'ML-KEM-1024' ? 1568 : 1088,
  });
}

function emit(
  session: CryptoSession,
  neutral: NeutralAdvEventName,
  metadata: Record<string, string | number | boolean>,
): AxisAdvStep<CryptoState> {
  const step: AxisAdvStep<CryptoState> = {
    neutralEvent: neutral,
    providerEvent: providerAdvEventName(session.target, neutral),
    state: session.state,
    timestampMs: session.history.length + 1,
    metadata,
  };
  session.history.push(step);
  return step;
}
