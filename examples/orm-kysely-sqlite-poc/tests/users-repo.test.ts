// PoC tests — @kiwa/orm v0.4 (Kysely + in-memory SQLite).

import { afterEach, describe, expect, it } from 'vitest';
import { setupOrmEnv, expectRowCount } from '@kiwa/orm';
import type { OrmTestEnvMockKysely } from '@kiwa/orm';
import { schema, type Database } from '../src/schema.js';
import { INITIAL_MIGRATION } from '../src/migration.sql.js';
import { UsersRepository } from '../src/users-repo.js';

let env: OrmTestEnvMockKysely<Database> | null = null;
afterEach(async () => {
  if (env) { await env.stop(); env = null; }
});

async function newEnv(): Promise<OrmTestEnvMockKysely<Database>> {
  return setupOrmEnv({
    mode: 'mock',
    orm: 'kysely',
    dialect: 'sqlite',
    schema,
    migrations: INITIAL_MIGRATION,
  });
}

describe('UsersRepository via @kiwa/orm (kysely + in-memory SQLite)', () => {
  it('T-KY-001: create + findByEmail round-trip via Kysely', async () => {
    env = await newEnv();
    const repo = new UsersRepository(env.db);
    const created = await repo.create({ email: 'alice@example.com', displayName: 'Alice' });
    expect(created.ok).toBe(true);
    const found = await repo.findByEmail('alice@example.com');
    expect(found?.email).toBe('alice@example.com');
    expect(found?.display_name).toBe('Alice');
  });

  it('T-KY-002: duplicate email returns duplicate-email reason (SQLite UNIQUE)', async () => {
    env = await newEnv();
    await env.db.insertInto('users').values({ email: 'alice@example.com', display_name: 'Alice' }).execute();
    const second = await new UsersRepository(env.db).create({ email: 'alice@example.com', displayName: 'Alice 2' });
    expect(second).toEqual({ ok: false, reason: 'duplicate-email' });
  });

  it('T-KY-003: findByEmail returns null for missing email', async () => {
    env = await newEnv();
    expect(await new UsersRepository(env.db).findByEmail('nobody@example.com')).toBeNull();
  });

  it('T-KY-004: user delete cascades to posts (SQLite FK ON DELETE CASCADE)', async () => {
    env = await newEnv();
    const inserted = await env.db.insertInto('users').values({ email: 'a@x', display_name: 'A' }).returning('id').executeTakeFirstOrThrow();
    await env.db.insertInto('posts').values([
      { author_id: inserted.id, title: 'p1', published: 0 },
      { author_id: inserted.id, title: 'p2', published: 1 },
    ]).execute();
    const result = await new UsersRepository(env.db).deleteCascading(inserted.id);
    expect(result.deletedPosts).toBe(2);
    await expectRowCount(env, 'posts', 0, expect);
    await expectRowCount(env, 'users', 0, expect);
  });

  it('T-KY-005: type-safe where filter narrows results (Kysely query builder)', async () => {
    env = await newEnv();
    await env.db.insertInto('users').values([
      { email: 'a@x', display_name: 'A' },
      { email: 'b@x', display_name: 'B' },
    ]).execute();
    const rows = await env.db.selectFrom('users').selectAll().where('email', '=', 'b@x').execute();
    expect(rows.length).toBe(1);
    expect(rows[0]?.display_name).toBe('B');
  });

  it('T-KY-006: orphan post insert rejects with FK violation (foreign_keys pragma ON)', async () => {
    env = await newEnv();
    await expect(
      env.db.insertInto('posts').values({ author_id: 999, title: 'orphan', published: 0 }).execute(),
    ).rejects.toThrow(/FOREIGN KEY/);
  });

  it('T-KY-007: parallel envs are isolated (different :memory: databases)', async () => {
    const envA = await setupOrmEnv({
      mode: 'mock', orm: 'kysely', dialect: 'sqlite', schema, migrations: INITIAL_MIGRATION,
      seed: async (db) => {
        await db.insertInto('users').values({ email: 'a@x', display_name: 'Alice in A' }).execute();
      },
    });
    const envB = await setupOrmEnv({
      mode: 'mock', orm: 'kysely', dialect: 'sqlite', schema, migrations: INITIAL_MIGRATION,
      seed: async (db) => {
        await db.insertInto('users').values({ email: 'a@x', display_name: 'Alice in B' }).execute();
      },
    });
    const a = await envA.db.selectFrom('users').selectAll().executeTakeFirstOrThrow();
    const b = await envB.db.selectFrom('users').selectAll().executeTakeFirstOrThrow();
    expect(a.display_name).toBe('Alice in A');
    expect(b.display_name).toBe('Alice in B');
    await envA.stop();
    await envB.stop();
  });

  it('T-KY-008: stop() destroys the Kysely instance + closes underlying SQLite', async () => {
    const local = await newEnv();
    const raw = local.raw;
    await local.stop();
    expect(() => raw.prepare('SELECT 1').get()).toThrow(/database connection is not open/);
  });
});
