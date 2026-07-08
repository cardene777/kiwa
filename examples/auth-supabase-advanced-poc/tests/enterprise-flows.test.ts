import { afterEach, describe, expect, it } from 'vitest';
import {
  setupSupabaseAdvancedEnv,
  type RlsPolicy,
  type SupabaseAdvancedTestEnv,
} from '@kiwa/auth';
import {
  completeSamlSsoLogin,
  completeSiweLogin,
  enrollAndVerifyTotp,
  readDocument,
} from '../src/enterprise-flows.js';

const envs: SupabaseAdvancedTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function makeEnv(
  opts: Parameters<typeof setupSupabaseAdvancedEnv>[0] = {},
): Promise<SupabaseAdvancedTestEnv> {
  const env = await setupSupabaseAdvancedEnv({
    projectUrl: 'https://poc.supabase.co',
    ...opts,
  });
  envs.push(env);
  return env;
}

describe('Supabase Auth advanced PoC — RLS policy mock', () => {
  it('T-SAA-POC-001 owner-only SELECT policy grants + denies rows by userId claim', async () => {
    const ownerPolicy: RlsPolicy = {
      name: 'documents_owner_select',
      table: 'documents',
      command: 'select',
      roles: ['authenticated'],
      using: (row, ctx) => row.ownerId === ctx.userId,
    };
    const env = await makeEnv({
      users: [
        { email: 'alice@example.test', password: 'x', role: 'authenticated' },
        { email: 'mallory@example.test', password: 'x', role: 'authenticated' },
      ],
      policies: [ownerPolicy],
    });
    const aliceLogin = await enrollDummyAndSignIn(env, 'alice@example.test');
    const alloweda = await readDocument(env, {
      accessToken: aliceLogin.accessToken,
      row: { id: 'd1', ownerId: aliceLogin.userId, body: 'hello' },
    });
    expect(alloweda.allowed).toBe(true);
    const malloryLogin = await enrollDummyAndSignIn(env, 'mallory@example.test');
    const alloweda2 = await readDocument(env, {
      accessToken: malloryLogin.accessToken,
      row: { id: 'd1', ownerId: aliceLogin.userId, body: 'hello' },
    });
    expect(alloweda2.allowed).toBe(false);
    expect(alloweda2.reason).toMatch(/no matching RLS policy/);
  });

  it('T-SAA-POC-002 service_role bypasses RLS entirely', async () => {
    const env = await makeEnv({
      users: [{ email: 'svc@example.test', role: 'service_role' }],
      policies: [
        {
          name: 'documents_no_read',
          table: 'documents',
          command: 'select',
          roles: ['authenticated'],
          using: () => false,
        },
      ],
    });
    const svcLogin = await enrollDummyAndSignIn(env, 'svc@example.test', 'service_role');
    const allowed = await readDocument(env, {
      accessToken: svcLogin.accessToken,
      row: { id: 'd1', ownerId: 'anyone', body: 'hello' },
    });
    expect(allowed.allowed).toBe(true);
  });
});

describe('Supabase Auth advanced PoC — MFA TOTP + backup codes', () => {
  it('T-SAA-POC-003 TOTP enroll + challenge + verify upgrades AAL to aal2', async () => {
    const env = await makeEnv({
      users: [{ email: 'alice@example.test', role: 'authenticated' }],
    });
    const alice = env.saml.listIdps() && env.getUserById('user-1');
    if (!alice) throw new Error('setup failure');
    const result = await enrollAndVerifyTotp(env, { userId: alice.id });
    expect(result.aal).toBe('aal2');
    expect(result.factor.verified).toBe(true);
    expect(env.mfa.listFactors(alice.id).some((f) => f.kind === 'totp' && f.verified)).toBe(true);
  });

  it('T-SAA-POC-004 backup codes are consumable once and upgrade AAL', async () => {
    const env = await makeEnv({
      users: [{ email: 'alice@example.test', role: 'authenticated' }],
    });
    const alice = env.getUserById('user-1');
    if (!alice) throw new Error('setup failure');
    const { codes } = await env.mfa.issueBackupCodes({ userId: alice.id });
    expect(codes).toHaveLength(10);
    const first = codes[0]!;
    const result = await env.mfa.consumeBackupCode({ userId: alice.id, code: first });
    expect(result.aal).toBe('aal2');
    await expect(
      env.mfa.consumeBackupCode({ userId: alice.id, code: first }),
    ).rejects.toThrow(/invalid or already consumed/);
  });
});

describe('Supabase Auth advanced PoC — SSO SAML enterprise flow', () => {
  it('T-SAA-POC-005 SAML SSO login upserts a user + returns a session', async () => {
    const env = await makeEnv();
    const idp = env.saml.registerIdp({
      entityId: 'https://sp.example.test/acs',
      ssoUrl: 'https://idp.acme.test/sso',
      signingCertificate: '-----BEGIN CERTIFICATE-----\nMOCK\n-----END CERTIFICATE-----',
      attributeMap: {
        email: 'urn:oid:0.9.2342.19200300.100.1.3',
        firstName: 'urn:oid:2.5.4.42',
        lastName: 'urn:oid:2.5.4.4',
        groups: 'urn:oid:2.16.840.1.113719.1.1.4.1.25',
      },
      metadata: { displayName: 'ACME Okta', domain: 'acme.test' },
    });
    const result = await completeSamlSsoLogin(env, {
      idp,
      email: 'employee@acme.test',
      firstName: 'Emp',
      lastName: 'Loyee',
      groups: ['engineering', 'admin'],
    });
    expect(result.accessToken).toBeTypeOf('string');
    const claims = await env.verifyToken(result.accessToken);
    expect(claims.email).toBe('employee@acme.test');
    expect(claims.amr).toEqual(expect.arrayContaining([
      expect.objectContaining({ method: 'sso:saml:ACME Okta' }),
    ]));
  });

  it('T-SAA-POC-006 SAML assertion is rejected when tampered', async () => {
    const env = await makeEnv();
    const idp = env.saml.registerIdp({
      entityId: 'https://sp.example.test/acs',
      ssoUrl: 'https://idp.acme.test/sso',
      signingCertificate: '',
      attributeMap: { email: 'urn:oid:0.9.2342.19200300.100.1.3' },
      metadata: { displayName: 'ACME Okta', domain: 'acme.test' },
    });
    const authnReq = await env.saml.initiateSsoLogin({ email: 'attacker@acme.test' });
    const original = env.saml.mintAssertion({
      authnRequestId: authnReq.id,
      nameId: 'victim@acme.test',
      attributes: { [idp.attributeMap.email]: 'victim@acme.test' },
    });
    // Tamper the NameID (does not change the signature → verification should fail).
    const tampered = { ...original, nameId: 'attacker@acme.test' };
    await expect(env.saml.exchangeAssertion({ assertion: tampered })).rejects.toThrow(
      /signature mismatch/,
    );
  });
});

describe('Supabase Auth advanced PoC — Web3 wallet auth (EIP-4361 SIWE)', () => {
  it('T-SAA-POC-007 SIWE happy path issues a session bound to the wallet address', async () => {
    const env = await makeEnv();
    const result = await completeSiweLogin(env, {
      privateKey: 'wallet-priv-key-01',
      domain: 'dapp.example.test',
      uri: 'https://dapp.example.test/login',
      chainId: 1,
    });
    expect(result.address).toMatch(/^0x[0-9a-f]{40}$/);
    const claims = await env.verifyToken(result.accessToken);
    expect(claims.email).toBe(`${result.address.toLowerCase()}@wallet.mock`);
    expect(claims.amr).toEqual(expect.arrayContaining([
      expect.objectContaining({ method: 'web3:eip4361' }),
    ]));
  });

  it('T-SAA-POC-008 SIWE nonce cannot be replayed', async () => {
    const env = await makeEnv();
    const first = await completeSiweLogin(env, {
      privateKey: 'wallet-priv-key-02',
      domain: 'dapp.example.test',
      uri: 'https://dapp.example.test/login',
    });
    expect(first.accessToken).toBeTypeOf('string');
    // Re-verify with the same challenge (already consumed).
    const challenges = env.web3.listChallenges();
    expect(challenges).toHaveLength(1);
    await expect(
      env.web3.verifySiweMessage({
        challengeId: challenges[0]!.id,
        signature: 'anything',
        privateKey: 'wallet-priv-key-02',
      }),
    ).rejects.toThrow(/already consumed/);
  });
});

/**
 * Helper — mint an authenticated session for a seeded user without going
 * through core adapter's password flow. Advanced env doesn't expose signIn,
 * so we reach into SAML mint to produce a session by walking the same code
 * path the real `signInWithPassword` would.
 */
async function enrollDummyAndSignIn(
  env: SupabaseAdvancedTestEnv,
  email: string,
  role: 'authenticated' | 'anon' | 'service_role' = 'authenticated',
): Promise<{ userId: string; accessToken: string }> {
  const idp = env.saml.registerIdp({
    entityId: 'https://sp.mock/acs',
    ssoUrl: 'https://idp.mock/sso',
    signingCertificate: '',
    attributeMap: { email: 'mail' },
    metadata: { displayName: 'MockIdp', domain: email.split('@')[1]! },
  });
  const authnReq = await env.saml.initiateSsoLogin({ email });
  const assertion = env.saml.mintAssertion({
    authnRequestId: authnReq.id,
    nameId: email,
    attributes: { [idp.attributeMap.email]: email },
  });
  const { accessToken, userId } = await env.saml.exchangeAssertion({ assertion });
  // If the seed user's role is not `authenticated`, override via getUserById lookup —
  // the SAML exchange upserts with `authenticated` by default. The pre-seeded
  // role wins because we don't overwrite existing users.
  const existing = env.getUserById(userId);
  if (existing && existing.role !== role) {
    // The role stored in the token is fixed by exchange time; caller test
    // must pre-seed the user with the desired role.
  }
  return { userId, accessToken };
}
