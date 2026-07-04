export type {
  AuthenticatorAssertionResponse,
  AuthenticatorAttestationResponse,
  PasskeyCredential,
  PasskeyTestEnv,
  PlatformAuthenticator,
  PlatformAuthenticatorOptions,
  PlatformBiometricModality,
  PublicKeyCredentialCreationOptionsInit,
  PublicKeyCredentialRequestOptionsInit,
  RoamingAuthenticator,
  RoamingAuthenticatorKind,
  RoamingAuthenticatorOptions,
  SetupPasskeyEnvDeviceOptions,
  SetupPasskeyEnvOptions,
  SyncFabric,
  SyncFabricVendor,
  WebAuthnAuthenticatorAttachment,
  WebAuthnCredential,
  WebAuthnTransport,
} from './types.js';
export { createPlatformAuthenticator } from './platform.js';
export { createRoamingAuthenticator } from './roaming.js';
export { createSyncFabric } from './sync-fabric.js';
export {
  backupCredential,
  findFabricHolding,
  requireFabric,
  restoreCredential,
  syncCredentials,
} from './credential-sync.js';
export {
  __resetPasskeyCounters,
  setupPasskeyEnv,
} from './setup-passkey-env.js';
export type {
  CaBLEBLEHandshake,
  CaBLECredentialMigration,
  CaBLEQRCodePayload,
  CaBLESession,
  CaBLESessionOptions,
  CaBLESignatureRoundtrip,
  CaBLEStep,
  CaBLEWebSocketTunnel,
} from './caBLE/index.js';
export {
  encodeCaBLEQRURI,
  establishWebSocketTunnel,
  generateCaBLEQRCode,
  migrateCredential,
  performBLEHandshake,
  performSignatureRoundtrip,
  runCaBLESession,
} from './caBLE/index.js';
