import { describe, expect, it } from 'vitest';
import { setupClerkEnv } from '../src/clerk/setup-clerk-env.js';

describe('clerk env users defensive branches', () => {
  it('users.getUser throws when id unknown', async () => {
    const env = await setupClerkEnv();
    await expect(env.users.getUser('user-unknown')).rejects.toThrow(
      /not found user-unknown/,
    );
  });

  it('users.getUserByEmail returns null for unknown email', async () => {
    const env = await setupClerkEnv();
    const user = await env.users.getUserByEmail('nobody@example.com');
    expect(user).toBeNull();
  });

  it('users.createUser + getUser round trip', async () => {
    const env = await setupClerkEnv();
    const created = await env.users.createUser({
      primaryEmailAddress: 'new@example.com',
      firstName: 'Alice',
    });
    const fetched = await env.users.getUser(created.id);
    expect(fetched.id).toBe(created.id);
    expect(fetched.firstName).toBe('Alice');
  });

  it('users.updateUser filters patch to allowed fields', async () => {
    const env = await setupClerkEnv();
    const created = await env.users.createUser({
      primaryEmailAddress: 'up@example.com',
    });
    const updated = await env.users.updateUser(created.id, {
      firstName: 'Updated',
      lastName: 'User',
      publicMetadata: { role: 'admin' },
      privateMetadata: { internal: true },
    });
    expect(updated.firstName).toBe('Updated');
    expect(updated.lastName).toBe('User');
    expect(updated.publicMetadata?.role).toBe('admin');
  });

  it('users.deleteUser removes the user', async () => {
    const env = await setupClerkEnv();
    const created = await env.users.createUser({
      primaryEmailAddress: 'del@example.com',
    });
    await env.users.deleteUser(created.id);
    await expect(env.users.getUser(created.id)).rejects.toThrow();
  });

  it('users.listUsers returns all created users', async () => {
    const env = await setupClerkEnv();
    await env.users.createUser({
      primaryEmailAddress: 'a@example.com',
    });
    await env.users.createUser({
      primaryEmailAddress: 'b@example.com',
    });
    const users = await env.users.listUsers();
    expect(users.length).toBeGreaterThanOrEqual(2);
  });
});

describe('clerk env organizations defensive branches', () => {
  it('createOrganization throws when creator unknown', async () => {
    const env = await setupClerkEnv();
    await expect(
      env.organizations.createOrganization({
        name: 'Acme',
        slug: 'acme',
        createdBy: 'user-unknown',
      }),
    ).rejects.toThrow(/unknown creator id user-unknown/);
  });

  it('createOrganization succeeds with valid creator + auto membership', async () => {
    const env = await setupClerkEnv();
    const owner = await env.users.createUser({
      primaryEmailAddress: 'owner@example.com',
    });
    const org = await env.organizations.createOrganization({
      name: 'Acme',
      slug: 'acme',
      createdBy: owner.id,
    });
    expect(org.name).toBe('Acme');
    const memberships = await env.organizations.listMembershipsForUser(owner.id);
    expect(memberships.some((m) => m.organizationId === org.id)).toBe(true);
  });

  it('getOrganization throws when id unknown', async () => {
    const env = await setupClerkEnv();
    await expect(
      env.organizations.getOrganization('org-unknown'),
    ).rejects.toThrow(/not found org-unknown/);
  });

  it('getOrganizationBySlug returns null for unknown slug', async () => {
    const env = await setupClerkEnv();
    const org = await env.organizations.getOrganizationBySlug('none');
    expect(org).toBeNull();
  });

  it('createMembership throws when org unknown', async () => {
    const env = await setupClerkEnv();
    const user = await env.users.createUser({
      primaryEmailAddress: 'x@example.com',
    });
    await expect(
      env.organizations.createMembership({
        organizationId: 'org-unknown',
        userId: user.id,
        role: 'member',
      }),
    ).rejects.toThrow(/unknown organization/);
  });

  it('createMembership throws when user unknown', async () => {
    const env = await setupClerkEnv();
    const owner = await env.users.createUser({
      primaryEmailAddress: 'own@example.com',
    });
    const org = await env.organizations.createOrganization({
      name: 'Beta',
      slug: 'beta',
      createdBy: owner.id,
    });
    await expect(
      env.organizations.createMembership({
        organizationId: org.id,
        userId: 'user-unknown',
        role: 'member',
      }),
    ).rejects.toThrow(/unknown user/);
  });
});
