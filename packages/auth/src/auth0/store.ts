import type { Auth0User } from './types.js';

/**
 * In-memory Auth0 tenant state. The real `ManagementClient` hits the Auth0
 * REST API on every call; the mock replaces that with a local Map-backed
 * store that produces the same shapes. `reset()` is the test-only affordance
 * that mirrors dropping the mocked tenant.
 */
export interface Auth0Store {
  createUser(user: Auth0User): Auth0User;
  getUser(userId: string): Auth0User | null;
  getUserByEmail(email: string): Auth0User | null;
  updateUser(userId: string, patch: Partial<Auth0User>): Auth0User;
  deleteUser(userId: string): void;
  listUsers(): Auth0User[];

  /**
   * Auth0 keeps user_id counters scoped per connection (`auth0|<counter>` for
   * database, `google-oauth2|<counter>` for social). The mock mirrors that
   * to make the `sub` claim look realistic across connections.
   */
  nextUserId(connection: string): string;

  reset(): void;
}

function connectionPrefix(connection: string): string {
  // Auth0 uses `auth0` as the `sub` prefix for its default database connection
  // (`Username-Password-Authentication`), which is the historical name for
  // that connection strategy. Social + custom connections use the connection
  // name itself as the prefix.
  return connection === 'Username-Password-Authentication' ? 'auth0' : connection;
}

export function createAuth0Store(): Auth0Store {
  const users = new Map<string, Auth0User>();
  const usersByEmail = new Map<string, Auth0User>();
  const counters = new Map<string, number>();

  return {
    createUser(user) {
      if (usersByEmail.has(user.email)) {
        throw new Error(
          `Auth0 store: user with email ${user.email} already exists`,
        );
      }
      users.set(user.user_id, user);
      usersByEmail.set(user.email, user);
      return user;
    },
    getUser(userId) {
      return users.get(userId) ?? null;
    },
    getUserByEmail(email) {
      return usersByEmail.get(email) ?? null;
    },
    updateUser(userId, patch) {
      const current = users.get(userId);
      if (!current) throw new Error(`Auth0 store: unknown user id ${userId}`);
      const next: Auth0User = {
        ...current,
        ...patch,
        updated_at: new Date(),
      };
      users.set(userId, next);
      if (patch.email && patch.email !== current.email) {
        usersByEmail.delete(current.email);
        usersByEmail.set(next.email, next);
      } else {
        usersByEmail.set(next.email, next);
      }
      return next;
    },
    deleteUser(userId) {
      const user = users.get(userId);
      if (!user) return;
      users.delete(userId);
      usersByEmail.delete(user.email);
    },
    listUsers() {
      return Array.from(users.values());
    },
    nextUserId(connection) {
      const prefix = connectionPrefix(connection);
      const current = counters.get(prefix) ?? 0;
      const next = current + 1;
      counters.set(prefix, next);
      // Auth0 real user_id shape is `<prefix>|<24-hex>` for database +
      // `<prefix>|<numeric>` for social. Padded zero counter is a stable
      // stand-in for tests that assert against the shape.
      return `${prefix}|${next.toString().padStart(24, '0')}`;
    },
    reset() {
      users.clear();
      usersByEmail.clear();
      counters.clear();
    },
  };
}
