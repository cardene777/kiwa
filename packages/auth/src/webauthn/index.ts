export type {
  AuthenticatorAssertionResponse,
  AuthenticatorAttestationResponse,
  AuthenticatorSelectionCriteria,
  PublicKeyCredentialCreationOptionsInit,
  PublicKeyCredentialRequestOptionsInit,
  SetupWebAuthnEnvOptions,
  VirtualAuthenticator,
  VirtualAuthenticatorOptions,
  WebAuthnAttestationConveyancePreference,
  WebAuthnAuthenticatorAttachment,
  WebAuthnCredential,
  WebAuthnResidentKeyRequirement,
  WebAuthnTestEnv,
  WebAuthnTransport,
  WebAuthnUserVerificationRequirement,
} from './types.js';
export { createVirtualAuthenticator } from './authenticator.js';
export { credentialCreation } from './creation.js';
export { credentialAssertion } from './assertion.js';
export {
  __resetWebAuthnCounters,
  setupWebAuthnEnv,
} from './setup-webauthn-env.js';
export {
  base64UrlDecode,
  base64UrlEncode,
  clientDataHash,
  mockSignature,
  normalizeChallenge,
} from './encoding.js';
