import { base64UrlEncode, normalizeChallenge } from './encoding.js';
import type {
  AuthenticatorAttestationResponse,
  AuthenticatorSelectionCriteria,
  PublicKeyCredentialCreationOptionsInit,
  VirtualAuthenticator,
  WebAuthnCredential,
} from './types.js';

let credentialCounter = 0;

export function __resetCredentialCounter(): void {
  credentialCounter = 0;
}

/**
 * Serialize `authenticatorSelection.residentKey` to the WebAuthn L3 canonical
 * discoverable flag. `residentKey: 'required' | 'preferred'` both mark the
 * credential discoverable; `discouraged` and unset fall through to the legacy
 * `requireResidentKey` boolean (§5.4.4).
 */
function resolveDiscoverable(
  selection: AuthenticatorSelectionCriteria | undefined,
): boolean {
  if (!selection) return false;
  if (selection.residentKey === 'required' || selection.residentKey === 'preferred') {
    return true;
  }
  if (selection.residentKey === 'discouraged') return false;
  return selection.requireResidentKey === true;
}

/**
 * Simulate `navigator.credentials.create({ publicKey })`. Produces an
 * `AuthenticatorAttestationResponse` shaped like WebAuthn L3 §5.2.1 and
 * writes the resulting credential into the authenticator's in-memory store.
 *
 * Called from `WebAuthnTestEnv.credentialCreation` — the env passes the
 * authenticator selected by the caller (or its default).
 */
export function credentialCreation(
  options: PublicKeyCredentialCreationOptionsInit,
  authenticator: VirtualAuthenticator,
  credentialStore: Map<string, WebAuthnCredential>,
  globalRegistry: Map<string, WebAuthnCredential>,
  credentialOwnership: Map<string, string>,
): AuthenticatorAttestationResponse {
  if (!options.rp?.id) {
    throw new Error('credentialCreation: rp.id is required');
  }
  if (!options.user?.id) {
    throw new Error('credentialCreation: user.id is required');
  }
  if (options.challenge === undefined || options.challenge === null) {
    throw new Error('credentialCreation: challenge is required');
  }
  const selection = options.authenticatorSelection;
  if (
    selection?.authenticatorAttachment &&
    selection.authenticatorAttachment !== authenticator.attachment
  ) {
    throw new Error(
      `credentialCreation: authenticatorAttachment "${selection.authenticatorAttachment}" does not match authenticator "${authenticator.attachment}"`,
    );
  }
  if (selection?.userVerification === 'required' && !authenticator.hasUserVerification) {
    throw new Error(
      'credentialCreation: userVerification=required but authenticator does not support user verification',
    );
  }
  const discoverable = resolveDiscoverable(selection);
  if (discoverable && !authenticator.hasResidentKey) {
    throw new Error(
      'credentialCreation: residentKey=required but authenticator does not have resident key storage',
    );
  }
  // Exclude list — if an existing credential id matches, reject per §5.1.3 step 20.
  if (options.excludeCredentials?.length) {
    for (const excluded of options.excludeCredentials) {
      if (globalRegistry.has(excluded.id)) {
        throw new Error(
          `credentialCreation: excludeCredentials matched existing credential "${excluded.id}"`,
        );
      }
    }
  }
  const attestation = options.attestation ?? 'none';
  const challenge = normalizeChallenge(options.challenge);
  credentialCounter += 1;
  const credentialId = `credential-${credentialCounter}`;
  const userHandle =
    typeof options.user.id === 'string'
      ? options.user.id
      : base64UrlEncode(options.user.id);
  const publicKey = base64UrlEncode(`public-key::${credentialId}::${options.rp.id}`);

  const clientData = {
    type: 'webauthn.create',
    challenge,
    origin: `https://${options.rp.id}`,
    crossOrigin: false,
  };
  const clientDataJSON = base64UrlEncode(JSON.stringify(clientData));

  // AttestationObject is CBOR in the real spec; the mock emits a base64url
  // deterministic string tagged with the attestation mode so tests can inspect
  // which mode the RP asked for.
  const attestationObject = base64UrlEncode(
    `attestation::${attestation}::${credentialId}::${options.rp.id}`,
  );

  const credential: WebAuthnCredential = {
    credentialId,
    userHandle,
    publicKey,
    signCount: 0,
    transports: [authenticator.transport],
    attachment: authenticator.attachment,
    discoverable,
    createdAt: Date.now(),
  };
  credentialStore.set(credentialId, credential);
  globalRegistry.set(credentialId, credential);
  credentialOwnership.set(credentialId, authenticator.id);

  return {
    credentialId,
    clientDataJSON,
    attestationObject,
    attestation,
    publicKey,
    transports: [authenticator.transport],
    attachment: authenticator.attachment,
  };
}
