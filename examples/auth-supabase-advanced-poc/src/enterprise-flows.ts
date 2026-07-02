import type {
  SupabaseAdvancedTestEnv,
  MfaFactor,
  SamlAssertion,
  SamlIdentityProvider,
} from '@kiwa-test/auth';
import { deriveSupabaseMockAddress, generateSupabaseTotpCode } from '@kiwa-test/auth';

/**
 * Enterprise + dApp advanced flows tied together for the PoC. Real Supabase
 * apps split these across API routes + client callbacks; here we stitch them
 * so the test can drive the end-to-end path in a handful of lines.
 */

/**
 * Simulate a documents table protected by an RLS policy that only allows the
 * owner to select their own rows. Returns whether the subject can read the
 * candidate row.
 */
export async function readDocument(
  env: SupabaseAdvancedTestEnv,
  input: { accessToken: string; row: { id: string; ownerId: string; body: string } },
): Promise<{ allowed: boolean; reason: string | undefined }> {
  const outcome = await env.rls.checkRlsAccess({
    table: 'documents',
    command: 'select',
    accessToken: input.accessToken,
    row: input.row,
  });
  return { allowed: outcome.allowed, reason: outcome.reason };
}

/**
 * Full TOTP enrollment + challenge → verify roundtrip. Returns the verified
 * factor and the resulting AAL after upgrade.
 */
export async function enrollAndVerifyTotp(
  env: SupabaseAdvancedTestEnv,
  input: { userId: string },
): Promise<{ factor: MfaFactor; verifiedAt: Date; aal: 'aal1' | 'aal2' }> {
  const { factor } = await env.mfa.enrollTotp({ userId: input.userId });
  const challenge = await env.mfa.challenge({ factorId: factor.id });
  const code = generateSupabaseTotpCode(factor.secret);
  const result = await env.mfa.verifyChallenge({ challengeId: challenge.id, code });
  return { factor: result.factor, verifiedAt: result.factor.updatedAt, aal: result.aal };
}

/**
 * Full SAML SSO flow — an app-side initiated login, IdP-side assertion mint,
 * then app-side exchange. Returns the resulting session tokens.
 */
export async function completeSamlSsoLogin(
  env: SupabaseAdvancedTestEnv,
  input: {
    idp: SamlIdentityProvider;
    email: string;
    firstName: string;
    lastName: string;
    groups: string[];
  },
): Promise<{ accessToken: string; sessionId: string; assertion: SamlAssertion }> {
  const authnReq = await env.saml.initiateSsoLogin({ email: input.email });
  const attributes: Record<string, string | string[]> = {
    [input.idp.attributeMap.email]: input.email,
  };
  if (input.idp.attributeMap.firstName) {
    attributes[input.idp.attributeMap.firstName] = input.firstName;
  }
  if (input.idp.attributeMap.lastName) {
    attributes[input.idp.attributeMap.lastName] = input.lastName;
  }
  if (input.idp.attributeMap.groups) {
    attributes[input.idp.attributeMap.groups] = input.groups;
  }
  const assertion = env.saml.mintAssertion({
    authnRequestId: authnReq.id,
    nameId: input.email,
    attributes,
  });
  const { accessToken, sessionId } = await env.saml.exchangeAssertion({ assertion });
  return { accessToken, sessionId, assertion };
}

/**
 * EIP-4361 SIWE login flow. Returns the session tokens issued upon successful
 * signature verification.
 */
export async function completeSiweLogin(
  env: SupabaseAdvancedTestEnv,
  input: { privateKey: string; domain: string; uri: string; chainId?: number },
): Promise<{ address: string; accessToken: string; sessionId: string }> {
  const address = deriveSupabaseMockAddress(input.privateKey);
  const challengeArgs: Parameters<typeof env.web3.createSiweChallenge>[0] = {
    address,
    domain: input.domain,
    uri: input.uri,
  };
  if (input.chainId !== undefined) challengeArgs.chainId = input.chainId;
  const challenge = await env.web3.createSiweChallenge(challengeArgs);
  const signature = env.web3.signSiweMessage({
    message: challenge.message,
    privateKey: input.privateKey,
  });
  const { accessToken, sessionId } = await env.web3.verifySiweMessage({
    challengeId: challenge.id,
    signature,
    privateKey: input.privateKey,
  });
  return { address, accessToken, sessionId };
}
