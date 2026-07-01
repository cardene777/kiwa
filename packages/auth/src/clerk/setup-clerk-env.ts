import { generateSigningSecret, signClerkJwt, verifyClerkJwt } from './jwt.js';
import { createClerkStore, type ClerkStore } from './store.js';
import type {
  ClerkEmailAddress,
  ClerkOrganization,
  ClerkOrganizationMembership,
  ClerkOrganizationRole,
  ClerkPhoneNumber,
  ClerkSession,
  ClerkSessionClaims,
  ClerkTestEnv,
  ClerkUser,
  SetupClerkEnvOptions,
} from './types.js';

// Clerk's default session lifetime is 7 days (Clerk hosted default for `session-token`).
const DEFAULT_SESSION_EXPIRATION = 7 * 24 * 60 * 60;
// Placeholder issuer that mirrors Clerk's real hosted `iss` claim.
const DEFAULT_ISSUER = 'https://mock.clerk.accounts.dev';

/**
 * Build a Clerk test env. The returned handle exposes a `users` / `sessions`
 * / `organizations` surface that mirrors `@clerk/backend`'s SDK, plus a
 * `verifyToken` helper that validates JWTs issued by the same env.
 *
 * Consumers wire the env into their code by either (a) swapping the real
 * `@clerk/backend` client for `env` in the test setup, or (b) driving the
 * handlers directly with `env.signIn` + `env.verifyToken`.
 */
export async function setupClerkEnv(
  opts: SetupClerkEnvOptions = {},
): Promise<ClerkTestEnv> {
  const sessionExpiration = opts.sessionExpiration ?? DEFAULT_SESSION_EXPIRATION;
  if (sessionExpiration <= 0) {
    throw new Error(
      'setupClerkEnv: sessionExpiration must be a positive number of seconds',
    );
  }
  const issuer = opts.issuer ?? DEFAULT_ISSUER;
  const audience = opts.audience;
  const secret = generateSigningSecret();
  const store = createClerkStore();

  function issueToken(input: {
    user: ClerkUser;
    session: ClerkSession;
    organizationSlug?: string | undefined;
    tokenIssuer?: string | undefined;
  }): string {
    const now = Math.floor(Date.now() / 1000);
    const expSeconds = Math.floor(input.session.expiresAt.getTime() / 1000);
    let orgId: string | undefined;
    let orgRole: string | undefined;
    let orgSlug: string | undefined;
    if (input.organizationSlug) {
      const org = store.getOrganizationBySlug(input.organizationSlug);
      if (!org) {
        throw new Error(
          `setupClerkEnv: cannot issue token, organization slug not found: ${input.organizationSlug}`,
        );
      }
      const membership = store.getMembership(org.id, input.user.id);
      if (!membership) {
        throw new Error(
          `setupClerkEnv: cannot issue token, user ${input.user.id} is not a member of org ${org.id}`,
        );
      }
      orgId = org.id;
      orgRole = membership.role;
      orgSlug = org.slug;
    }
    const claims: ClerkSessionClaims = {
      sub: input.user.id,
      sid: input.session.id,
      iat: now,
      exp: expSeconds,
      iss: input.tokenIssuer ?? issuer,
    };
    if (orgId !== undefined) claims.org_id = orgId;
    if (orgRole !== undefined) claims.org_role = orgRole;
    if (orgSlug !== undefined) claims.org_slug = orgSlug;
    if (audience !== undefined) claims.aud = audience;
    return signClerkJwt(claims, secret);
  }

  function buildUser(input: {
    primaryEmailAddress: string;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phoneNumber?: string | undefined;
    externalAccounts?: NonNullable<
      SetupClerkEnvOptions['users']
    >[number]['externalAccounts'];
    publicMetadata?: Record<string, unknown> | undefined;
    privateMetadata?: Record<string, unknown> | undefined;
  }): ClerkUser {
    if (!input.primaryEmailAddress || !input.primaryEmailAddress.includes('@')) {
      throw new Error(
        `setupClerkEnv: primaryEmailAddress must be a valid email (got ${input.primaryEmailAddress})`,
      );
    }
    const id = store.nextUserId();
    const emailAddresses: ClerkEmailAddress[] = [
      {
        id: store.nextEmailId(),
        emailAddress: input.primaryEmailAddress,
        verified: true,
      },
    ];
    const phoneNumbers: ClerkPhoneNumber[] = [];
    if (input.phoneNumber) {
      phoneNumbers.push({
        id: store.nextPhoneId(),
        phoneNumber: input.phoneNumber,
        verified: true,
      });
    }
    const user: ClerkUser = {
      id,
      primaryEmailAddress: input.primaryEmailAddress,
      emailAddresses,
      phoneNumbers,
      externalAccounts: input.externalAccounts ? [...input.externalAccounts] : [],
      createdAt: new Date(),
    };
    if (input.firstName !== undefined) user.firstName = input.firstName;
    if (input.lastName !== undefined) user.lastName = input.lastName;
    if (input.publicMetadata !== undefined) user.publicMetadata = input.publicMetadata;
    if (input.privateMetadata !== undefined) user.privateMetadata = input.privateMetadata;
    return store.createUser(user);
  }

  async function createSessionForUser(input: {
    userId: string;
    organizationSlug?: string | undefined;
    tokenIssuer?: string | undefined;
  }): Promise<{ session: ClerkSession; token: string }> {
    const user = store.getUser(input.userId);
    if (!user) {
      throw new Error(`setupClerkEnv: unknown user id ${input.userId}`);
    }
    let organizationId: string | undefined;
    if (input.organizationSlug) {
      const org = store.getOrganizationBySlug(input.organizationSlug);
      if (!org) {
        throw new Error(
          `setupClerkEnv: unknown organization slug ${input.organizationSlug}`,
        );
      }
      organizationId = org.id;
    }
    const session: ClerkSession = {
      id: store.nextSessionId(),
      userId: user.id,
      expiresAt: new Date(Date.now() + sessionExpiration * 1000),
      // Placeholder — real token issued below (needs the session id inside claims).
      token: '',
      status: 'active',
    };
    if (organizationId !== undefined) session.activeOrganizationId = organizationId;
    store.createSession(session);
    const token = issueToken({
      user,
      session,
      organizationSlug: input.organizationSlug,
      tokenIssuer: input.tokenIssuer,
    });
    const finalized = store.updateSession(session.id, { token });
    return { session: finalized, token };
  }

  // Seed users first so downstream org / token seeding can reference them.
  const seededTokens: Record<string, { token: string; sessionId: string }> = {};
  if (opts.users) {
    for (const seed of opts.users) {
      buildUser(seed);
    }
  }
  if (opts.orgs) {
    for (const seed of opts.orgs) {
      const owner = store.getUserByEmail(seed.createdByEmail);
      if (!owner) {
        throw new Error(
          `setupClerkEnv: cannot seed organization, unknown user email ${seed.createdByEmail}`,
        );
      }
      const org: ClerkOrganization = {
        id: store.nextOrganizationId(),
        name: seed.name,
        slug: seed.slug,
        createdBy: owner.id,
        createdAt: new Date(),
      };
      if (seed.publicMetadata !== undefined) org.publicMetadata = seed.publicMetadata;
      store.createOrganization(org);
      const membership: ClerkOrganizationMembership = {
        id: store.nextMembershipId(),
        organizationId: org.id,
        userId: owner.id,
        role: 'owner',
        createdAt: new Date(),
      };
      store.createMembership(membership);
    }
  }
  if (opts.tokens) {
    for (const seed of opts.tokens) {
      const user = store.getUserByEmail(seed.userEmail);
      if (!user) {
        throw new Error(
          `setupClerkEnv: cannot seed token, unknown user email ${seed.userEmail}`,
        );
      }
      const created = await createSessionForUser({
        userId: user.id,
        organizationSlug: seed.organizationSlug,
        tokenIssuer: seed.issuer,
      });
      seededTokens[seed.userEmail] = {
        token: created.token,
        sessionId: created.session.id,
      };
    }
  }

  const usersApi: ClerkTestEnv['users'] = {
    async createUser(input) {
      return buildUser(input);
    },
    async getUser(id) {
      const user = store.getUser(id);
      if (!user) throw new Error(`Clerk users.getUser: not found ${id}`);
      return user;
    },
    async getUserByEmail(email) {
      return store.getUserByEmail(email);
    },
    async updateUser(id, patch) {
      const filteredPatch: Partial<ClerkUser> = {};
      if (patch.firstName !== undefined) filteredPatch.firstName = patch.firstName;
      if (patch.lastName !== undefined) filteredPatch.lastName = patch.lastName;
      if (patch.publicMetadata !== undefined) filteredPatch.publicMetadata = patch.publicMetadata;
      if (patch.privateMetadata !== undefined) filteredPatch.privateMetadata = patch.privateMetadata;
      return store.updateUser(id, filteredPatch);
    },
    async deleteUser(id) {
      store.deleteUser(id);
    },
    async listUsers() {
      return store.listUsers();
    },
  };

  const sessionsApi: ClerkTestEnv['sessions'] = {
    async createSession(input) {
      const created = await createSessionForUser({
        userId: input.userId,
        organizationSlug: input.organizationId
          ? store.getOrganization(input.organizationId)?.slug
          : undefined,
      });
      return created;
    },
    async getSession(id) {
      const session = store.getSession(id);
      if (!session) {
        throw new Error(`Clerk sessions.getSession: not found ${id}`);
      }
      return session;
    },
    async revokeSession(id) {
      const session = store.getSession(id);
      if (!session) {
        throw new Error(`Clerk sessions.revokeSession: not found ${id}`);
      }
      return store.updateSession(id, { status: 'revoked' });
    },
    async listSessionsForUser(userId) {
      return store.listSessionsForUser(userId);
    },
  };

  const organizationsApi: ClerkTestEnv['organizations'] = {
    async createOrganization(input) {
      const creator = store.getUser(input.createdBy);
      if (!creator) {
        throw new Error(
          `Clerk organizations.createOrganization: unknown creator id ${input.createdBy}`,
        );
      }
      const org: ClerkOrganization = {
        id: store.nextOrganizationId(),
        name: input.name,
        slug: input.slug,
        createdBy: input.createdBy,
        createdAt: new Date(),
      };
      if (input.publicMetadata !== undefined) org.publicMetadata = input.publicMetadata;
      store.createOrganization(org);
      // Creator automatically becomes the owner — matches Clerk's real semantics.
      const membership: ClerkOrganizationMembership = {
        id: store.nextMembershipId(),
        organizationId: org.id,
        userId: input.createdBy,
        role: 'owner',
        createdAt: new Date(),
      };
      store.createMembership(membership);
      return org;
    },
    async getOrganization(id) {
      const org = store.getOrganization(id);
      if (!org) {
        throw new Error(`Clerk organizations.getOrganization: not found ${id}`);
      }
      return org;
    },
    async getOrganizationBySlug(slug) {
      return store.getOrganizationBySlug(slug);
    },
    async createMembership(input) {
      const org = store.getOrganization(input.organizationId);
      if (!org) {
        throw new Error(
          `Clerk organizations.createMembership: unknown organization ${input.organizationId}`,
        );
      }
      const user = store.getUser(input.userId);
      if (!user) {
        throw new Error(
          `Clerk organizations.createMembership: unknown user ${input.userId}`,
        );
      }
      const membership: ClerkOrganizationMembership = {
        id: store.nextMembershipId(),
        organizationId: input.organizationId,
        userId: input.userId,
        role: input.role,
        createdAt: new Date(),
      };
      return store.createMembership(membership);
    },
    async getOrganizationMembership(input) {
      return store.getMembership(input.organizationId, input.userId);
    },
    async listMembershipsForUser(userId) {
      return store.listMembershipsForUser(userId);
    },
    async listMembershipsForOrganization(organizationId) {
      return store.listMembershipsForOrganization(organizationId);
    },
    async updateMembership(input) {
      const current = store.getMembership(input.organizationId, input.userId);
      if (!current) {
        throw new Error(
          `Clerk organizations.updateMembership: not found ${input.organizationId}/${input.userId}`,
        );
      }
      return store.updateMembership(input.organizationId, input.userId, {
        role: input.role,
      });
    },
    async deleteMembership(input) {
      store.deleteMembership(input.organizationId, input.userId);
    },
  };

  async function verifyToken(token: string): Promise<ClerkSessionClaims> {
    const claims = verifyClerkJwt(token, secret);
    // Beyond signature + expiry (handled inside verifyClerkJwt), also verify
    // the session referenced by the claims is still active and owned by an
    // existing user — mirrors what Clerk's real backend checks server-side.
    const session = store.getSession(claims.sid);
    if (!session) {
      throw new Error(
        `verifyToken: session ${claims.sid} not found`,
      );
    }
    if (session.status !== 'active') {
      throw new Error(
        `verifyToken: session ${claims.sid} status is ${session.status}`,
      );
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      throw new Error(`verifyToken: session ${claims.sid} expired`);
    }
    const user = store.getUser(claims.sub);
    if (!user) {
      throw new Error(`verifyToken: user ${claims.sub} not found`);
    }
    return claims;
  }

  async function signIn(input: {
    email: string;
    organizationSlug?: string;
  }): Promise<{ user: ClerkUser; session: ClerkSession; token: string }> {
    const user = store.getUserByEmail(input.email);
    if (!user) {
      throw new Error(`setupClerkEnv.signIn: unknown user email ${input.email}`);
    }
    const created = await createSessionForUser({
      userId: user.id,
      organizationSlug: input.organizationSlug,
    });
    return { user, session: created.session, token: created.token };
  }

  const env: ClerkTestEnv = {
    mode: 'mock',
    issuer,
    audience,
    sessionExpiration,
    seededTokens,
    users: usersApi,
    sessions: sessionsApi,
    organizations: organizationsApi,
    verifyToken,
    signIn,
    stop: async () => {
      store.reset();
    },
  };
  return env;
}

// Test-only reset re-exported so unit tests can assert deterministic ids across
// suites without exposing the store surface.
export function __resetClerkStore(store: ClerkStore): void {
  store.reset();
}

// Re-export the role type helper for consumers that want to type-check `role`.
export type { ClerkOrganizationRole };
