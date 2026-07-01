import type {
  ClerkOrganization,
  ClerkOrganizationMembership,
  ClerkSession,
  ClerkUser,
} from './types.js';

/**
 * Counter state is scoped inside the factory closure — each store instance
 * owns its own ids so parallel tests do not race on shared counters.
 */

/**
 * In-memory Clerk state. `@clerk/backend`'s real client hits Clerk's REST API
 * on every call; the mock replaces the network layer with a local Map-backed
 * store that produces the same shape. `reset()` is a test-only affordance
 * that mirrors the semantics of dropping the mocked instance.
 */
export interface ClerkStore {
  createUser(user: ClerkUser): ClerkUser;
  getUser(id: string): ClerkUser | null;
  getUserByEmail(email: string): ClerkUser | null;
  updateUser(id: string, patch: Partial<ClerkUser>): ClerkUser;
  deleteUser(id: string): void;
  listUsers(): ClerkUser[];

  createSession(session: ClerkSession): ClerkSession;
  getSession(id: string): ClerkSession | null;
  updateSession(id: string, patch: Partial<ClerkSession>): ClerkSession;
  listSessionsForUser(userId: string): ClerkSession[];

  createOrganization(org: ClerkOrganization): ClerkOrganization;
  getOrganization(id: string): ClerkOrganization | null;
  getOrganizationBySlug(slug: string): ClerkOrganization | null;

  createMembership(membership: ClerkOrganizationMembership): ClerkOrganizationMembership;
  getMembership(orgId: string, userId: string): ClerkOrganizationMembership | null;
  updateMembership(
    orgId: string,
    userId: string,
    patch: Partial<ClerkOrganizationMembership>,
  ): ClerkOrganizationMembership;
  deleteMembership(orgId: string, userId: string): void;
  listMembershipsForUser(userId: string): ClerkOrganizationMembership[];
  listMembershipsForOrganization(orgId: string): ClerkOrganizationMembership[];

  nextUserId(): string;
  nextSessionId(): string;
  nextOrganizationId(): string;
  nextMembershipId(): string;
  nextEmailId(): string;
  nextPhoneId(): string;

  reset(): void;
}

function membershipKey(orgId: string, userId: string): string {
  return `${orgId}:${userId}`;
}

export function createClerkStore(): ClerkStore {
  const users = new Map<string, ClerkUser>();
  const usersByEmail = new Map<string, ClerkUser>();
  const sessions = new Map<string, ClerkSession>();
  const organizations = new Map<string, ClerkOrganization>();
  const organizationsBySlug = new Map<string, ClerkOrganization>();
  const memberships = new Map<string, ClerkOrganizationMembership>();

  let userCounter = 0;
  let sessionCounter = 0;
  let orgCounter = 0;
  let membershipCounter = 0;
  let emailCounter = 0;
  let phoneCounter = 0;

  return {
    createUser(user) {
      if (usersByEmail.has(user.primaryEmailAddress)) {
        throw new Error(
          `Clerk store: user with email ${user.primaryEmailAddress} already exists`,
        );
      }
      users.set(user.id, user);
      usersByEmail.set(user.primaryEmailAddress, user);
      return user;
    },
    getUser(id) {
      return users.get(id) ?? null;
    },
    getUserByEmail(email) {
      return usersByEmail.get(email) ?? null;
    },
    updateUser(id, patch) {
      const current = users.get(id);
      if (!current) throw new Error(`Clerk store: unknown user id ${id}`);
      const next: ClerkUser = { ...current, ...patch };
      users.set(id, next);
      // primaryEmailAddress is not part of the update surface, but rebuild
      // the email index defensively in case a future patch expands it.
      if (patch.primaryEmailAddress && patch.primaryEmailAddress !== current.primaryEmailAddress) {
        usersByEmail.delete(current.primaryEmailAddress);
        usersByEmail.set(next.primaryEmailAddress, next);
      } else {
        usersByEmail.set(next.primaryEmailAddress, next);
      }
      return next;
    },
    deleteUser(id) {
      const user = users.get(id);
      if (!user) return;
      users.delete(id);
      usersByEmail.delete(user.primaryEmailAddress);
      for (const [sessionId, session] of sessions) {
        if (session.userId === id) sessions.delete(sessionId);
      }
      for (const [key, membership] of memberships) {
        if (membership.userId === id) memberships.delete(key);
      }
    },
    listUsers() {
      return Array.from(users.values());
    },
    createSession(session) {
      sessions.set(session.id, session);
      return session;
    },
    getSession(id) {
      return sessions.get(id) ?? null;
    },
    updateSession(id, patch) {
      const current = sessions.get(id);
      if (!current) throw new Error(`Clerk store: unknown session id ${id}`);
      const next: ClerkSession = { ...current, ...patch };
      sessions.set(id, next);
      return next;
    },
    listSessionsForUser(userId) {
      return Array.from(sessions.values()).filter((s) => s.userId === userId);
    },
    createOrganization(org) {
      if (organizationsBySlug.has(org.slug)) {
        throw new Error(`Clerk store: organization with slug ${org.slug} already exists`);
      }
      organizations.set(org.id, org);
      organizationsBySlug.set(org.slug, org);
      return org;
    },
    getOrganization(id) {
      return organizations.get(id) ?? null;
    },
    getOrganizationBySlug(slug) {
      return organizationsBySlug.get(slug) ?? null;
    },
    createMembership(membership) {
      const key = membershipKey(membership.organizationId, membership.userId);
      if (memberships.has(key)) {
        throw new Error(
          `Clerk store: user ${membership.userId} already a member of org ${membership.organizationId}`,
        );
      }
      memberships.set(key, membership);
      return membership;
    },
    getMembership(orgId, userId) {
      return memberships.get(membershipKey(orgId, userId)) ?? null;
    },
    updateMembership(orgId, userId, patch) {
      const key = membershipKey(orgId, userId);
      const current = memberships.get(key);
      if (!current) {
        throw new Error(
          `Clerk store: membership ${orgId}/${userId} not found`,
        );
      }
      const next: ClerkOrganizationMembership = { ...current, ...patch };
      memberships.set(key, next);
      return next;
    },
    deleteMembership(orgId, userId) {
      memberships.delete(membershipKey(orgId, userId));
    },
    listMembershipsForUser(userId) {
      return Array.from(memberships.values()).filter((m) => m.userId === userId);
    },
    listMembershipsForOrganization(orgId) {
      return Array.from(memberships.values()).filter((m) => m.organizationId === orgId);
    },
    nextUserId() {
      userCounter += 1;
      return `user_${userCounter.toString().padStart(6, '0')}`;
    },
    nextSessionId() {
      sessionCounter += 1;
      return `sess_${sessionCounter.toString().padStart(6, '0')}`;
    },
    nextOrganizationId() {
      orgCounter += 1;
      return `org_${orgCounter.toString().padStart(6, '0')}`;
    },
    nextMembershipId() {
      membershipCounter += 1;
      return `orgmem_${membershipCounter.toString().padStart(6, '0')}`;
    },
    nextEmailId() {
      emailCounter += 1;
      return `idn_email_${emailCounter.toString().padStart(6, '0')}`;
    },
    nextPhoneId() {
      phoneCounter += 1;
      return `idn_phone_${phoneCounter.toString().padStart(6, '0')}`;
    },
    reset() {
      users.clear();
      usersByEmail.clear();
      sessions.clear();
      organizations.clear();
      organizationsBySlug.clear();
      memberships.clear();
      userCounter = 0;
      sessionCounter = 0;
      orgCounter = 0;
      membershipCounter = 0;
      emailCounter = 0;
      phoneCounter = 0;
    },
  };
}
