import { afterEach, describe, expect, it } from 'vitest';
import {
  setupSupabaseAdvancedEnv,
  generateSupabaseTotpCode,
  deriveSupabaseMockAddress,
  serializeSupabaseSiweMessage,
  verifySupabaseTotpCode,
  type RlsPolicy,
  type SupabaseAdvancedTestEnv,
} from '../src/index.js';

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
  const env = await setupSupabaseAdvancedEnv({ projectUrl: 'https://poc.supabase.co', ...opts });
  envs.push(env);
  return env;
}

describe('setupSupabaseAdvancedEnv (options validation)', () => {
  it('T-SAA-001 rejects non-positive sessionExpiration', async () => {
    await expect(setupSupabaseAdvancedEnv({ sessionExpiration: 0 })).rejects.toThrow(
      /sessionExpiration must be positive/,
    );
  });

  it('T-SAA-002 rejects non-positive mfaChallengeExpiration', async () => {
    await expect(setupSupabaseAdvancedEnv({ mfaChallengeExpiration: -1 })).rejects.toThrow(
      /mfaChallengeExpiration must be positive/,
    );
  });

  it('T-SAA-003 rejects non-positive siweNonceExpiration', async () => {
    await expect(setupSupabaseAdvancedEnv({ siweNonceExpiration: 0 })).rejects.toThrow(
      /siweNonceExpiration must be positive/,
    );
  });

  it('T-SAA-004 exposes defaults when options omitted', async () => {
    const env = await makeEnv();
    expect(env.sessionExpiration).toBe(3600);
    expect(env.mfaChallengeExpiration).toBe(300);
    expect(env.siweNonceExpiration).toBe(600);
  });
});

describe('setupSupabaseAdvancedEnv (RLS)', () => {
  const ownerPolicy: RlsPolicy = {
    name: 'documents_owner_select',
    table: 'documents',
    command: 'select',
    roles: ['authenticated'],
    using: (row, ctx) => row.ownerId === ctx.userId,
  };

  it('T-SAA-005 defineRlsPolicy + listPolicies round-trip', async () => {
    const env = await makeEnv();
    env.rls.defineRlsPolicy(ownerPolicy);
    expect(env.rls.listPolicies('documents')).toHaveLength(1);
  });

  it('T-SAA-006 dropRlsPolicy removes the named policy', async () => {
    const env = await makeEnv({ policies: [ownerPolicy] });
    env.rls.dropRlsPolicy('documents', 'documents_owner_select');
    expect(env.rls.listPolicies()).toHaveLength(0);
  });

  it('T-SAA-007 checkRlsAccess with no matching policy denies', async () => {
    const env = await makeEnv({
      users: [{ email: 'a@e.test' }],
    });
    const login = await mintSessionForUser(env, 'a@e.test');
    const outcome = await env.rls.checkRlsAccess({
      table: 'documents',
      command: 'select',
      accessToken: login.accessToken,
      row: { id: '1', ownerId: 'anyone' },
    });
    expect(outcome.allowed).toBe(false);
    expect(outcome.reason).toMatch(/no RLS policy grants/);
  });

  it('T-SAA-008 checkRlsAccess grants when USING predicate matches', async () => {
    const env = await makeEnv({
      users: [{ email: 'a@e.test' }],
      policies: [ownerPolicy],
    });
    const login = await mintSessionForUser(env, 'a@e.test');
    const outcome = await env.rls.checkRlsAccess({
      table: 'documents',
      command: 'select',
      accessToken: login.accessToken,
      row: { id: '1', ownerId: login.userId },
    });
    expect(outcome.allowed).toBe(true);
    expect(outcome.matchedPolicy).toBe('documents_owner_select');
  });

  it('T-SAA-009 checkRlsAccess denies when USING predicate does not match', async () => {
    const env = await makeEnv({
      users: [{ email: 'a@e.test' }],
      policies: [ownerPolicy],
    });
    const login = await mintSessionForUser(env, 'a@e.test');
    const outcome = await env.rls.checkRlsAccess({
      table: 'documents',
      command: 'select',
      accessToken: login.accessToken,
      row: { id: '1', ownerId: 'someone-else' },
    });
    expect(outcome.allowed).toBe(false);
  });

  it('T-SAA-010 service_role bypasses RLS', async () => {
    const env = await makeEnv({
      users: [{ email: 'svc@e.test', role: 'service_role' }],
    });
    const login = await mintSessionForUser(env, 'svc@e.test');
    const outcome = await env.rls.checkRlsAccess({
      table: 'documents',
      command: 'select',
      accessToken: login.accessToken,
      row: { id: '1', ownerId: 'anyone' },
    });
    expect(outcome.allowed).toBe(true);
    expect(outcome.matchedPolicy).toBe('service_role bypass');
  });

  it('T-SAA-011 WITH CHECK gates INSERT', async () => {
    const env = await makeEnv({
      users: [{ email: 'a@e.test' }],
      policies: [
        {
          name: 'documents_insert_own',
          table: 'documents',
          command: 'insert',
          roles: ['authenticated'],
          withCheck: (row, ctx) => row.ownerId === ctx.userId,
        },
      ],
    });
    const login = await mintSessionForUser(env, 'a@e.test');
    const ok = await env.rls.checkRlsAccess({
      table: 'documents',
      command: 'insert',
      accessToken: login.accessToken,
      newRow: { id: '1', ownerId: login.userId },
    });
    expect(ok.allowed).toBe(true);
    const bad = await env.rls.checkRlsAccess({
      table: 'documents',
      command: 'insert',
      accessToken: login.accessToken,
      newRow: { id: '1', ownerId: 'x' },
    });
    expect(bad.allowed).toBe(false);
  });

  it('T-SAA-012 policy redefinition replaces the prior policy', async () => {
    const env = await makeEnv({ policies: [ownerPolicy] });
    env.rls.defineRlsPolicy({ ...ownerPolicy, using: () => true });
    expect(env.rls.listPolicies('documents')).toHaveLength(1);
  });
});

describe('setupSupabaseAdvancedEnv (MFA)', () => {
  async function seedUser(): Promise<{ env: SupabaseAdvancedTestEnv; userId: string }> {
    const env = await makeEnv({ users: [{ email: 'a@e.test', role: 'authenticated' }] });
    const u = env.getUserById('user-1');
    if (!u) throw new Error('seed failed');
    return { env, userId: u.id };
  }

  it('T-SAA-013 enrollTotp returns a factor + otpAuthUri', async () => {
    const { env, userId } = await seedUser();
    const { factor, otpAuthUri } = await env.mfa.enrollTotp({ userId });
    expect(factor.kind).toBe('totp');
    expect(factor.verified).toBe(false);
    expect(otpAuthUri).toMatch(/^otpauth:\/\/totp\//);
    expect(otpAuthUri).toContain(`secret=${factor.secret}`);
  });

  it('T-SAA-014 challenge + verify with valid TOTP code marks factor verified', async () => {
    const { env, userId } = await seedUser();
    const { factor } = await env.mfa.enrollTotp({ userId });
    const chal = await env.mfa.challenge({ factorId: factor.id });
    const code = generateSupabaseTotpCode(factor.secret);
    const result = await env.mfa.verifyChallenge({ challengeId: chal.id, code });
    expect(result.aal).toBe('aal2');
    expect(result.factor.verified).toBe(true);
  });

  it('T-SAA-015 verifyChallenge rejects wrong code', async () => {
    const { env, userId } = await seedUser();
    const { factor } = await env.mfa.enrollTotp({ userId });
    const chal = await env.mfa.challenge({ factorId: factor.id });
    await expect(env.mfa.verifyChallenge({ challengeId: chal.id, code: '000000' })).rejects.toThrow(
      /invalid code/,
    );
  });

  it('T-SAA-016 verifyChallenge cannot be used twice', async () => {
    const { env, userId } = await seedUser();
    const { factor } = await env.mfa.enrollTotp({ userId });
    const chal = await env.mfa.challenge({ factorId: factor.id });
    const code = generateSupabaseTotpCode(factor.secret);
    await env.mfa.verifyChallenge({ challengeId: chal.id, code });
    await expect(env.mfa.verifyChallenge({ challengeId: chal.id, code })).rejects.toThrow(
      /already verified/,
    );
  });

  it('T-SAA-017 enrollPhone + challenge + verify with SMS code', async () => {
    const { env, userId } = await seedUser();
    const { factor } = await env.mfa.enrollPhone({ userId, phone: '+15551234' });
    const chal = await env.mfa.challenge({ factorId: factor.id });
    expect(chal.smsCode).toBeTypeOf('string');
    const result = await env.mfa.verifyChallenge({ challengeId: chal.id, code: chal.smsCode! });
    expect(result.aal).toBe('aal2');
  });

  it('T-SAA-018 issueBackupCodes returns 10 codes + consumeBackupCode invalidates', async () => {
    const { env, userId } = await seedUser();
    const { codes } = await env.mfa.issueBackupCodes({ userId });
    expect(codes).toHaveLength(10);
    const first = codes[0]!;
    await env.mfa.consumeBackupCode({ userId, code: first });
    await expect(env.mfa.consumeBackupCode({ userId, code: first })).rejects.toThrow(
      /already consumed/,
    );
  });

  it('T-SAA-019 verifyTotpCode helper handles ±30s window', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const now = 1_700_000_000;
    const code = generateSupabaseTotpCode(secret, now);
    expect(verifySupabaseTotpCode(secret, code, now)).toBe(true);
    expect(verifySupabaseTotpCode(secret, code, now + 30)).toBe(true);
    expect(verifySupabaseTotpCode(secret, code, now + 90)).toBe(false);
  });
});

describe('setupSupabaseAdvancedEnv (SAML)', () => {
  it('T-SAA-020 registerIdp + listIdps round-trip', async () => {
    const env = await makeEnv();
    const idp = env.saml.registerIdp({
      entityId: 'sp',
      ssoUrl: 'https://idp.test/sso',
      signingCertificate: '',
      attributeMap: { email: 'mail' },
      metadata: { displayName: 'Test', domain: 'acme.test' },
    });
    expect(env.saml.listIdps()).toEqual([expect.objectContaining({ id: idp.id })]);
  });

  it('T-SAA-021 initiateSsoLogin errors when no IdP matches the email domain', async () => {
    const env = await makeEnv();
    await expect(env.saml.initiateSsoLogin({ email: 'x@nowhere.test' })).rejects.toThrow(
      /no SAML IdP registered/,
    );
  });

  it('T-SAA-022 full mint + exchange upserts a user + issues session', async () => {
    const env = await makeEnv();
    const idp = env.saml.registerIdp({
      entityId: 'sp',
      ssoUrl: 'https://idp.acme.test/sso',
      signingCertificate: '',
      attributeMap: { email: 'mail', firstName: 'given', lastName: 'family' },
      metadata: { displayName: 'Acme', domain: 'acme.test' },
    });
    const req = await env.saml.initiateSsoLogin({ email: 'emp@acme.test' });
    const assertion = env.saml.mintAssertion({
      authnRequestId: req.id,
      nameId: 'emp@acme.test',
      attributes: { mail: 'emp@acme.test', given: 'Emp', family: 'Ployee' },
    });
    const result = await env.saml.exchangeAssertion({ assertion });
    expect(result.userId).toBeTypeOf('string');
    const claims = await env.verifyToken(result.accessToken);
    expect(claims.email).toBe('emp@acme.test');
    expect(claims.app_metadata).toEqual(
      expect.objectContaining({
        provider: 'saml',
        sso: expect.objectContaining({ domain: 'acme.test', idp: idp.metadata.displayName }),
      }),
    );
  });

  it('T-SAA-023 exchangeAssertion rejects tampered assertion', async () => {
    const env = await makeEnv();
    const idp = env.saml.registerIdp({
      entityId: 'sp',
      ssoUrl: '',
      signingCertificate: '',
      attributeMap: { email: 'mail' },
      metadata: { displayName: 'X', domain: 'acme.test' },
    });
    const req = await env.saml.initiateSsoLogin({ email: 'x@acme.test' });
    const original = env.saml.mintAssertion({
      authnRequestId: req.id,
      nameId: 'x@acme.test',
      attributes: { [idp.attributeMap.email]: 'x@acme.test' },
    });
    const tampered = { ...original, nameId: 'y@acme.test' };
    await expect(env.saml.exchangeAssertion({ assertion: tampered })).rejects.toThrow(
      /signature mismatch/,
    );
  });

  it('T-SAA-024 expired assertion is rejected', async () => {
    const env = await makeEnv();
    env.saml.registerIdp({
      entityId: '',
      ssoUrl: '',
      signingCertificate: '',
      attributeMap: { email: 'mail' },
      metadata: { displayName: 'X', domain: 'acme.test' },
    });
    const req = await env.saml.initiateSsoLogin({ email: 'x@acme.test' });
    const assertion = env.saml.mintAssertion({
      authnRequestId: req.id,
      nameId: 'x@acme.test',
      attributes: { mail: 'x@acme.test' },
      expiresIn: -60,
    });
    await expect(env.saml.exchangeAssertion({ assertion })).rejects.toThrow(/expired/);
  });
});

describe('setupSupabaseAdvancedEnv (Web3 SIWE)', () => {
  it('T-SAA-025 createSiweChallenge builds an EIP-4361 message', async () => {
    const env = await makeEnv();
    const addr = deriveSupabaseMockAddress('key-1');
    const chal = await env.web3.createSiweChallenge({
      address: addr,
      domain: 'dapp.test',
      uri: 'https://dapp.test',
      chainId: 5,
    });
    expect(chal.message.address).toBe(addr);
    expect(chal.message.chainId).toBe(5);
    const serialized = serializeSupabaseSiweMessage(chal.message);
    expect(serialized).toContain(`URI: https://dapp.test`);
    expect(serialized).toContain(`Chain ID: 5`);
  });

  it('T-SAA-026 signSiweMessage + verifySiweMessage happy path issues session', async () => {
    const env = await makeEnv();
    const key = 'wallet-key-alpha';
    const addr = deriveSupabaseMockAddress(key);
    const chal = await env.web3.createSiweChallenge({
      address: addr,
      domain: 'dapp.test',
      uri: 'https://dapp.test',
    });
    const sig = env.web3.signSiweMessage({ message: chal.message, privateKey: key });
    const { accessToken, userId } = await env.web3.verifySiweMessage({
      challengeId: chal.id,
      signature: sig,
      privateKey: key,
    });
    expect(userId).toBeTypeOf('string');
    const claims = await env.verifyToken(accessToken);
    expect(claims.email).toBe(`${addr.toLowerCase()}@wallet.mock`);
  });

  it('T-SAA-027 verifySiweMessage rejects wrong private key', async () => {
    const env = await makeEnv();
    const key = 'wallet-key-alpha';
    const addr = deriveSupabaseMockAddress(key);
    const chal = await env.web3.createSiweChallenge({
      address: addr,
      domain: 'dapp.test',
      uri: 'https://dapp.test',
    });
    const sig = env.web3.signSiweMessage({ message: chal.message, privateKey: key });
    await expect(
      env.web3.verifySiweMessage({
        challengeId: chal.id,
        signature: sig,
        privateKey: 'different-key',
      }),
    ).rejects.toThrow(/does not match message address/);
  });

  it('T-SAA-028 nonce cannot be replayed', async () => {
    const env = await makeEnv();
    const key = 'wallet-key-beta';
    const addr = deriveSupabaseMockAddress(key);
    const chal = await env.web3.createSiweChallenge({
      address: addr,
      domain: 'dapp.test',
      uri: 'https://dapp.test',
    });
    const sig = env.web3.signSiweMessage({ message: chal.message, privateKey: key });
    await env.web3.verifySiweMessage({ challengeId: chal.id, signature: sig, privateKey: key });
    await expect(
      env.web3.verifySiweMessage({ challengeId: chal.id, signature: sig, privateKey: key }),
    ).rejects.toThrow(/already consumed/);
  });

  it('T-SAA-029 tampered signature is rejected', async () => {
    const env = await makeEnv();
    const key = 'wallet-key-gamma';
    const addr = deriveSupabaseMockAddress(key);
    const chal = await env.web3.createSiweChallenge({
      address: addr,
      domain: 'dapp.test',
      uri: 'https://dapp.test',
    });
    await expect(
      env.web3.verifySiweMessage({
        challengeId: chal.id,
        signature: 'not-a-real-signature',
        privateKey: key,
      }),
    ).rejects.toThrow(/signature verification failed/);
  });
});

describe('setupSupabaseAdvancedEnv (env lifecycle)', () => {
  it('T-SAA-030 stop() resets state', async () => {
    const env = await setupSupabaseAdvancedEnv({
      users: [{ email: 'a@e.test' }],
    });
    expect(env.getUserById('user-1')).not.toBeNull();
    await env.stop();
    expect(env.getUserById('user-1')).toBeNull();
  });

  it('T-SAA-031 verifyToken rejects tokens from another env', async () => {
    const env1 = await makeEnv({ users: [{ email: 'a@e.test' }] });
    const env2 = await makeEnv();
    const login = await mintSessionForUser(env1, 'a@e.test');
    await expect(env2.verifyToken(login.accessToken)).rejects.toThrow();
  });
});

async function mintSessionForUser(
  env: SupabaseAdvancedTestEnv,
  email: string,
): Promise<{ userId: string; accessToken: string }> {
  const domain = email.split('@')[1]!;
  const idp = env.saml.registerIdp({
    entityId: 'sp',
    ssoUrl: '',
    signingCertificate: '',
    attributeMap: { email: 'mail' },
    metadata: { displayName: 'HelperIdp', domain },
  });
  const req = await env.saml.initiateSsoLogin({ email });
  const assertion = env.saml.mintAssertion({
    authnRequestId: req.id,
    nameId: email,
    attributes: { [idp.attributeMap.email]: email },
  });
  const { accessToken, userId } = await env.saml.exchangeAssertion({ assertion });
  return { userId, accessToken };
}
