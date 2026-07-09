// Live-mode tests for @kiwa-lab/orm v0.2.1 (Drizzle + MySQL via testcontainers).
//
// Mirrors live-mode.test.ts (Postgres) — each test starts a fresh MySQL container
// (mysql:8.4). Startup overhead ~5-15s per container, so the suite stays focused
// on MySQL-specific behaviors (collation, AUTO_INCREMENT, FK enforcement).

import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { mysqlTable, int, varchar, index } from 'drizzle-orm/mysql-core';
import { setupOrmEnv, expectQuery, expectRowCount } from '../src/index.js';
import type { OrmTestEnvLiveMysql } from '../src/index.js';

const users = mysqlTable(
  'users',
  {
    id: int('id').autoincrement().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    parentId: int('parent_id'),
  },
  (t) => ({ emailIdx: index('users_email_idx').on(t.email) }),
);
const schema = { users };
type AppSchema = typeof schema;

const MIGRATION = `
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  parent_id INT NULL,
  CONSTRAINT users_parent_fk FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX users_email_idx ON users(email);
`;

let dockerAvailable = false;
beforeAll(async () => {
  try {
    const { default: Docker } = await import('dockerode');
    await new Docker().ping();
    dockerAvailable = true;
  } catch {
    dockerAvailable = false;
  }
}, 30_000);

let env: OrmTestEnvLiveMysql<AppSchema> | null = null;
afterEach(async () => {
  if (env !== null) {
    await env.stop();
    env = null;
  }
}, 60_000);

describe('setupOrmEnv (drizzle + mysql + testcontainers)', () => {
  it('T-ORM-201: container starts, migration applies, insert + select round-trip', async () => {
    if (!dockerAvailable) return;
    env = await setupOrmEnv({
      mode: 'live',
      orm: 'drizzle',
      dialect: 'mysql',
      schema,
      migrations: MIGRATION,
    });
    expect(env.connectionUri).toMatch(/^mysql:\/\//);
    await env.db.insert(users).values({ id: 1, email: 'alice@example.com', parentId: null });
    const rows = await env.db.select().from(users);
    expect(rows).toEqual([{ id: 1, email: 'alice@example.com', parentId: null }]);
  }, 180_000);

  it('T-ORM-202: seed callback runs with live drizzle client', async () => {
    if (!dockerAvailable) return;
    env = await setupOrmEnv({
      mode: 'live',
      orm: 'drizzle',
      dialect: 'mysql',
      schema,
      migrations: MIGRATION,
      seed: async (db) => {
        await db.insert(users).values({ id: 10, email: 'seeded@example.com', parentId: null });
      },
    });
    const rows = await env.db.select().from(users);
    expect(rows.length).toBe(1);
    expect(rows[0]?.email).toBe('seeded@example.com');
  }, 180_000);

  it('T-ORM-203: where + eq narrows to a single row (real MySQL parser)', async () => {
    if (!dockerAvailable) return;
    env = await setupOrmEnv({
      mode: 'live',
      orm: 'drizzle',
      dialect: 'mysql',
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
  }, 180_000);

  it('T-ORM-204: UNIQUE constraint violation rejects with MySQL ER_DUP_ENTRY', async () => {
    if (!dockerAvailable) return;
    env = await setupOrmEnv({
      mode: 'live',
      orm: 'drizzle',
      dialect: 'mysql',
      schema,
      migrations: MIGRATION,
      seed: async (db) => {
        await db.insert(users).values({ id: 1, email: 'dup@x', parentId: null });
      },
    });
    await expect(env.db.insert(users).values({ id: 2, email: 'dup@x', parentId: null })).rejects.toThrow(/Duplicate entry/);
  }, 180_000);

  it('T-ORM-205: FK ON DELETE SET NULL takes effect (real MySQL InnoDB)', async () => {
    if (!dockerAvailable) return;
    env = await setupOrmEnv({
      mode: 'live',
      orm: 'drizzle',
      dialect: 'mysql',
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
  }, 180_000);

  it('T-ORM-206: expectRowCount + expectQuery helpers work over mysql2', async () => {
    if (!dockerAvailable) return;
    env = await setupOrmEnv({
      mode: 'live',
      orm: 'drizzle',
      dialect: 'mysql',
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
  }, 180_000);

  it('T-ORM-207: stop() closes the pool + tears down the container', async () => {
    if (!dockerAvailable) return;
    const local = await setupOrmEnv({
      mode: 'live',
      orm: 'drizzle',
      dialect: 'mysql',
      schema,
      migrations: MIGRATION,
    });
    await local.stop();
    // Re-running a query against the now-closed pool must fail.
    await expect(local.raw.query('SELECT 1')).rejects.toBeDefined();
  }, 180_000);
});
