import { afterEach, describe, expect, it } from 'vitest';
import { setupClerkEnv, type ClerkTestEnv } from '../src/index.js';

const envs: ClerkTestEnv[] = [];
afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('setupClerkEnv residual defensive branches', () => {
  it('signIn embeds orgId + orgRole + orgSlug claims in token when signed in with org', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    const owner = await env.users.createUser({
      primaryEmailAddress: 'owner@example.com',
    });
    await env.organizations.createOrganization({
      name: 'Acme',
      slug: 'acme',
      createdBy: owner.id,
    });
    const { token } = await env.signIn({
      email: 'owner@example.com',
      organizationSlug: 'acme',
    });
    const claims = await env.verifyToken(token);
    expect(claims.org_id).toBeDefined();
    expect(claims.org_slug).toBe('acme');
    expect(claims.org_role).toBe('owner');
  });

  it('seed organization with publicMetadata is preserved on creation', async () => {
    const env = await setupClerkEnv({
      users: [{ primaryEmailAddress: 'seed@example.com' }],
      orgs: [
        {
          name: 'Seeded',
          slug: 'seeded-org',
          createdByEmail: 'seed@example.com',
          publicMetadata: { region: 'jp' },
        },
      ],
    });
    envs.push(env);
    const org = await env.organizations.getOrganizationBySlug('seeded-org');
    expect(org?.publicMetadata).toEqual({ region: 'jp' });
  });

  it('sessions.createSession with organizationId resolves org via getOrganization', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    const owner = await env.users.createUser({
      primaryEmailAddress: 'orgid@example.com',
    });
    const org = await env.organizations.createOrganization({
      name: 'ByOrgId',
      slug: 'by-org-id',
      createdBy: owner.id,
    });
    const created = await env.sessions.createSession({
      userId: owner.id,
      organizationId: org.id,
    });
    expect(created.session.activeOrganizationId).toBe(org.id);
  });

  it('sessions.createSession without organizationId proceeds with undefined orgSlug', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    const user = await env.users.createUser({
      primaryEmailAddress: 'noorg@example.com',
    });
    const created = await env.sessions.createSession({
      userId: user.id,
    });
    expect(created.session.activeOrganizationId).toBeUndefined();
  });

  it('organizations.createOrganization with publicMetadata preserved', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    const owner = await env.users.createUser({
      primaryEmailAddress: 'meta@example.com',
    });
    const org = await env.organizations.createOrganization({
      name: 'MetaOrg',
      slug: 'meta-org',
      createdBy: owner.id,
      publicMetadata: { tier: 'gold' },
    });
    expect(org.publicMetadata).toEqual({ tier: 'gold' });
  });

  it('organizations.getOrganizationBySlug returns undefined for unknown slug', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    const result = await env.organizations.getOrganizationBySlug(
      'nonexistent-slug',
    );
    expect(result == null).toBe(true);
  });

  it('verifyToken throws when session expired (expiresAt in past)', async () => {
    const env = await setupClerkEnv({ sessionExpiration: 1 });
    envs.push(env);
    await env.users.createUser({
      primaryEmailAddress: 'exp@example.com',
    });
    const { token } = await env.signIn({ email: 'exp@example.com' });
    // Wait for session to expire.
    await new Promise((r) => setTimeout(r, 1100));
    await expect(env.verifyToken(token)).rejects.toThrow(/expired/);
  });
});
