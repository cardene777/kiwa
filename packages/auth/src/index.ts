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
