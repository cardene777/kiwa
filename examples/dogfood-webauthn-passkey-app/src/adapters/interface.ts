/**
 * Provider-neutral WebAuthn RP (Relying Party) surface for the dogfood app.
 *
 * The Next.js app talks to WebAuthn only through this interface. Two
 * implementations exist —
 *  - {@link makeRealAdapter} (drives Chrome Virtual Authenticator + a
 *    SimpleWebAuthn-shaped RP server, skipped when the environment cannot
 *    reach a headed Chrome)
 *  - {@link makeMockAdapter} (backed by `@kiwa-test/auth`'s
 *    `setupWebAuthnEnv` + `credentialCreation` / `credentialAssertion`)
 *
 * Both must satisfy the same contract so behavioural fidelity between real
 * vs mock can be measured side-by-side and fed to the release gate.
 */

import type {
  AuthenticatorAssertionResponse,
  AuthenticatorAttestationResponse,
  AuthenticatorSelectionCriteria,
  WebAuthnAttestationConveyancePreference,
  WebAuthnCredential,
  WebAuthnUserVerificationRequirement,
} from '@kiwa-test/auth';

/**
 * Input the RP consumes at the start of the registration ceremony. Mirrors
 * the fields a real client passes to `navigator.credentials.create({
 * publicKey })`.
 */
export interface RegisterInput {
  rp: { id: string; name: string };
  user: { id: string; name: string; displayName: string };
  challenge: string;
  attestation?: WebAuthnAttestationConveyancePreference;
  authenticatorSelection?: AuthenticatorSelectionCriteria;
}

/**
 * Output the RP produces after a successful registration ceremony.
 *
 * Includes the raw {@link AuthenticatorAttestationResponse} the client
 * returned (verbatim from the authenticator so fidelity harnesses can diff
 * `attestationObject` / `clientDataJSON` / `signature` byte-for-byte) plus
 * the persisted {@link WebAuthnCredential} the RP would write to its own
 * database.
 */
export interface RegisterResult {
  credential: WebAuthnCredential;
  attestationResponse: AuthenticatorAttestationResponse;
}

/**
 * Input the RP consumes at the start of the assertion (signin) ceremony.
 * Mirrors the fields a real client passes to `navigator.credentials.get({
 * publicKey })`. `allowCredentialIds` is optional — an empty / omitted list
 * lets the authenticator surface any discoverable (resident-key) credential
 * per WebAuthn L3 §5.5 step 3.
 */
export interface SigninInput {
  rpId: string;
  challenge: string;
  allowCredentialIds?: string[];
  userVerification?: WebAuthnUserVerificationRequirement;
}

/**
 * Output the RP produces after a successful assertion.
 *
 * Includes the raw {@link AuthenticatorAssertionResponse} from the
 * authenticator (`clientDataJSON` / `authenticatorData` / `signature`) plus
 * the RP-side `verifiedCredential` snapshot — post-increment `signCount` +
 * `lastUsedAt` — so the fidelity harness can diff monotonic counter movement
 * across mock and real adapters.
 */
export interface SigninResult {
  assertionResponse: AuthenticatorAssertionResponse;
  verifiedCredential: WebAuthnCredential;
  /**
   * `signCount` value the RP had persisted **before** this assertion. Real
   * WebAuthn RPs use `previousSignCount < signCount` as the clone-detection
   * check (§6.1.1) — surfacing both sides lets the harness assert the
   * monotonic bump without re-reading the store.
   */
  previousSignCount: number;
}

/**
 * Trace event — every adapter method appends one entry to a shared trace
 * buffer. Downstream tests diff the trace across the two adapters to detect
 * behavioural divergences.
 */
export interface TraceEvent {
  op: 'register' | 'signin' | 'listCredentials' | 'deleteCredential' | 'reset';
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

export interface WebAuthnRPAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  /**
   * Drive a full registration ceremony — RP issues the credential creation
   * options, the authenticator (real Chrome Virtual Authenticator or kiwa
   * mock) produces an attestation, the RP verifies and persists it. Both
   * adapters must return the same shape so fidelity axes 1-4 can be
   * compared.
   */
  register(input: RegisterInput): Promise<RegisterResult>;

  /**
   * Drive a full assertion (signin) ceremony. WebAuthn L3 §7.2 —
   * authenticator produces an `AuthenticatorAssertionResponse`, RP verifies
   * `clientData.type === 'webauthn.get'`, challenge match, origin match,
   * `signCount` monotonic bump, and updates the persisted credential. Both
   * adapters must return the same {@link SigninResult} shape so Sub-Issue
   * #857 fidelity axes (signature format / counter increment / credential id
   * match) can be diffed side-by-side.
   */
  signin(input: SigninInput): Promise<SigninResult>;

  /**
   * Snapshot of every persisted credential the RP is currently tracking.
   * Sub-Issue #859 (residentKey + `/manage`) fleshes this out; Sub-Issue
   * #856 (this one) exposes it so the register-attestation tests can assert
   * on side-effects.
   */
  listCredentials(): WebAuthnCredential[];

  /**
   * Delete a stored credential (called from `/manage`).
   */
  deleteCredential(credentialId: string): boolean;

  reset(): Promise<void>;
}
