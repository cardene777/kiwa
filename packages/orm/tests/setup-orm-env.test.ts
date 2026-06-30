// Unit tests for @kiwa-test/orm v0.1 (Drizzle + SQLite MVP).

import { afterEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { setupOrmEnv, expectQuery, expectRowCount } from '../src/index.js';
import type { OrmTestEnvMock } from '../src/index.js';

// Drizzle schema for the tests — exercises a text id, indexed unique field,
// and an integer FK back to the same table to verify FK pragma is on.
const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  email: text('email').notNull().unique(),
  parentId: integer('parent_id'),
});
const schema = { users };
type AppSchema = typeof schema;

const MIGRATION = `
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  parent_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX users_email_idx ON users(email);
`;

let env: OrmTestEnvMock<AppSchema> | null = null;

afterEach(async () => {
  if (env !== null) {
    await env.stop();
    env = null;
  }
});

describe('setupOrmEnv (drizzle + sqlite + in-memory)', () => {
  it('T-ORM-001: empty migration → schema not created, count query rejects', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
    });
    expect(() => env!.raw.prepare('SELECT COUNT(*) AS c FROM users').get()).toThrow(/no such table/);
  });

  it('T-ORM-002: migration string applied → drizzle insert + select round-trip works', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: MIGRATION,
    });
    env.db.insert(users).values({ id: 1, email: 'alice@example.com', parentId: null }).run();
    const rows = env.db.select().from(users).all();
    expect(rows).toEqual([{ id: 1, email: 'alice@example.com', parentId: null }]);
  });

  it('T-ORM-003: seed callback runs after migration with live drizzle client', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: MIGRATION,
      seed: (db) => {
        db.insert(users).values({ id: 10, email: 'seeded@example.com', parentId: null }).run();
      },
    });
    const rows = env.db.select().from(users).all();
    expect(rows.length).toBe(1);
    expect(rows[0]?.email).toBe('seeded@example.com');
  });

  it('T-ORM-004: where + eq filter narrows results to a single row', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: MIGRATION,
      seed: (db) => {
        db.insert(users).values({ id: 1, email: 'a@x', parentId: null }).run();
        db.insert(users).values({ id: 2, email: 'b@x', parentId: null }).run();
      },
    });
    const rows = env.db.select().from(users).where(eq(users.email, 'b@x')).all();
    expect(rows).toEqual([{ id: 2, email: 'b@x', parentId: null }]);
  });

  it('T-ORM-005: update + delete reflect in subsequent queries', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: MIGRATION,
      seed: (db) => {
        db.insert(users).values({ id: 1, email: 'a@x', parentId: null }).run();
        db.insert(users).values({ id: 2, email: 'b@x', parentId: null }).run();
      },
    });
    env.db.update(users).set({ email: 'a2@x' }).where(eq(users.id, 1)).run();
    env.db.delete(users).where(eq(users.id, 2)).run();
    const rows = env.db.select().from(users).all();
    expect(rows).toEqual([{ id: 1, email: 'a2@x', parentId: null }]);
  });

  it('T-ORM-006: foreign_keys pragma is ON — invalid FK insert rejects', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: MIGRATION,
    });
    expect(() =>
      env!.db.insert(users).values({ id: 1, email: 'orphan@x', parentId: 999 }).run(),
    ).toThrow(/FOREIGN KEY constraint failed/);
  });

  it('T-ORM-007: stop() closes the connection — subsequent query throws', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: MIGRATION,
    });
    const raw = env.raw;
    await env.stop();
    env = null;
    expect(() => raw.prepare('SELECT 1').get()).toThrow(/database connection is not open/);
  });

  it('T-ORM-008: two parallel envs are isolated — same id can exist in both', async () => {
    const envA = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: MIGRATION,
      seed: (db) => {
        db.insert(users).values({ id: 1, email: 'a@x', parentId: null }).run();
      },
    });
    const envB = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: MIGRATION,
      seed: (db) => {
        db.insert(users).values({ id: 1, email: 'b@x', parentId: null }).run();
      },
    });
    expect(envA.db.select().from(users).all()[0]?.email).toBe('a@x');
    expect(envB.db.select().from(users).all()[0]?.email).toBe('b@x');
    await envA.stop();
    await envB.stop();
  });

  it('T-ORM-009: rejects unsupported orm at runtime (Kysely tracked in CAR-294)', async () => {
    await expect(
      // Cast to bypass overloads — runtime validation is the contract under test.
      (setupOrmEnv as unknown as (o: unknown) => Promise<unknown>)({
        mode: 'mock',
        orm: 'kysely',
        dialect: 'sqlite',
        schema,
      }),
    ).rejects.toThrow(/v0\.3 only supports orm='drizzle' or 'prisma'/);
  });

  it('T-ORM-010: expectQuery + expectRowCount helpers assert raw SQL state', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: MIGRATION,
      seed: (db) => {
        db.insert(users).values({ id: 1, email: 'a@x', parentId: null }).run();
        db.insert(users).values({ id: 2, email: 'b@x', parentId: null }).run();
      },
    });
    await expectRowCount(env, 'users', 2, expect);
    await expectQuery(env, 'SELECT email FROM users ORDER BY id', [{ email: 'a@x' }, { email: 'b@x' }], expect);
  });
});
