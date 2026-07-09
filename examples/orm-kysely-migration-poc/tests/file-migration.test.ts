// PoC tests — @kiwa-lab/orm v0.7 (file-based migration via Kysely Migrator).

import { afterEach, describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { setupOrmEnv, expectRowCount } from '@kiwa-lab/orm';
import type { OrmTestEnvMockKysely } from '@kiwa-lab/orm';
import { schema, type Database } from '../src/schema.js';

const MIGRATION_FOLDER = resolve(process.cwd(), 'migrations');

let env: OrmTestEnvMockKysely<Database> | null = null;
afterEach(async () => {
  if (env) { await env.stop(); env = null; }
});

describe('Kysely Migrator via @kiwa-lab/orm (mock + sqlite + { folder } migration)', () => {
  it('T-KM-001: { folder } 形式の Kysely migration が両 file 適用される (users + posts 生成)', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'kysely',
      dialect: 'sqlite',
      schema,
      migrations: { folder: MIGRATION_FOLDER },
    });
    await env.db.insertInto('users').values({ email: 'alice@example.com', display_name: 'Alice' }).execute();
    const u = await env.db.selectFrom('users').selectAll().executeTakeFirstOrThrow();
    await env.db.insertInto('posts').values({ author_id: u.id, title: 'first', published: 0 }).execute();
    const post = await env.db.selectFrom('posts').selectAll().executeTakeFirstOrThrow();
    expect(post.title).toBe('first');
  });

  it('T-KM-002: seed callback runs after folder migration', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'kysely',
      dialect: 'sqlite',
      schema,
      migrations: { folder: MIGRATION_FOLDER },
      seed: async (db) => {
        await db.insertInto('users').values({ email: 'seed@example.com', display_name: 'Seed' }).execute();
      },
    });
    const u = await env.db.selectFrom('users').selectAll().executeTakeFirstOrThrow();
    expect(u.email).toBe('seed@example.com');
  });

  it('T-KM-003: FK ON DELETE cascade が反映される (folder migration が FK 制約を含む)', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'kysely',
      dialect: 'sqlite',
      schema,
      migrations: { folder: MIGRATION_FOLDER },
      seed: async (db) => {
        const u = await db.insertInto('users').values({ email: 'a@x', display_name: 'A' }).returning('id').executeTakeFirstOrThrow();
        await db.insertInto('posts').values({ author_id: u.id, title: 'p1', published: 0 }).execute();
      },
    });
    await env.db.deleteFrom('users').execute();
    await expectRowCount(env, 'posts', 0, expect);
  });

  it('T-KM-004: backward compat — SQL 文字列形式 migration も引き続き動作', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'kysely',
      dialect: 'sqlite',
      schema,
      migrations: 'CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE, display_name TEXT); CREATE TABLE posts (id INTEGER PRIMARY KEY AUTOINCREMENT, author_id INTEGER REFERENCES users(id) ON DELETE CASCADE, title TEXT, published INTEGER NOT NULL DEFAULT 0);',
    });
    await env.db.insertInto('users').values({ email: 'a@x', display_name: 'A' }).execute();
    await expectRowCount(env, 'users', 1, expect);
  });
});
