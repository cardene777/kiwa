import { createVirtualAuthenticator } from '../webauthn/authenticator.js';
import type { WebAuthnCredential } from '../webauthn/types.js';
import type {
  PlatformAuthenticator,
  PlatformAuthenticatorOptions,
} from './types.js';

/**
 * Build a platform authenticator (Touch ID / Face ID / Windows Hello /
 * Android biometric). A platform authenticator is bound to the device — the
 * factory pins `attachment: platform` and `transport: internal`, matching the
 * WebAuthn L3 §5.4.5 pairing constraint. Passkeys minted here are always
 * discoverable credentials (`hasResidentKey: true`) — the factory rejects any
 * attempt to disable resident-key storage because a non-discoverable platform
 * credential is not a passkey.
 */
export function createPlatformAuthenticator(
  options: PlatformAuthenticatorOptions,
): { handle: PlatformAuthenticator; credentials: Map<string, WebAuthnCredential> } {
  if ((options.hasResidentKey as boolean | undefined) === false) {
    throw new Error(
      'createPlatformAuthenticator: passkeys require hasResidentKey=true — a non-discoverable platform credential is not a passkey',
    );
  }
  const biometric = options.biometric;
  if (
    biometric !== 'touch-id' &&
    biometric !== 'face-id' &&
    biometric !== 'windows-hello' &&
    biometric !== 'android-biometric'
  ) {
    throw new Error(
      `createPlatformAuthenticator: unknown biometric "${biometric}" — expected touch-id / face-id / windows-hello / android-biometric`,
    );
  }
  const biometricAvailable = options.biometricAvailable ?? true;
  const { handle: base, credentials } = createVirtualAuthenticator({
    attachment: 'platform',
    transport: 'internal',
    hasResidentKey: true,
    // Only expose UV when biometric is available. Locking the biometric
    // simulates a device where every UV=required assertion must reject.
    hasUserVerification: biometricAvailable,
    ...(options.isUserPresent === undefined
      ? {}
      : { isUserPresent: options.isUserPresent }),
  });
  const state = {
    biometricAvailable,
  };
  const handle: PlatformAuthenticator = {
    id: base.id,
    attachment: base.attachment,
    transport: base.transport,
    hasResidentKey: base.hasResidentKey,
    hasUserVerification: base.hasUserVerification,
    get isUserPresent(): boolean {
      return base.isUserPresent;
    },
    set isUserPresent(value: boolean) {
      base.isUserPresent = value;
    },
    listCredentials: () => base.listCredentials(),
    kind: 'platform' as const,
    biometric,
    get biometricAvailable(): boolean {
      return state.biometricAvailable;
    },
    set biometricAvailable(value: boolean) {
      state.biometricAvailable = value;
    },
  };
  return { handle, credentials };
}
