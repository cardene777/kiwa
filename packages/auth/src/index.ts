export type {
  AuthAccount,
  AuthDatabaseAdapter,
  AuthProfile,
  AuthSession,
  AuthUser,
  NextAuthTestEnv,
  ProviderKind,
  ProviderMock,
  SessionStrategy,
  SetupNextAuthEnvOptions,
  VerificationToken,
} from './types.js';
export { setupNextAuthEnv } from './setup-nextauth-env.js';
export { createInMemoryAdapter } from './adapter.js';
export {
  buildProviderRegistry,
  createEmailProviderMock,
  createGithubProviderMock,
  createGoogleProviderMock,
} from './providers.js';
export { issueSession, upsertUserFromProfile } from './session.js';

// Lucia v3 adapter surface.
export type {
  LuciaDatabaseAdapter,
  LuciaDatabaseKind,
  LuciaOAuthAccount,
  LuciaOAuthProfile,
  LuciaProviderKind,
  LuciaProviderMock,
  LuciaSession,
  LuciaTestEnv,
  LuciaUser,
  SetupLuciaEnvOptions,
} from './lucia/types.js';
export { setupLuciaEnv } from './lucia/setup-lucia-env.js';
export { createInMemoryLuciaAdapter } from './lucia/adapter.js';
export {
  buildLuciaProviderRegistry,
  createLuciaGithubProviderMock,
  createLuciaGoogleProviderMock,
} from './lucia/providers.js';
export {
  createSessionFor,
  generateSessionId,
  invalidateSessionsForUser,
  validateSessionId,
} from './lucia/session.js';
export { hashPassword, verifyPassword } from './lucia/password.js';

// Better Auth adapter surface.
export type {
  BetterAuthAccount,
  BetterAuthDatabaseAdapter,
  BetterAuthDatabaseKind,
  BetterAuthMembership,
  BetterAuthOAuthProfile,
  BetterAuthOrganization,
  BetterAuthPasskey,
  BetterAuthPluginKind,
  BetterAuthProviderKind,
  BetterAuthProviderMock,
  BetterAuthSession,
  BetterAuthTestEnv,
  BetterAuthUser,
  BetterAuthVerification,
  SetupBetterAuthEnvOptions,
} from './better-auth/types.js';
export {
  generateTotpCode,
  setupBetterAuthEnv,
} from './better-auth/setup-better-auth-env.js';
export { createInMemoryBetterAuthAdapter } from './better-auth/adapter.js';
export {
  buildBetterAuthProviderRegistry,
  createBetterAuthGithubProviderMock,
  createBetterAuthGoogleProviderMock,
} from './better-auth/providers.js';
export {
  createSessionFor as createBetterAuthSessionFor,
  generateSessionId as generateBetterAuthSessionId,
  generateSessionToken as generateBetterAuthSessionToken,
  invalidateSessionsForUser as invalidateBetterAuthSessionsForUser,
  validateSessionByToken as validateBetterAuthSessionByToken,
} from './better-auth/session.js';
export {
  hashPassword as hashBetterAuthPassword,
  verifyPassword as verifyBetterAuthPassword,
} from './better-auth/password.js';
export {
  generateTotpSecret,
  verifyTotpCode,
} from './better-auth/totp.js';

// Clerk adapter surface.
export type {
  ClerkEmailAddress,
  ClerkExternalAccount,
  ClerkOrganization,
  ClerkOrganizationMembership,
  ClerkOrganizationRole,
  ClerkPhoneNumber,
  ClerkSession,
  ClerkSessionClaims,
  ClerkTestEnv,
  ClerkUser,
  SetupClerkEnvOptions,
} from './clerk/types.js';
export { setupClerkEnv } from './clerk/setup-clerk-env.js';
export {
  generateSigningSecret as generateClerkSigningSecret,
  signClerkJwt,
  verifyClerkJwt,
} from './clerk/jwt.js';

// Auth0 adapter surface.
export type {
  Auth0AccessTokenClaims,
  Auth0Action,
  Auth0ActionApi,
  Auth0ActionEvent,
  Auth0ActionTrigger,
  Auth0Connection,
  Auth0Identity,
  Auth0IdTokenClaims,
  Auth0Rule,
  Auth0RuleContext,
  Auth0TestEnv,
  Auth0User,
  SetupAuth0EnvOptions,
} from './auth0/types.js';
export { setupAuth0Env } from './auth0/setup-auth0-env.js';
export {
  generateAuth0SigningSecret,
  signAuth0AccessToken,
  signAuth0IdToken,
  verifyAuth0AccessToken,
  verifyAuth0IdToken,
} from './auth0/jwt.js';

// Supabase Auth core adapter surface (v1.10-1, GH #667).
export type {
  SetupSupabaseAuthEnvOptions,
  SupabaseAccessTokenClaims,
  SupabaseAuthTestEnv,
  SupabaseIdentity,
  SupabaseIdentityProvider,
  SupabaseOAuthAuthorizationUrl,
  SupabaseOtpDelivery,
  SupabaseSession,
  SupabaseUser,
} from './supabase/types.js';
export { setupSupabaseAuthEnv } from './supabase/setup-supabase-auth-env.js';
export {
  generateSupabaseSigningSecret,
  generateSupabaseRefreshToken,
  signSupabaseAccessToken,
  verifySupabaseAccessToken,
} from './supabase/jwt.js';

// Supabase Auth advanced adapter surface (v1.10-2, GH #668).
export type {
  MfaAal,
  MfaBackupCode,
  MfaChallenge,
  MfaFactor,
  MfaFactorKind,
  RlsCheckInput,
  RlsCheckOutcome,
  RlsCommand,
  RlsPolicy,
  RlsPolicyContext,
  SamlAssertion,
  SamlAuthnRequest,
  SamlIdentityProvider,
  SetupSupabaseAdvancedEnvOptions,
  SiweChallenge,
  SiweMessage,
  SupabaseAdvancedTestEnv,
} from './supabase-advanced/types.js';
export {
  buildOtpAuthUri as buildSupabaseOtpAuthUri,
  deriveMockAddress as deriveSupabaseMockAddress,
  generateBackupCodes as generateSupabaseBackupCodes,
  generateSiweNonce as generateSupabaseSiweNonce,
  generateTotpCode as generateSupabaseTotpCode,
  generateTotpSecret as generateSupabaseTotpSecret,
  serializeSiweMessage as serializeSupabaseSiweMessage,
  setupSupabaseAdvancedEnv,
  verifyTotpCode as verifySupabaseTotpCode,
} from './supabase-advanced/setup-supabase-advanced-env.js';

// WebAuthn L3 protocol adapter surface (v1.21-1a, GH #848).
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
} from './webauthn/types.js';
export {
  __resetWebAuthnCounters,
  base64UrlDecode as base64UrlDecodeWebAuthn,
  base64UrlEncode as base64UrlEncodeWebAuthn,
  clientDataHash as webAuthnClientDataHash,
  createVirtualAuthenticator,
  credentialAssertion as webAuthnCredentialAssertion,
  credentialCreation as webAuthnCredentialCreation,
  mockSignature as webAuthnMockSignature,
  normalizeChallenge as webAuthnNormalizeChallenge,
  setupWebAuthnEnv,
} from './webauthn/index.js';

// Passkey adapter surface (v1.21-1b, GH #849). Layered on top of the WebAuthn
// L3 primitives — adds device grouping, platform / roaming authenticator
// specialization, and sync fabric semantics (iCloud Keychain / Google
// Password Manager backup + restore).
export type {
  PasskeyCredential,
  PasskeyTestEnv,
  PlatformAuthenticator,
  PlatformAuthenticatorOptions,
  PlatformBiometricModality,
  RoamingAuthenticator,
  RoamingAuthenticatorKind,
  RoamingAuthenticatorOptions,
  SetupPasskeyEnvDeviceOptions,
  SetupPasskeyEnvOptions,
  SyncFabric,
  SyncFabricVendor,
} from './passkey/types.js';
export {
  __resetPasskeyCounters,
  backupCredential as backupPasskeyCredential,
  createPlatformAuthenticator,
  createRoamingAuthenticator,
  createSyncFabric,
  findFabricHolding as findPasskeyFabricHolding,
  requireFabric as requirePasskeyFabric,
  restoreCredential as restorePasskeyCredential,
  setupPasskeyEnv,
  syncCredentials as syncPasskeyCredentials,
} from './passkey/index.js';

// Passkey caBLE (CTAP2 hybrid transport) surface (v1.22-4, GH #890). Adds
// QR code + BLE advertisement handshake + WebSocket tunnel establishment +
// credential migration + signature roundtrip on top of the passkey adapter
// so the fidelity harness can walk the phone → laptop cross-device flow
// end-to-end without driving a real Bluetooth stack.
export type {
  CaBLEBLEHandshake,
  CaBLECredentialMigration,
  CaBLEQRCodePayload,
  CaBLESession,
  CaBLESessionOptions,
  CaBLESignatureRoundtrip,
  CaBLEStep,
  CaBLEWebSocketTunnel,
} from './passkey/caBLE/index.js';
export {
  encodeCaBLEQRURI,
  establishWebSocketTunnel,
  generateCaBLEQRCode,
  migrateCredential,
  performBLEHandshake,
  performSignatureRoundtrip,
  runCaBLESession,
} from './passkey/caBLE/index.js';

// OAuth 2.1 adapter surface (v1.21-1c, GH #850). Mock Authorization Server
// covering RFC 9700 (OAuth 2.1) + RFC 9449 (DPoP) + RFC 7636 (PKCE S256) +
// RFC 7009 (revocation) + RFC 7662 (introspection). Rejects the historical
// grants OAuth 2.1 dropped — `implicit`, `password`, `client_credentials`
// grant paths refuse at the type level and at runtime.
export type {
  AccessToken,
  AuthorizationRequest,
  AuthorizationResponse,
  AuthorizationServer,
  AuthorizationServerOptions,
  AuthorizationUser,
  ClientRegistration,
  DpopJwk,
  DpopProof,
  DpopProofInput,
  IntrospectionResponse,
  OAuth21GrantType,
  OAuth21TestEnv,
  PkceChallenge,
  PkceChallengeMethod,
  RefreshToken,
  SetupOAuth21EnvOptions,
  TokenRequest,
  TokenResponse,
} from './oauth21/types.js';
export {
  __resetDpopCounters,
  __resetOAuth21Counters,
  __resetPkceCounter,
  __resetTokenCounters,
  computeJkt as computeDpopJkt,
  createAuthorizationServer,
  createDpopProof,
  createMockDpopJwk,
  createPkceChallenge,
  deriveCodeChallenge,
  generateCodeVerifier,
  mintAccessToken,
  mintRefreshToken,
  parseDpopProof,
  rotateRefreshToken,
  setupOAuth21Env,
  verifyCodeChallenge,
  verifyDpopProof,
} from './oauth21/index.js';

// OIDC adapter surface (v1.21-1d, GH #851). Mock OpenID Provider covering
// OpenID Connect Core 1.0 (§2 id_token + §3.1.3.6-7 hashes) + Discovery 1.0
// + RFC 7591 Dynamic Client Registration + JWKS rotation w/ retention
// window + OpenID Federation 1.0 §7 trust-chain resolution. Layers on top
// of the OAuth 2.1 adapter (v1.21-1c) — the OP is really the OAuth 2.1 AS
// with the OIDC extensions bolted on. The mock re-uses the OAuth 2.1
// authorization_code + PKCE + DPoP flow verbatim and adds the id_token /
// discovery / DCR / JWKS / federation surface on top.
export type {
  ClientRegistrationRequest,
  ClientRegistrationResponse,
  DiscoveryEndpoint,
  EntityStatement as OidcEntityStatement,
  IdToken,
  IdTokenClaims,
  JwksDocument,
  JwksEndpoint,
  JwksKey,
  OidcTestEnv,
  OpenIdProviderMetadata,
  ResolveTrustChainInput,
  SetupOidcEnvOptions,
  SignIdTokenInput,
  TrustAnchor,
  TrustChainReasonCode,
  TrustChainResult,
  VerifyIdTokenOptions,
  VerifyIdTokenResult,
} from './oidc/types.js';
export {
  __resetDcrCounter,
  __resetIdTokenCounter,
  __resetJwksCounter,
  __resetOidcCounters,
  computeTokenHash,
  createDcrEndpoint,
  createDiscoveryEndpoint,
  createEntityStatement as createOidcEntityStatement,
  createIdTokenSigner,
  createJwksEndpoint,
  createTrustAnchor as createOidcTrustAnchor,
  dynamicClientRegistration,
  mintSoftwareStatement,
  resolveTrustChain as resolveOidcTrustChain,
  setupOidcEnv,
} from './oidc/index.js';
