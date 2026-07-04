import type { TestEnvBase } from '@kiwa-test/core';
import type {
  AuthenticatorAssertionResponse,
  AuthenticatorAttestationResponse,
  PublicKeyCredentialCreationOptionsInit,
  PublicKeyCredentialRequestOptionsInit,
  VirtualAuthenticator,
  WebAuthnAuthenticatorAttachment,
  WebAuthnCredential,
  WebAuthnTransport,
} from '../webauthn/types.js';

/**
 * Sync fabric vendors modeled by the mock. Real-world Passkey deployments
 * synchronize discoverable credentials across a user's devices through one of
 * two commercial fabrics — Apple's iCloud Keychain (FIDO Alliance CTAP 2.2
 * Passkey Provider spec) and Google Password Manager (FIDO2 credential sync
 * for Android + Chrome). The mock represents each as an independent, in-memory
 * blob store that survives device removal — matching the "credential outlives
 * the authenticator that minted it" property that separates passkeys from
 * plain WebAuthn credentials.
 */
export type SyncFabricVendor = 'icloud-keychain' | 'google-password-manager';

/**
 * Platform authenticator biometric modality. The mock does not distinguish the
 * biometric backend at the wire level — every modality resolves to UV=true —
 * but tests want to assert that the correct modality was requested so the
 * factory records it on the returned handle. Touch ID / Face ID are the two
 * Apple platform modalities; Windows Hello covers both fingerprint and IR
 * face; Android biometric covers fingerprint / face / iris depending on the
 * OEM.
 */
export type PlatformBiometricModality =
  | 'touch-id'
  | 'face-id'
  | 'windows-hello'
  | 'android-biometric';

/**
 * Roaming authenticator kind. Security key = physical FIDO2 token (YubiKey,
 * Titan). Phone = hybrid transport (caBLE / QR-code-initiated cross-device
 * flow) surfaced through a BLE advertisement handshake. Both resolve to
 * `attachment: cross-platform`, but the mock keeps the kind so tests can
 * assert the correct roaming path was exercised.
 */
export type RoamingAuthenticatorKind = 'security-key' | 'phone';

/**
 * Configuration for `createPlatformAuthenticator`. A platform authenticator
 * is bound to the device — `attachment` is always `platform`, `transport` is
 * always `internal`. The caller only supplies the biometric modality plus the
 * usual UV / user-presence toggles the WebAuthn layer accepts.
 */
export interface PlatformAuthenticatorOptions {
  biometric: PlatformBiometricModality;
  /**
   * When `true` the biometric sensor is available and UV is satisfied on every
   * assertion (default). When `false` the mock keeps the authenticator alive
   * but every `credentialAssertion` rejects with a UV-not-satisfied error so
   * tests can exercise the "biometric locked out" branch.
   */
  biometricAvailable?: boolean;
  /**
   * User-presence gesture. Defaults to `true`. Set to `false` to simulate a
   * device that failed the touch gesture — matches WebAuthn L3 §7.2.
   */
  isUserPresent?: boolean;
  /**
   * Passkeys are always discoverable credentials (WebAuthn L3 §5.4.6 requires
   * `residentKey: 'required'` for a credential to be a passkey). The flag
   * defaults to `true` and cannot be turned off — the factory rejects
   * `hasResidentKey: false` at construction time.
   */
  hasResidentKey?: true;
}

/**
 * Configuration for `createRoamingAuthenticator`. A roaming authenticator is
 * portable — `attachment` is `cross-platform`. The `kind` chooses whether the
 * mock uses a USB security-key transport or the hybrid (caBLE) transport that
 * mirrors phone-based cross-device sign-in.
 */
export interface RoamingAuthenticatorOptions {
  kind: RoamingAuthenticatorKind;
  /**
   * Whether the roaming authenticator can perform UV. Security keys with a
   * PIN keypad set this to `true`; a bare token without a PIN keypad sets it
   * `false` and every UV=required assertion rejects.
   */
  hasUserVerification?: boolean;
  isUserPresent?: boolean;
  hasResidentKey?: boolean;
}

/**
 * Passkey handle returned by `createPlatformAuthenticator` — extends the raw
 * `VirtualAuthenticator` with the biometric modality recorded for assertion.
 */
export interface PlatformAuthenticator extends VirtualAuthenticator {
  readonly kind: 'platform';
  readonly biometric: PlatformBiometricModality;
  biometricAvailable: boolean;
}

/**
 * Passkey handle returned by `createRoamingAuthenticator` — extends the raw
 * `VirtualAuthenticator` with the roaming kind and transport recorded so
 * caBLE-specific tests can assert the hybrid path was taken.
 */
export interface RoamingAuthenticator extends VirtualAuthenticator {
  readonly kind: 'roaming';
  readonly roamingKind: RoamingAuthenticatorKind;
}

/**
 * Passkey credential record. A passkey extends `WebAuthnCredential` with sync
 * fabric metadata — which vendor blob store the credential is backed up into,
 * the device that minted the credential, and the sync epoch used to detect
 * fabric conflicts. `syncedFabrics` tracks every vendor the credential has
 * ever been backed up into so a restore on a fresh device knows every vendor
 * to consult.
 */
export interface PasskeyCredential extends WebAuthnCredential {
  /** Device that minted the credential. Set at creation, never mutated. */
  originDeviceId: string;
  /**
   * User handle recorded separately from the base `userHandle` so restore on a
   * fresh device can enforce per-user isolation without cracking the WebAuthn
   * userHandle base64 encoding.
   */
  userId: string;
  /** Sync fabric vendors that currently hold a backup of this credential. */
  syncedFabrics: readonly SyncFabricVendor[];
  /**
   * Monotonic sync epoch. Incremented on every backup so conflict detection
   * ("device A has epoch 3, device B has epoch 4, apply epoch 4") can happen
   * at the mock level even though the real FIDO Alliance CTAP 2.2 spec leaves
   * fabric conflict resolution vendor-specific.
   */
  syncEpoch: number;
  /**
   * `true` when the credential was minted on a platform authenticator that
   * bound the credential to a device (biometric-backed). `false` when the
   * credential was minted on a security key with `hasResidentKey: false`.
   * Non-backed-up credentials cannot participate in the sync fabric.
   */
  backupEligible: boolean;
}

/**
 * Sync fabric handle. Real iCloud Keychain / Google Password Manager expose a
 * cloud endpoint; the mock keeps every backup in an in-memory blob store keyed
 * by `credentialId`. The blob shape is opaque to the caller — restore just
 * hands back the original `PasskeyCredential`.
 */
export interface SyncFabric {
  readonly vendor: SyncFabricVendor;
  /** Number of blobs currently held by the fabric. */
  size(): number;
  /**
   * Push a credential blob into the fabric. Idempotent — pushing the same
   * credential twice replaces the earlier blob and bumps the sync epoch.
   */
  backup(credential: PasskeyCredential): void;
  /**
   * Fetch a credential blob by `credentialId`. Returns `null` when the fabric
   * does not hold the credential.
   */
  restore(credentialId: string): PasskeyCredential | null;
  /** Remove a credential blob from the fabric. */
  evict(credentialId: string): boolean;
  /** Snapshot of every backup currently held. */
  list(): PasskeyCredential[];
  /** Drop every blob. Called by `PasskeyTestEnv.reset()`. */
  clear(): void;
}

/**
 * Options accepted by `setupPasskeyEnv`.
 */
export interface SetupPasskeyEnvOptions {
  /**
   * Devices participating in the env. Each device gets an isolated set of
   * platform / roaming authenticators. When omitted the env starts with a
   * single default device (`device-1`) and no authenticators — the caller
   * adds them lazily.
   */
  devices?: SetupPasskeyEnvDeviceOptions[];
  /**
   * Sync fabric vendors to instantiate. Defaults to both iCloud Keychain and
   * Google Password Manager so tests can exercise cross-vendor backup /
   * restore without extra setup.
   */
  fabrics?: SyncFabricVendor[];
}

/**
 * Per-device authenticator preseed. Mirrors the shape a real deployment picks
 * per device (a MacBook has a Touch ID platform authenticator; a Yubikey user
 * carries a security-key roaming authenticator).
 */
export interface SetupPasskeyEnvDeviceOptions {
  deviceId: string;
  platform?: PlatformAuthenticatorOptions;
  roaming?: RoamingAuthenticatorOptions;
}

/**
 * `setupPasskeyEnv` return shape. Extends `TestEnvBase` with the passkey-
 * specific device model and sync fabric surface. Every mutation goes through
 * the env so a single `stop()` call disposes the entire graph.
 */
export interface PasskeyTestEnv extends TestEnvBase<'mock'> {
  readonly devices: readonly string[];
  readonly fabrics: readonly SyncFabric[];
  /**
   * Register a new device. The device starts empty — the caller adds platform
   * / roaming authenticators with `addPlatformAuthenticator` /
   * `addRoamingAuthenticator`.
   */
  addDevice(deviceId: string): void;
  /** Drop a device and every authenticator + credential it owned. */
  removeDevice(deviceId: string): void;
  addPlatformAuthenticator(
    deviceId: string,
    options: PlatformAuthenticatorOptions,
  ): PlatformAuthenticator;
  addRoamingAuthenticator(
    deviceId: string,
    options: RoamingAuthenticatorOptions,
  ): RoamingAuthenticator;
  /** List authenticators bound to a device. */
  listAuthenticators(
    deviceId: string,
  ): readonly (PlatformAuthenticator | RoamingAuthenticator)[];
  /**
   * Create a passkey credential on the specified device. The passkey is
   * automatically minted on the device's platform authenticator (default) or
   * the caller-specified authenticator id.
   */
  createPasskey(
    deviceId: string,
    userId: string,
    options: PublicKeyCredentialCreationOptionsInit,
    authenticatorId?: string,
  ): Promise<AuthenticatorAttestationResponse>;
  /** Get the RP-facing assertion response from a device that holds the passkey. */
  authenticate(
    deviceId: string,
    options: PublicKeyCredentialRequestOptionsInit,
  ): Promise<AuthenticatorAssertionResponse>;
  /** Look up a passkey record by credential id. */
  getPasskey(credentialId: string): PasskeyCredential | null;
  /** Snapshot of every passkey currently registered across every device. */
  listPasskeys(): PasskeyCredential[];
  /** Look up the sync fabric handle by vendor. */
  fabric(vendor: SyncFabricVendor): SyncFabric;
  /**
   * Push a credential into a fabric vendor. Returns the updated credential
   * with the incremented sync epoch and the vendor added to `syncedFabrics`.
   */
  backupCredential(credentialId: string, vendor: SyncFabricVendor): PasskeyCredential;
  /**
   * Pull a credential out of a fabric vendor and register it on the target
   * device. The target device must already exist in the env. Returns the
   * restored credential. Throws when the credential is not held by the
   * fabric or when the calling user does not own the credential.
   */
  restoreCredential(
    targetDeviceId: string,
    userId: string,
    credentialId: string,
    vendor: SyncFabricVendor,
  ): PasskeyCredential;
  /**
   * Sync every backup-eligible credential owned by `userId` between two
   * devices through the shared fabric vendor. Convenience wrapper that
   * chains `backupCredential` (on source) + `restoreCredential` (on target)
   * for each credential.
   */
  syncCredentials(
    sourceDeviceId: string,
    targetDeviceId: string,
    userId: string,
    vendor: SyncFabricVendor,
  ): PasskeyCredential[];
  /** Reset every fabric + credential without disposing the env. */
  reset(): void;
}

/**
 * Re-export the base WebAuthn types the caller needs to interact with the
 * env's `createPasskey` / `authenticate` methods. Keeps the passkey adapter
 * self-contained — a caller does not need to reach into the WebAuthn module.
 */
export type {
  AuthenticatorAssertionResponse,
  AuthenticatorAttestationResponse,
  PublicKeyCredentialCreationOptionsInit,
  PublicKeyCredentialRequestOptionsInit,
  WebAuthnAuthenticatorAttachment,
  WebAuthnCredential,
  WebAuthnTransport,
};
