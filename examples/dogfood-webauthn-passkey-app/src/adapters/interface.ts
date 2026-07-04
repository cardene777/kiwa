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
  AuthenticatorAttestationResponse,
  AuthenticatorSelectionCriteria,
  WebAuthnAttestationConveyancePreference,
  WebAuthnCredential,
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
 * Trace event — every adapter method appends one entry to a shared trace
 * buffer. Downstream tests diff the trace across the two adapters to detect
 * behavioural divergences.
 */
export interface TraceEvent {
  op: 'register' | 'listCredentials' | 'deleteCredential' | 'reset';
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
