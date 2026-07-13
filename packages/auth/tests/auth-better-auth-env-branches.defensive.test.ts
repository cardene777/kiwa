import { describe, expect, it } from 'vitest';
import { setupBetterAuthEnv } from '../src/better-auth/setup-better-auth-env.js';

describe('better-auth/setup-better-auth-env defensive branches', () => {
  it('consumeMagicLink skips update when existing user already emailVerified', async () => {
    const env = await setupBetterAuthEnv({
      providers: ['google'],
      plugins: ['magicLink', 'emailAndPassword'],
    });
    // First magic-link click creates user with emailVerified=true.
    const { token: token1 } = await env.sendMagicLink({
      email: 'a@example.com',
    });
    await env.consumeMagicLink({
      email: 'a@example.com',
      token: token1,
    });
    // Second magic-link click for the same user hits the branch where
    // existing.emailVerified is already true → skip update path.
    const { token: token2 } = await env.sendMagicLink({
      email: 'a@example.com',
    });
    const result = await env.consumeMagicLink({
      email: 'a@example.com',
      token: token2,
    });
    expect(result.user.emailVerified).toBe(true);
    expect(result.session).toBeDefined();
  });

  it('createOrganization succeeds when owner exists (happy path)', async () => {
    const env = await setupBetterAuthEnv({
      providers: ['google'],
      plugins: ['organizations', 'emailAndPassword'],
    });
    const signedUp = await env.signUpWithPassword({
      email: 'owner@example.com',
      password: 'pw-1234567',
    });
    const org = await env.createOrganization({
      name: 'ACME',
      slug: 'acme',
      userId: signedUp.user.id,
    });
    expect(org.name).toBe('ACME');
    expect(org.slug).toBe('acme');
  });
});
