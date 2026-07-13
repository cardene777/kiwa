import { afterEach, describe, expect, it } from 'vitest';
import { setupClerkEnv, type ClerkTestEnv } from '../src/index.js';

const envs: ClerkTestEnv[] = [];
afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('setupClerkEnv defensive branches — organization + session flows', () => {
  it('signIn throws when user with the given email is unknown', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    await expect(
      env.signIn({ email: 'nonexistent@example.com' }),
    ).rejects.toThrow(/unknown user email/);
  });

  it('signIn throws when organizationSlug does not exist', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    await env.users.createUser({
      primaryEmailAddress: 'ownerslug@example.com',
    });
    await expect(
      env.signIn({
        email: 'ownerslug@example.com',
        organizationSlug: 'nonexistent-org',
      }),
    ).rejects.toThrow(/unknown organization slug/);
  });

  it('createSession throws when userId does not exist', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    await expect(
      env.sessions.createSession({ userId: 'user_nonexistent' }),
    ).rejects.toThrow(/unknown user id/);
  });

  it('sessions.getSession throws for unknown id', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    await expect(
      env.sessions.getSession('sess_nonexistent'),
    ).rejects.toThrow(/not found sess_nonexistent/);
  });

  it('sessions.revokeSession throws for unknown id', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    await expect(
      env.sessions.revokeSession('sess_nonexistent'),
    ).rejects.toThrow(/not found sess_nonexistent/);
  });

  it('sessions.revokeSession changes status to revoked', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    const user = await env.users.createUser({
      primaryEmailAddress: 'r@example.com',
    });
    const created = await env.sessions.createSession({ userId: user.id });
    const revoked = await env.sessions.revokeSession(created.session.id);
    expect(revoked.status).toBe('revoked');
  });

  it('organizations.getOrganization throws for unknown id', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    await expect(
      env.organizations.getOrganization('org_nonexistent'),
    ).rejects.toThrow(/not found org_nonexistent/);
  });

  it('organizations.updateMembership throws when membership not found', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    await expect(
      env.organizations.updateMembership({
        organizationId: 'org_x',
        userId: 'user_y',
        role: 'admin',
      }),
    ).rejects.toThrow(/updateMembership: not found org_x\/user_y/);
  });

  it('verifyToken throws when session status becomes revoked', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    await env.users.createUser({
      primaryEmailAddress: 'vt@example.com',
    });
    const { session, token } = await env.signIn({
      email: 'vt@example.com',
    });
    await env.sessions.revokeSession(session.id);
    await expect(env.verifyToken(token)).rejects.toThrow(
      /status is revoked/,
    );
  });

  it('signIn with valid organizationSlug returns session bound to org', async () => {
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
    const result = await env.signIn({
      email: 'owner@example.com',
      organizationSlug: 'acme',
    });
    expect(result.token).toBeDefined();
    expect(result.user.id).toBe(owner.id);
  });
});
