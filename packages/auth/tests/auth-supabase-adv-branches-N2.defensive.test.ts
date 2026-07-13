import { afterEach, describe, expect, it } from 'vitest';
import {
  setupSupabaseAdvancedEnv,
  generateSupabaseTotpCode,
  type SupabaseAdvancedTestEnv,
} from '../src/index.js';

const envs: SupabaseAdvancedTestEnv[] = [];
afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function seedEnv(): Promise<{
  env: SupabaseAdvancedTestEnv;
  userId: string;
}> {
  const env = await setupSupabaseAdvancedEnv({
    projectUrl: 'https://poc.supabase.co',
    users: [{ email: 'a@e.test', role: 'authenticated' }],
  });
  envs.push(env);
  const u = env.getUserById('user-1');
  if (!u) throw new Error('seed failed');
  return { env, userId: u.id };
}

describe('setupSupabaseAdvancedEnv defensive branches — MFA + SAML', () => {
  it('mfa.enrollTotp throws for unknown user', async () => {
    const { env } = await seedEnv();
    await expect(
      env.mfa.enrollTotp({ userId: 'user_missing', friendlyName: 'TOTP' }),
    ).rejects.toThrow(/enrollTotp: user .* not found/);
  });

  it('mfa.enrollPhone throws for unknown user', async () => {
    const { env } = await seedEnv();
    await expect(
      env.mfa.enrollPhone({
        userId: 'user_missing',
        phone: '+15550001111',
      }),
    ).rejects.toThrow(/enrollPhone: user .* not found/);
  });

  it('mfa.verifyChallenge throws when challenge already verified', async () => {
    const { env, userId } = await seedEnv();
    const { factor } = await env.mfa.enrollTotp({ userId });
    const chal = await env.mfa.challenge({ factorId: factor.id });
    const code = generateSupabaseTotpCode(factor.secret);
    await env.mfa.verifyChallenge({ challengeId: chal.id, code });
    await expect(
      env.mfa.verifyChallenge({ challengeId: chal.id, code }),
    ).rejects.toThrow(/already verified/);
  });

  it('mfa.verifyChallenge accepts phone SMS code path', async () => {
    const { env, userId } = await seedEnv();
    const { factor } = await env.mfa.enrollPhone({
      userId,
      phone: '+15550001111',
    });
    const chal = await env.mfa.challenge({ factorId: factor.id });
    expect(chal.smsCode).toBeDefined();
    const result = await env.mfa.verifyChallenge({
      challengeId: chal.id,
      code: chal.smsCode as string,
    });
    expect(result.aal).toBe('aal2');
  });

  it('mfa.enrollTotp uses userId as accountName when email is undefined', async () => {
    const env = await setupSupabaseAdvancedEnv({
      projectUrl: 'https://poc.supabase.co',
      users: [{ phone: '+15551234567', role: 'authenticated' }],
    });
    envs.push(env);
    const u = env.getUserById('user-1');
    if (!u) throw new Error('seed failed');
    const { otpAuthUri } = await env.mfa.enrollTotp({ userId: u.id });
    expect(otpAuthUri).toMatch(/^otpauth:\/\/totp\//);
  });

  it('saml.mintAssertion throws when AuthnRequest is not found', async () => {
    const { env } = await seedEnv();
    expect(() =>
      env.saml.mintAssertion({
        authnRequestId: 'authn_missing',
        nameId: 'user@example.com',
        attributes: {},
      }),
    ).toThrow(/authn request not found|no longer/);
  });

  it('saml.exchangeAssertion throws on signature mismatch (tampered)', async () => {
    const env = await setupSupabaseAdvancedEnv({
      projectUrl: 'https://poc.supabase.co',
      samlIdps: [
        {
          entityId: 'urn:mock',
          ssoUrl: 'https://mock/idp',
          attributeMap: { email: 'nameId' },
          signingCertificate: 'mock-cert',
          metadata: { displayName: 'Mock', domain: 'example.com' },
        },
      ],
    });
    envs.push(env);
    const idps = env.saml.listIdps();
    const authnReq = await env.saml.initiateSsoLogin({
      email: 'user@example.com',
      relayState: 'rs-1',
    });
    const assertion = env.saml.mintAssertion({
      authnRequestId: authnReq.id,
      nameId: 'user@example.com',
      attributes: {},
    });
    const tampered = {
      ...assertion,
      nameId: 'attacker@example.com',
    };
    await expect(
      env.saml.exchangeAssertion({ assertion: tampered }),
    ).rejects.toThrow(/signature mismatch/);
    expect(idps.length).toBeGreaterThan(0);
  });
});
