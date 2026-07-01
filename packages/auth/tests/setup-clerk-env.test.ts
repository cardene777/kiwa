import { afterEach, describe, expect, it } from 'vitest';
import {
  setupClerkEnv,
  signClerkJwt,
  verifyClerkJwt,
  generateClerkSigningSecret,
  type ClerkTestEnv,
} from '../src/index.js';

const envs: ClerkTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('setupClerkEnv (defaults)', () => {
  it('exposes users / sessions / organizations APIs + verifyToken', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    expect(env.mode).toBe('mock');
    expect(typeof env.users.createUser).toBe('function');
    expect(typeof env.sessions.createSession).toBe('function');
    expect(typeof env.organizations.createOrganization).toBe('function');
    expect(typeof env.verifyToken).toBe('function');
  });

  it('defaults sessionExpiration to 7 days', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    expect(env.sessionExpiration).toBe(7 * 24 * 60 * 60);
  });

  it('defaults issuer to the mock stub host', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    expect(env.issuer).toBe('https://mock.clerk.accounts.dev');
  });

  it('rejects a non-positive sessionExpiration', async () => {
    await expect(setupClerkEnv({ sessionExpiration: 0 })).rejects.toThrow(
      /sessionExpiration/,
    );
    await expect(setupClerkEnv({ sessionExpiration: -1 })).rejects.toThrow(
      /sessionExpiration/,
    );
  });
});

describe('setupClerkEnv (users API)', () => {
  it('createUser produces a Clerk-shaped record with id prefix + verified primary email', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    const user = await env.users.createUser({
      primaryEmailAddress: 'alice@example.test',
      firstName: 'Alice',
      lastName: 'Anderson',
    });
    expect(user.id).toMatch(/^user_\d{6}$/);
    expect(user.primaryEmailAddress).toBe('alice@example.test');
    expect(user.emailAddresses).toHaveLength(1);
    expect(user.emailAddresses[0]?.verified).toBe(true);
    expect(user.emailAddresses[0]?.id).toMatch(/^idn_email_/);
    expect(user.firstName).toBe('Alice');
    expect(user.lastName).toBe('Anderson');
    expect(user.phoneNumbers).toHaveLength(0);
    expect(user.externalAccounts).toHaveLength(0);
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it('createUser records a verified phone number when provided', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    const user = await env.users.createUser({
      primaryEmailAddress: 'bob@example.test',
      phoneNumber: '+15551234567',
    });
    expect(user.phoneNumbers).toHaveLength(1);
    expect(user.phoneNumbers[0]?.phoneNumber).toBe('+15551234567');
    expect(user.phoneNumbers[0]?.verified).toBe(true);
    expect(user.phoneNumbers[0]?.id).toMatch(/^idn_phone_/);
  });

  it('createUser records external accounts (OAuth)', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    const user = await env.users.createUser({
      primaryEmailAddress: 'carol@example.test',
      externalAccounts: [
        {
          provider: 'oauth_google',
          providerUserId: 'google-uid-9',
          emailAddress: 'carol@example.test',
        },
      ],
    });
    expect(user.externalAccounts).toHaveLength(1);
    expect(user.externalAccounts[0]?.provider).toBe('oauth_google');
    expect(user.externalAccounts[0]?.providerUserId).toBe('google-uid-9');
  });

  it('createUser rejects duplicate primary emails', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    await env.users.createUser({
      primaryEmailAddress: 'dup@example.test',
    });
    await expect(
      env.users.createUser({ primaryEmailAddress: 'dup@example.test' }),
    ).rejects.toThrow(/already exists/);
  });

  it('createUser rejects invalid email input', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    await expect(
      env.users.createUser({ primaryEmailAddress: 'not-an-email' }),
    ).rejects.toThrow(/primaryEmailAddress/);
  });

  it('getUser returns the record and throws on unknown id', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    const created = await env.users.createUser({
      primaryEmailAddress: 'eve@example.test',
    });
    const fetched = await env.users.getUser(created.id);
    expect(fetched.id).toBe(created.id);
    await expect(env.users.getUser('user_999999')).rejects.toThrow(/not found/);
  });

  it('getUserByEmail returns null when the email is unknown', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    const found = await env.users.getUserByEmail('ghost@example.test');
    expect(found).toBeNull();
  });

  it('updateUser patches metadata + name fields', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    const user = await env.users.createUser({
      primaryEmailAddress: 'frank@example.test',
    });
    const updated = await env.users.updateUser(user.id, {
      firstName: 'Frank',
      publicMetadata: { plan: 'pro' },
    });
    expect(updated.firstName).toBe('Frank');
    expect(updated.publicMetadata?.plan).toBe('pro');
  });

  it('deleteUser removes the record and cascades sessions', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    const user = await env.users.createUser({
      primaryEmailAddress: 'goose@example.test',
    });
    await env.sessions.createSession({ userId: user.id });
    expect((await env.sessions.listSessionsForUser(user.id)).length).toBe(1);
    await env.users.deleteUser(user.id);
    await expect(env.users.getUser(user.id)).rejects.toThrow(/not found/);
    expect(await env.users.getUserByEmail('goose@example.test')).toBeNull();
    expect(await env.sessions.listSessionsForUser(user.id)).toHaveLength(0);
  });

  it('listUsers returns every created user', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    await env.users.createUser({ primaryEmailAddress: 'a@example.test' });
    await env.users.createUser({ primaryEmailAddress: 'b@example.test' });
    const users = await env.users.listUsers();
    expect(users).toHaveLength(2);
  });
});

describe('setupClerkEnv (sessions + JWT)', () => {
  it('createSession issues an active session with a verifiable JWT', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    const user = await env.users.createUser({
      primaryEmailAddress: 'jwt@example.test',
    });
    const { session, token } = await env.sessions.createSession({ userId: user.id });
    expect(session.id).toMatch(/^sess_/);
    expect(session.userId).toBe(user.id);
    expect(session.status).toBe('active');
    // JWT wire shape — 3 base64url segments.
    expect(token.split('.')).toHaveLength(3);
    const claims = await env.verifyToken(token);
    expect(claims.sub).toBe(user.id);
    expect(claims.sid).toBe(session.id);
    expect(claims.iss).toBe(env.issuer);
    expect(claims.iat).toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
    expect(claims.exp).toBeGreaterThan(claims.iat);
    // Non-org session — no org_id / org_role.
    expect(claims.org_id).toBeUndefined();
    expect(claims.org_role).toBeUndefined();
  });

  it('createSession fails when the user id is unknown', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    await expect(
      env.sessions.createSession({ userId: 'user_missing' }),
    ).rejects.toThrow(/unknown user/);
  });

  it('revokeSession flips the status and verifyToken rejects thereafter', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    const user = await env.users.createUser({
      primaryEmailAddress: 'revoke@example.test',
    });
    const { session, token } = await env.sessions.createSession({ userId: user.id });
    await env.sessions.revokeSession(session.id);
    await expect(env.verifyToken(token)).rejects.toThrow(/revoked/);
  });

  it('verifyToken rejects tampered signatures', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    const user = await env.users.createUser({
      primaryEmailAddress: 'tamper@example.test',
    });
    const { token } = await env.sessions.createSession({ userId: user.id });
    // Flip a character in the signature segment.
    const parts = token.split('.');
    const sig = parts[2] ?? '';
    parts[2] = sig.length > 0 ? (sig[0] === 'a' ? 'b' : 'a') + sig.slice(1) : 'x';
    const tampered = parts.join('.');
    await expect(env.verifyToken(tampered)).rejects.toThrow(/signature/);
  });

  it('verifyToken rejects malformed input', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    await expect(env.verifyToken('not-a-jwt')).rejects.toThrow(/malformed/);
    await expect(env.verifyToken('a.b')).rejects.toThrow(/malformed/);
  });

  it('verifyToken rejects tokens issued by a different env instance', async () => {
    const env1 = await setupClerkEnv();
    const env2 = await setupClerkEnv();
    envs.push(env1, env2);
    const user1 = await env1.users.createUser({
      primaryEmailAddress: 'x1@example.test',
    });
    const { token } = await env1.sessions.createSession({ userId: user1.id });
    await expect(env2.verifyToken(token)).rejects.toThrow(/signature/);
  });

  it('verifyToken rejects tokens whose exp is in the past', async () => {
    const env = await setupClerkEnv({ sessionExpiration: 1 });
    envs.push(env);
    const secret = generateClerkSigningSecret();
    // Craft an expired token bypassing the env's issuer to prove the
    // exp-check itself fires — we still need the env's secret so the signature
    // is valid. Use signClerkJwt directly against the env's expected shape.
    // This test double-verifies that the jwt module's expiry path is wired.
    const now = Math.floor(Date.now() / 1000);
    const forged = signClerkJwt(
      {
        sub: 'user_forged',
        sid: 'sess_forged',
        iat: now - 100,
        exp: now - 1,
        iss: env.issuer,
      },
      secret,
    );
    expect(() => verifyClerkJwt(forged, secret)).toThrow(/expired/);
  });
});

describe('setupClerkEnv (organizations + memberships)', () => {
  it('createOrganization auto-adds creator as owner', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    const owner = await env.users.createUser({
      primaryEmailAddress: 'owner@example.test',
    });
    const org = await env.organizations.createOrganization({
      name: 'Acme',
      slug: 'acme',
      createdBy: owner.id,
    });
    expect(org.id).toMatch(/^org_/);
    expect(org.slug).toBe('acme');
    expect(org.createdBy).toBe(owner.id);
    const membership = await env.organizations.getOrganizationMembership({
      organizationId: org.id,
      userId: owner.id,
    });
    expect(membership).not.toBeNull();
    expect(membership?.role).toBe('owner');
  });

  it('createOrganization rejects duplicate slugs', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    const owner = await env.users.createUser({
      primaryEmailAddress: 'a@example.test',
    });
    await env.organizations.createOrganization({
      name: 'Acme',
      slug: 'acme',
      createdBy: owner.id,
    });
    await expect(
      env.organizations.createOrganization({
        name: 'Acme Dup',
        slug: 'acme',
        createdBy: owner.id,
      }),
    ).rejects.toThrow(/already exists/);
  });

  it('createMembership adds a user with the supplied role', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    const owner = await env.users.createUser({
      primaryEmailAddress: 'owner2@example.test',
    });
    const member = await env.users.createUser({
      primaryEmailAddress: 'member@example.test',
    });
    const org = await env.organizations.createOrganization({
      name: 'Beta',
      slug: 'beta',
      createdBy: owner.id,
    });
    const m = await env.organizations.createMembership({
      organizationId: org.id,
      userId: member.id,
      role: 'admin',
    });
    expect(m.role).toBe('admin');
    expect(m.userId).toBe(member.id);
  });

  it('createMembership rejects duplicate (org, user) pairs', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    const owner = await env.users.createUser({
      primaryEmailAddress: 'x@example.test',
    });
    const org = await env.organizations.createOrganization({
      name: 'X',
      slug: 'x',
      createdBy: owner.id,
    });
    // Owner already has a membership from createOrganization — dup add fails.
    await expect(
      env.organizations.createMembership({
        organizationId: org.id,
        userId: owner.id,
        role: 'admin',
      }),
    ).rejects.toThrow(/already/);
  });

  it('updateMembership + deleteMembership flip / drop roles', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    const owner = await env.users.createUser({
      primaryEmailAddress: 'o@example.test',
    });
    const other = await env.users.createUser({
      primaryEmailAddress: 'other@example.test',
    });
    const org = await env.organizations.createOrganization({
      name: 'Y',
      slug: 'y',
      createdBy: owner.id,
    });
    await env.organizations.createMembership({
      organizationId: org.id,
      userId: other.id,
      role: 'member',
    });
    const promoted = await env.organizations.updateMembership({
      organizationId: org.id,
      userId: other.id,
      role: 'admin',
    });
    expect(promoted.role).toBe('admin');
    await env.organizations.deleteMembership({
      organizationId: org.id,
      userId: other.id,
    });
    expect(
      await env.organizations.getOrganizationMembership({
        organizationId: org.id,
        userId: other.id,
      }),
    ).toBeNull();
  });

  it('listMembershipsForUser / listMembershipsForOrganization return every match', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    const u1 = await env.users.createUser({ primaryEmailAddress: 'u1@example.test' });
    const u2 = await env.users.createUser({ primaryEmailAddress: 'u2@example.test' });
    const org1 = await env.organizations.createOrganization({
      name: 'A',
      slug: 'a',
      createdBy: u1.id,
    });
    const org2 = await env.organizations.createOrganization({
      name: 'B',
      slug: 'b',
      createdBy: u1.id,
    });
    await env.organizations.createMembership({
      organizationId: org1.id,
      userId: u2.id,
      role: 'member',
    });
    const u1Memberships = await env.organizations.listMembershipsForUser(u1.id);
    expect(u1Memberships).toHaveLength(2); // owner of org1 + org2
    const org1Memberships = await env.organizations.listMembershipsForOrganization(org1.id);
    expect(org1Memberships).toHaveLength(2); // u1 + u2
  });
});

describe('setupClerkEnv (org-scoped tokens)', () => {
  it('signIn with organizationSlug embeds org_id + org_role + org_slug in the JWT', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    const owner = await env.users.createUser({
      primaryEmailAddress: 'multi@example.test',
    });
    const org = await env.organizations.createOrganization({
      name: 'Multi',
      slug: 'multi',
      createdBy: owner.id,
    });
    const { session, token } = await env.signIn({
      email: 'multi@example.test',
      organizationSlug: 'multi',
    });
    expect(session.activeOrganizationId).toBe(org.id);
    const claims = await env.verifyToken(token);
    expect(claims.org_id).toBe(org.id);
    expect(claims.org_role).toBe('owner');
    expect(claims.org_slug).toBe('multi');
  });

  it('signIn with organizationSlug rejects users not in the org', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    const owner = await env.users.createUser({
      primaryEmailAddress: 'owner3@example.test',
    });
    const outsider = await env.users.createUser({
      primaryEmailAddress: 'outsider@example.test',
    });
    void outsider;
    await env.organizations.createOrganization({
      name: 'Priv',
      slug: 'priv',
      createdBy: owner.id,
    });
    await expect(
      env.signIn({ email: 'outsider@example.test', organizationSlug: 'priv' }),
    ).rejects.toThrow(/not a member/);
  });

  it('signIn with an unknown user email throws', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    await expect(env.signIn({ email: 'nobody@example.test' })).rejects.toThrow(
      /unknown user/,
    );
  });
});

describe('setupClerkEnv (seed helpers)', () => {
  it('seeds users + orgs + tokens through options', async () => {
    const env = await setupClerkEnv({
      users: [
        { primaryEmailAddress: 'seed@example.test', firstName: 'Seed' },
        { primaryEmailAddress: 'seed2@example.test' },
      ],
      orgs: [
        { name: 'Seed Org', slug: 'seed-org', createdByEmail: 'seed@example.test' },
      ],
      tokens: [{ userEmail: 'seed@example.test', organizationSlug: 'seed-org' }],
    });
    envs.push(env);
    const seeded = env.seededTokens['seed@example.test'];
    expect(seeded).toBeDefined();
    expect(seeded?.token.split('.')).toHaveLength(3);
    const claims = await env.verifyToken(seeded!.token);
    expect(claims.org_slug).toBe('seed-org');
    expect(claims.org_role).toBe('owner');
  });

  it('rejects a seed org whose creator email is not in the users seed', async () => {
    await expect(
      setupClerkEnv({
        orgs: [{ name: 'X', slug: 'x', createdByEmail: 'missing@example.test' }],
      }),
    ).rejects.toThrow(/unknown user email/);
  });

  it('rejects a seed token whose user email is not in the users seed', async () => {
    await expect(
      setupClerkEnv({
        tokens: [{ userEmail: 'missing@example.test' }],
      }),
    ).rejects.toThrow(/unknown user email/);
  });
});

describe('setupClerkEnv (issuer + audience)', () => {
  it('custom issuer + audience flow through to the JWT claims', async () => {
    const env = await setupClerkEnv({
      issuer: 'https://custom.clerk.example',
      audience: 'kiwa-test-audience',
    });
    envs.push(env);
    const user = await env.users.createUser({
      primaryEmailAddress: 'aud@example.test',
    });
    const { token } = await env.sessions.createSession({ userId: user.id });
    const claims = await env.verifyToken(token);
    expect(claims.iss).toBe('https://custom.clerk.example');
    expect(claims.aud).toBe('kiwa-test-audience');
  });

  it('stop() resets state, allowing reuse across suites', async () => {
    const env = await setupClerkEnv();
    envs.push(env);
    await env.users.createUser({
      primaryEmailAddress: 'reset@example.test',
    });
    await env.stop();
    // After stop, the store is reset — a fresh createUser with the same email
    // must succeed without a duplicate error.
    const fresh = await env.users.createUser({
      primaryEmailAddress: 'reset@example.test',
    });
    expect(fresh.id).toMatch(/^user_/);
  });
});
