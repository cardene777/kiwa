import { providerEventName, type AxisStep, type MobileTarget } from './types.js';

/**
 * v1.51 secure-storage axis — iOS Keychain / Android Keystore / web CredMgmt API。
 * biometric challenge (Face ID / Touch ID / Fingerprint / WebAuthn) 込み。
 */
export type SecureStorageState = 'idle' | 'stored' | 'retrieved' | 'biometric-challenged' | 'removed';

export interface SecureStorageSession {
  target: MobileTarget;
  vaultId: string;
  state: SecureStorageState;
  credentials: Map<string, string>;
  biometricChallenges: number;
  history: AxisStep<SecureStorageState>[];
}

function emit(
  session: SecureStorageSession,
  neutralEvent:
    | 'secure-storage.credential_stored'
    | 'secure-storage.credential_retrieved'
    | 'secure-storage.biometric_challenged'
    | 'secure-storage.credential_removed',
  metadata: Record<string, string | number | boolean>,
): AxisStep<SecureStorageState> {
  const step: AxisStep<SecureStorageState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    metadata: { vaultId: session.vaultId, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function initSecureStorage(input: { target: MobileTarget; vaultId: string }): SecureStorageSession {
  if (input.vaultId.length === 0) throw new Error('initSecureStorage: vaultId must not be empty');
  return {
    target: input.target,
    vaultId: input.vaultId,
    state: 'idle',
    credentials: new Map(),
    biometricChallenges: 0,
    history: [],
  };
}

export function storeCredential(
  session: SecureStorageSession,
  input: { key: string; encryptedValue: string; requireBiometric?: boolean },
): AxisStep<SecureStorageState> {
  if (input.key.length === 0) throw new Error('storeCredential: key must not be empty');
  session.credentials.set(input.key, input.encryptedValue);
  session.state = 'stored';
  return emit(session, 'secure-storage.credential_stored', {
    key: input.key,
    requireBiometric: input.requireBiometric ?? false,
  });
}

export function retrieveCredential(
  session: SecureStorageSession,
  key: string,
): AxisStep<SecureStorageState> {
  const hit = session.credentials.has(key);
  session.state = 'retrieved';
  return emit(session, 'secure-storage.credential_retrieved', { key, hit });
}

export function challengeBiometric(
  session: SecureStorageSession,
  input: { method: 'face-id' | 'touch-id' | 'fingerprint' | 'webauthn'; success: boolean },
): AxisStep<SecureStorageState> {
  session.biometricChallenges += 1;
  session.state = 'biometric-challenged';
  return emit(session, 'secure-storage.biometric_challenged', {
    method: input.method,
    success: input.success,
    challenges: session.biometricChallenges,
  });
}

export function removeCredential(
  session: SecureStorageSession,
  key: string,
): AxisStep<SecureStorageState> {
  const removed = session.credentials.delete(key);
  session.state = 'removed';
  return emit(session, 'secure-storage.credential_removed', { key, removed });
}
