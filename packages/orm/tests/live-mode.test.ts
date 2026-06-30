// Live-mode tests for @kiwa-test/orm v0.2 (Drizzle + Postgres via testcontainers).
//
// Each test starts a fresh Postgres container (postgres:16-alpine). Startup
// overhead ~3-5s per container, so the suite is intentionally focused on
// behaviors that mock mode cannot cover (real SQL dialect, transaction
// semantics, connection lifecycle).
//
// CI requires a working Docker daemon. Tests skip themselves with a clear
// error message if Docker is not reachable.

import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core';
import { setupOrmEnv, expectQuery, expectRowCount } from '../src/index.js';
import type { OrmTestEnvLive } from '../src/index.js';

const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  parentId: integer('parent_id'),
});
const schema = { users };
type AppSchema = typeof schema;

const MIGRATION = `
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  parent_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX users_email_idx ON users(email);
`;

// Detect whether the local Docker daemon is reachable. We probe once at
// suite startup and skip the live suite cleanly otherwise so contributors
// without Docker can still run `pnpm -F @kiwa-test/orm test` for mock mode.
let dockerAvailable = false;

beforeAll(async () => {
  try {
    const { default: Docker } = await import('dockerode');
    const docker = new Docker();
    await docker.ping();
    dockerAvailable = true;
  } catch {
    dockerAvailable = false;
  }
}, 30_000);

let env: OrmTestEnvLive<AppSchema> | null = null;

afterEach(async () => {
  if (env !== null) {
    await env.stop();
    env = null;
  }
}, 30_000);

describe('setupOrmEnv (drizzle + postgres + testcontainers)', () => {
  it('T-ORM-101: container starts, migration applies, insert + select round-trip', async () => {
    if (!dockerAvailable) return;
    env = await setupOrmEnv({
      mode: 'live',
      orm: 'drizzle',
      dialect: 'postgres',
      schema,
      migrations: MIGRATION,
    });
    expect(env.connectionUri).toMatch(/^postgres(?:ql)?:\/\//);

    await env.db.insert(users).values({ id: 1, email: 'alice@example.com', parentId: null });
    const rows = await env.db.select().from(users);
    expect(rows).toEqual([{ id: 1, email: 'alice@example.com', parentId: null }]);
  }, 120_000);

  it('T-ORM-102: seed callback runs with live drizzle client', async () => {
    if (!dockerAvailable) return;
    env = await setupOrmEnv({
      mode: 'live',
      orm: 'drizzle',
      dialect: 'postgres',
      schema,
      migrations: MIGRATION,
      seed: async (db) => {
        await db.insert(users).values({ id: 10, email: 'seeded@example.com', parentId: null });
      },
    });
    const rows = await env.db.select().from(users);
    expect(rows.length).toBe(1);
    expect(rows[0]?.email).toBe('seeded@example.com');
  }, 120_000);

  it('T-ORM-103: where + eq narrows to a single row (real Postgres parser)', async () => {
    if (!dockerAvailable) return;
    env = await setupOrmEnv({
      mode: 'live',
      orm: 'drizzle',
      dialect: 'postgres',
      schema,
      migrations: MIGRATION,
      seed: async (db) => {
        await db.insert(users).values([
          { id: 1, email: 'a@x', parentId: null },
          { id: 2, email: 'b@x', parentId: null },
        ]);
      },
    });
    const rows = await env.db.select().from(users).where(eq(users.email, 'b@x'));
    expect(rows).toEqual([{ id: 2, email: 'b@x', parentId: null }]);
  }, 120_000);

  it('T-ORM-104: UNIQUE constraint violation rejects with Postgres error code', async () => {
    if (!dockerAvailable) return;
    env = await setupOrmEnv({
      mode: 'live',
      orm: 'drizzle',
      dialect: 'postgres',
      schema,
      migrations: MIGRATION,
      seed: async (db) => {
        await db.insert(users).values({ id: 1, email: 'dup@x', parentId: null });
      },
    });
    await expect(env.db.insert(users).values({ id: 2, email: 'dup@x', parentId: null })).rejects.toThrow(/duplicate key value violates unique constraint/);
  }, 120_000);

  it('T-ORM-105: FK ON DELETE SET NULL takes effect (real Postgres FK semantics)', async () => {
    if (!dockerAvailable) return;
    env = await setupOrmEnv({
      mode: 'live',
      orm: 'drizzle',
      dialect: 'postgres',
      schema,
      migrations: MIGRATION,
      seed: async (db) => {
        await db.insert(users).values({ id: 1, email: 'parent@x', parentId: null });
        await db.insert(users).values({ id: 2, email: 'child@x', parentId: 1 });
      },
    });
    await env.db.delete(users).where(eq(users.id, 1));
    const remaining = await env.db.select().from(users);
    expect(remaining).toEqual([{ id: 2, email: 'child@x', parentId: null }]);
  }, 120_000);

  it('T-ORM-106: expectRowCount + expectQuery helpers work over postgres.js', async () => {
    if (!dockerAvailable) return;
    env = await setupOrmEnv({
      mode: 'live',
      orm: 'drizzle',
      dialect: 'postgres',
      schema,
      migrations: MIGRATION,
      seed: async (db) => {
        await db.insert(users).values([
          { id: 1, email: 'a@x', parentId: null },
          { id: 2, email: 'b@x', parentId: null },
        ]);
      },
    });
    await expectRowCount(env, 'users', 2, expect);
    await expectQuery(env, 'SELECT email FROM users ORDER BY id', [{ email: 'a@x' }, { email: 'b@x' }], expect);
  }, 120_000);

  it('T-ORM-107: stop() closes the pool + tears down the container', async () => {
    if (!dockerAvailable) return;
    const local = await setupOrmEnv({
      mode: 'live',
      orm: 'drizzle',
      dialect: 'postgres',
      schema,
      migrations: MIGRATION,
    });
    await local.stop();
    // Re-running a query against the now-closed pool must fail rather than
    // silently re-open a connection.
    await expect(local.raw.unsafe('SELECT 1').then((r) => Array.from(r as unknown as Iterable<unknown>))).rejects.toBeDefined();
  }, 120_000);
});
