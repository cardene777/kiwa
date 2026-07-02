import type { AuthAdapter, Doc } from '../adapters/interface.js';

/**
 * User-facing flows the SaaS app exposes. Each flow calls only through the
 * adapter interface so the same code powers both `KIWA_MODE=real` (real
 * Supabase) and `KIWA_MODE=mock` (kiwa mocks).
 */

export async function onboardWithPassword(
  adapter: AuthAdapter,
  input: { email: string; password: string; userMetadata?: Record<string, unknown> },
): Promise<{ userId: string; accessToken: string }> {
  const { user } = await adapter.signUp(input);
  const session = await adapter.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (session.userId !== user.id) {
    throw new Error('onboardWithPassword: sign-in userId mismatch');
  }
  return { userId: session.userId, accessToken: session.accessToken };
}

export async function onboardWithMagicLink(
  adapter: AuthAdapter,
  input: { email: string },
): Promise<{ userId: string; accessToken: string }> {
  const { deliveredCode } = await adapter.requestMagicLink({ email: input.email });
  const session = await adapter.consumeMagicLink({
    email: input.email,
    code: deliveredCode,
  });
  return { userId: session.userId, accessToken: session.accessToken };
}

export async function onboardWithOAuth(
  adapter: AuthAdapter,
  input: { provider: 'github' | 'google'; redirectTo: string },
): Promise<{ userId: string; accessToken: string }> {
  const { code, codeVerifier } = await adapter.requestOAuthPkce(input);
  const session = await adapter.exchangeOAuthPkce({ code, codeVerifier });
  return { userId: session.userId, accessToken: session.accessToken };
}

export async function listMyDocs(
  adapter: AuthAdapter,
  input: { accessToken: string; seedDocs: Doc[] },
): Promise<Doc[]> {
  return adapter.listDocsFor(input);
}

export async function enrollAndVerifyTotp(
  adapter: AuthAdapter,
  input: { accessToken: string; codeProvider: (secret: string) => string },
): Promise<{ aal: 'aal1' | 'aal2'; factorId: string }> {
  const { factorId, secret } = await adapter.enrollTotp({ accessToken: input.accessToken });
  const { aal } = await adapter.verifyTotpChallenge({
    accessToken: input.accessToken,
    factorId,
    code: input.codeProvider(secret),
  });
  return { aal, factorId };
}

export async function ssoLoginFromEnterprise(
  adapter: AuthAdapter,
  input: {
    idpDisplayName: string;
    domain: string;
    userEmail: string;
    firstName: string;
    lastName: string;
    groups: string[];
  },
): Promise<{ userId: string; accessToken: string }> {
  await adapter.registerSamlIdp({
    displayName: input.idpDisplayName,
    domain: input.domain,
  });
  const session = await adapter.ssoLoginWithSaml({
    email: input.userEmail,
    firstName: input.firstName,
    lastName: input.lastName,
    groups: input.groups,
  });
  return { userId: session.userId, accessToken: session.accessToken };
}

export async function connectWithWeb3Wallet(
  adapter: AuthAdapter,
  input: { domain: string; uri: string; privateKey: string },
): Promise<{ address: string; userId: string }> {
  const { session, address } = await adapter.siweLogin(input);
  return { address, userId: session.userId };
}
