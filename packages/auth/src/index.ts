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
