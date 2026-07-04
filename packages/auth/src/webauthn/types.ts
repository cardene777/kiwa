import type { TestEnvBase } from '@kiwa-test/core';

/**
 * Chrome Virtual Authenticator API mirrors WebAuthn L3 spec §6.2. Transport
 * defines how the client speaks to the authenticator — `internal` for platform
 * authenticators (Touch ID / Windows Hello), `usb` / `nfc` / `ble` for roaming
 * security keys. The `hybrid` transport was rebranded to `caBLE` in later drafts
 * and is covered by the passkey adapter (v1.21-1b), not here.
 */
export type WebAuthnTransport = 'internal' | 'usb' | 'nfc' | 'ble' | 'hybrid';

/**
 * `platform` — authenticator is bound to the device (Touch ID, Windows Hello).
 * `cross-platform` — authenticator is a roaming key (YubiKey, phone via caBLE).
 * Mirrors the `authenticatorAttachment` field from WebAuthn L3 §5.4.5.
 */
export type WebAuthnAuthenticatorAttachment = 'platform' | 'cross-platform';

/**
 * Attestation conveyance preference (WebAuthn L3 §5.4.7).
 *
 * `none` — RP does not want attestation, authenticator returns a self-signed
 * empty attestation. `indirect` — client may substitute an anonymized attestation
 * CA. `direct` — RP wants the raw attestation statement. `enterprise` — RP is
 * allowed to receive uniquely-identifying attestation (enterprise deployments
 * only). The mock returns matching attestation object shapes for each.
 */
export type WebAuthnAttestationConveyancePreference =
  | 'none'
  | 'indirect'
  | 'direct'
  | 'enterprise';

/**
 * `required` — user verification (biometric / PIN) is mandatory.
 * `preferred` — request but do not require UV.
 * `discouraged` — do not perform UV (WebAuthn L3 §5.4.6).
 */
export type WebAuthnUserVerificationRequirement =
  | 'required'
  | 'preferred'
  | 'discouraged';

/**
 * `required` — credential must be stored on the authenticator (discoverable
 * / resident credential, enables usernameless login). `preferred` — store if
 * possible. `discouraged` — do not store (server-side credential, WebAuthn
 * L3 §5.4.6).
 */
export type WebAuthnResidentKeyRequirement =
  | 'required'
  | 'preferred'
  | 'discouraged';

/**
 * Authenticator selection criteria (WebAuthn L3 §5.4.4). Combines the fields
 * an RP passes to `navigator.credentials.create({ publicKey: { authenticatorSelection } })`.
 */
export interface AuthenticatorSelectionCriteria {
  authenticatorAttachment?: WebAuthnAuthenticatorAttachment;
  userVerification?: WebAuthnUserVerificationRequirement;
  residentKey?: WebAuthnResidentKeyRequirement;
  /** Legacy alias — `residentKey: 'required'` supersedes when both are set. */
  requireResidentKey?: boolean;
}

/**
 * Simplified `PublicKeyCredentialCreationOptions` (WebAuthn L3 §5.4). The real
 * spec surfaces `Uint8Array` challenge / user.id — the mock accepts either the
 * spec shape or plain strings and normalizes internally.
 */
export interface PublicKeyCredentialCreationOptionsInit {
  rp: { id: string; name: string };
  user: { id: string | Uint8Array; name: string; displayName: string };
  challenge: string | Uint8Array;
  pubKeyCredParams?: Array<{ type: 'public-key'; alg: number }>;
  timeout?: number;
  excludeCredentials?: Array<{ id: string; type: 'public-key' }>;
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  attestation?: WebAuthnAttestationConveyancePreference;
}

/**
 * Simplified `PublicKeyCredentialRequestOptions` (WebAuthn L3 §5.5). Used by
 * `credentialAssertion` when the RP asks the client to prove possession.
 */
export interface PublicKeyCredentialRequestOptionsInit {
  rpId: string;
  challenge: string | Uint8Array;
  timeout?: number;
  allowCredentials?: Array<{ id: string; type: 'public-key' }>;
  userVerification?: WebAuthnUserVerificationRequirement;
}

/**
 * Stored credential record. WebAuthn L3 §6.1 defines the authenticator-side
 * storage — the mock keeps the shape the RP would round-trip through its own
 * database. `signCount` is the monotonic counter used to detect cloned
 * authenticators (§6.1.1).
 */
export interface WebAuthnCredential {
  credentialId: string;
  userHandle: string;
  publicKey: string;
  signCount: number;
  transports: WebAuthnTransport[];
  attachment: WebAuthnAuthenticatorAttachment;
  discoverable: boolean;
  /** Millisecond wall clock at credential creation, for ordering / audit. */
  createdAt: number;
  /** Millisecond wall clock at last successful assertion. */
  lastUsedAt?: number;
}

/**
 * Authenticator attestation response — the client returns this to the RP after
 * `navigator.credentials.create()`. The mock produces a shape compatible with
 * WebAuthn L3 §5.2.1; `attestationObject` and `clientDataJSON` are the two
 * fields real RPs decode.
 */
export interface AuthenticatorAttestationResponse {
  credentialId: string;
  clientDataJSON: string;
  attestationObject: string;
  attestation: WebAuthnAttestationConveyancePreference;
  publicKey: string;
  transports: WebAuthnTransport[];
  attachment: WebAuthnAuthenticatorAttachment;
}

/**
 * Authenticator assertion response — the client returns this to the RP after
 * `navigator.credentials.get()`. The mock produces a shape compatible with
 * WebAuthn L3 §5.2.2. `signCount` is returned so the RP can update its stored
 * counter and detect cloned authenticators.
 */
export interface AuthenticatorAssertionResponse {
  credentialId: string;
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
  userHandle: string;
  signCount: number;
}

/**
 * Configuration for `createVirtualAuthenticator`. Mirrors the Chrome Virtual
 * Authenticator Protocol (`WebAuthn.addVirtualAuthenticator` in the DevTools
 * protocol, used by Playwright / Puppeteer).
 */
export interface VirtualAuthenticatorOptions {
  attachment: WebAuthnAuthenticatorAttachment;
  transport: WebAuthnTransport;
  /**
   * When `true` the authenticator stores discoverable credentials
   * (resident keys) that survive across sessions.
   */
  hasResidentKey?: boolean;
  /**
   * When `true` the authenticator can perform user verification (biometric /
   * PIN). When `false` the authenticator is UV=false regardless of RP
   * preference.
   */
  hasUserVerification?: boolean;
  /**
   * When `true` the authenticator claims user presence for every assertion
   * (default). When `false` the mock returns UP=0 to simulate an authenticator
   * that failed the touch gesture.
   */
  isUserPresent?: boolean;
}

/**
 * Virtual authenticator handle. Callers do not construct this directly — use
 * `createVirtualAuthenticator({ ... })`.
 */
export interface VirtualAuthenticator {
  readonly id: string;
  readonly attachment: WebAuthnAuthenticatorAttachment;
  readonly transport: WebAuthnTransport;
  readonly hasResidentKey: boolean;
  readonly hasUserVerification: boolean;
  isUserPresent: boolean;
  /** Snapshot of credentials currently stored on this authenticator. */
  listCredentials(): WebAuthnCredential[];
}

/**
 * `setupWebAuthnEnv` return shape. Follows the kiwa factory convention — one
 * `stop()` disposes the environment and clears all in-memory state.
 */
export interface WebAuthnTestEnv extends TestEnvBase<'mock'> {
  readonly authenticators: readonly VirtualAuthenticator[];
  addAuthenticator(options: VirtualAuthenticatorOptions): VirtualAuthenticator;
  removeAuthenticator(id: string): void;
  credentialCreation(
    options: PublicKeyCredentialCreationOptionsInit,
    authenticatorId?: string,
  ): Promise<AuthenticatorAttestationResponse>;
  credentialAssertion(
    options: PublicKeyCredentialRequestOptionsInit,
  ): Promise<AuthenticatorAssertionResponse>;
  getCredential(credentialId: string): WebAuthnCredential | null;
  listCredentials(): WebAuthnCredential[];
  deleteCredential(credentialId: string): boolean;
  reset(): void;
}

/**
 * Options accepted by `setupWebAuthnEnv`. Callers can preseed the environment
 * with authenticators or leave it empty and add them lazily.
 */
export interface SetupWebAuthnEnvOptions {
  authenticators?: VirtualAuthenticatorOptions[];
}
