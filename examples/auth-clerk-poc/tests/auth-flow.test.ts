import { afterEach, describe, expect, it } from 'vitest';
import { setupClerkEnv, type ClerkTestEnv } from '@kiwa-lab/auth';
import {
  createAdminRoute,
  createProtectedRoute,
  type ProtectedProfile,
} from '../src/route.js';

const envs: ClerkTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function callProtected(
  env: ClerkTestEnv,
  token: string,
): Promise<{ status: number; body: ProtectedProfile | { error: string; reason?: string } }> {
  const handler = createProtectedRoute(env);
  const res = await handler(
    new Request('http://kiwa.test/api/me', {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    }),
  );
  const body = (await res.json()) as ProtectedProfile | { error: string; reason?: string };
  return { status: res.status, body };
}

async function callAdmin(
  env: ClerkTestEnv,
  token: string,
): Promise<{ status: number; body: ProtectedProfile | { error: string } }> {
  const handler = createAdminRoute(env);
  const res = await handler(
    new Request('http://kiwa.test/api/admin', {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    }),
  );
  const body = (await res.json()) as ProtectedProfile | { error: string };
  return { status: res.status, body };
}

describe('clerk PoC — token verification', () => {
  it('T-CL-001 valid Clerk JWT unlocks the protected route with user profile', async () => {
    const env = await setupClerkEnv({
      users: [{ primaryEmailAddress: 'alice@clerk.test', firstName: 'Alice' }],
    });
    envs.push(env);
    const { token } = await env.signIn({ email: 'alice@clerk.test' });
    const res = await callProtected(env, token);
    expect(res.status).toBe(200);
    const body = res.body as ProtectedProfile;
    expect(body.primaryEmailAddress).toBe('alice@clerk.test');
    expect(body.userId).toMatch(/^user_/);
    // Non-org session — no org_id in the response.
    expect(body.activeOrganizationId).toBeUndefined();
  });

  it('T-CL-002 missing Authorization header returns 401', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    const res = await callProtected(env, '');
    expect(res.status).toBe(401);
    expect((res.body as { error: string }).error).toBe('missing token');
  });

  it('T-CL-003 invalid JWT signature returns 401 with reason', async () => {
    const env = await setupClerkEnv({
      users: [{ primaryEmailAddress: 'bob@clerk.test' }],
    });
    envs.push(env);
    const { token } = await env.signIn({ email: 'bob@clerk.test' });
    const parts = token.split('.');
    const sig = parts[2] ?? '';
    parts[2] = (sig[0] === 'a' ? 'b' : 'a') + sig.slice(1);
    const tampered = parts.join('.');
    const res = await callProtected(env, tampered);
    expect(res.status).toBe(401);
    expect((res.body as { error: string; reason?: string }).error).toBe('invalid token');
  });

  it('T-CL-004 revoked session rejects further requests', async () => {
    const env = await setupClerkEnv({
      users: [{ primaryEmailAddress: 'carol@clerk.test' }],
    });
    envs.push(env);
    const { session, token } = await env.signIn({ email: 'carol@clerk.test' });
    // First call succeeds — sanity check.
    expect((await callProtected(env, token)).status).toBe(200);
    await env.sessions.revokeSession(session.id);
    const res = await callProtected(env, token);
    expect(res.status).toBe(401);
  });
});

describe('clerk PoC — multi-tenant organizations', () => {
  it('T-CL-005 org-scoped signIn embeds org_id + org_role in the protected response', async () => {
    const env = await setupClerkEnv({
      users: [{ primaryEmailAddress: 'dave@clerk.test' }],
      orgs: [{ name: 'DaveOrg', slug: 'daveorg', createdByEmail: 'dave@clerk.test' }],
    });
    envs.push(env);
    const { token, session } = await env.signIn({
      email: 'dave@clerk.test',
      organizationSlug: 'daveorg',
    });
    const res = await callProtected(env, token);
    expect(res.status).toBe(200);
    const body = res.body as ProtectedProfile;
    expect(body.activeOrganizationId).toBe(session.activeOrganizationId);
    expect(body.organizationRole).toBe('owner');
  });

  it('T-CL-006 non-admin member is 403 on the admin-only route', async () => {
    const env = await setupClerkEnv({
      users: [
        { primaryEmailAddress: 'eve-owner@clerk.test' },
        { primaryEmailAddress: 'eve-member@clerk.test' },
      ],
      orgs: [
        { name: 'EveOrg', slug: 'eveorg', createdByEmail: 'eve-owner@clerk.test' },
      ],
    });
    envs.push(env);
    const memberUser = await env.users.getUserByEmail('eve-member@clerk.test');
    const org = await env.organizations.getOrganizationBySlug('eveorg');
    if (!memberUser || !org) throw new Error('seed data missing');
    await env.organizations.createMembership({
      organizationId: org.id,
      userId: memberUser.id,
      role: 'member',
    });
    const { token } = await env.signIn({
      email: 'eve-member@clerk.test',
      organizationSlug: 'eveorg',
    });
    const res = await callAdmin(env, token);
    expect(res.status).toBe(403);
    expect((res.body as { error: string }).error).toBe('forbidden');
  });

  it('T-CL-007 admin role passes the admin-only route', async () => {
    const env = await setupClerkEnv({
      users: [
        { primaryEmailAddress: 'frank-owner@clerk.test' },
        { primaryEmailAddress: 'frank-admin@clerk.test' },
      ],
      orgs: [
        { name: 'FrankOrg', slug: 'frankorg', createdByEmail: 'frank-owner@clerk.test' },
      ],
    });
    envs.push(env);
    const adminUser = await env.users.getUserByEmail('frank-admin@clerk.test');
    const org = await env.organizations.getOrganizationBySlug('frankorg');
    if (!adminUser || !org) throw new Error('seed data missing');
    await env.organizations.createMembership({
      organizationId: org.id,
      userId: adminUser.id,
      role: 'admin',
    });
    const { token } = await env.signIn({
      email: 'frank-admin@clerk.test',
      organizationSlug: 'frankorg',
    });
    const res = await callAdmin(env, token);
    expect(res.status).toBe(200);
    expect((res.body as ProtectedProfile).organizationRole).toBe('admin');
  });
});

describe('clerk PoC — seeded tokens', () => {
  it('T-CL-008 seeded tokens option produces ready-to-use tokens the protected route accepts', async () => {
    const env = await setupClerkEnv({
      users: [
        { primaryEmailAddress: 'gina@clerk.test', firstName: 'Gina' },
      ],
      orgs: [
        { name: 'GinaOrg', slug: 'ginaorg', createdByEmail: 'gina@clerk.test' },
      ],
      tokens: [{ userEmail: 'gina@clerk.test', organizationSlug: 'ginaorg' }],
    });
    envs.push(env);
    const seeded = env.seededTokens['gina@clerk.test'];
    expect(seeded).toBeDefined();
    const res = await callProtected(env, seeded!.token);
    expect(res.status).toBe(200);
    const body = res.body as ProtectedProfile;
    expect(body.primaryEmailAddress).toBe('gina@clerk.test');
    expect(body.organizationRole).toBe('owner');
  });
});
