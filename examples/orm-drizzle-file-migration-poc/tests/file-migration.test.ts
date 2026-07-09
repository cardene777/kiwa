// PoC tests — @kiwa-lab/orm v0.5 (file-based migration via drizzle-orm/migrator).

import { afterEach, describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import { setupOrmEnv, expectRowCount } from '@kiwa-lab/orm';
import type { OrmTestEnvMock } from '@kiwa-lab/orm';
import { posts, schema, type Schema, users } from '../src/schema.js';

const DRIZZLE_FOLDER = resolve(process.cwd(), 'drizzle');

let env: OrmTestEnvMock<Schema> | null = null;
afterEach(async () => {
  if (env) { await env.stop(); env = null; }
});

describe('file-based migration via drizzle-orm/better-sqlite3/migrator', () => {
  it('T-FM-001: { folder } 形式 migration が適用される (users + posts table 生成)', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: { folder: DRIZZLE_FOLDER },
    });
    // drizzle が `__drizzle_migrations` を追加するため users / posts は別カウント。
    env.db.insert(users).values({ id: 1, email: 'alice@example.com', displayName: 'Alice' }).run();
    env.db.insert(posts).values({ id: 10, authorId: 1, title: 'first' }).run();
    const rows = env.db.select().from(posts).all();
    expect(rows).toEqual([{ id: 10, authorId: 1, title: 'first' }]);
  });

  it('T-FM-002: seed callback runs after folder migration', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: { folder: DRIZZLE_FOLDER },
      seed: (db) => {
        db.insert(users).values({ id: 1, email: 'seeded@example.com', displayName: 'Seed' }).run();
      },
    });
    const u = env.db.select().from(users).all();
    expect(u.length).toBe(1);
    expect(u[0]?.email).toBe('seeded@example.com');
  });

  it('T-FM-003: FK ON DELETE cascade is applied (folder migration が FK 制約も反映)', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: { folder: DRIZZLE_FOLDER },
      seed: (db) => {
        db.insert(users).values({ id: 1, email: 'a@x', displayName: 'A' }).run();
        db.insert(posts).values({ id: 10, authorId: 1, title: 'p1' }).run();
      },
    });
    env.db.delete(users).where(eq(users.id, 1)).run();
    await expectRowCount(env, 'posts', 0, expect);
  });

  it('T-FM-004: backward compat — string 形式 migration も引き続き動作', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: 'CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT UNIQUE, display_name TEXT); CREATE TABLE posts (id INTEGER PRIMARY KEY, author_id INTEGER REFERENCES users(id) ON DELETE CASCADE, title TEXT);',
    });
    env.db.insert(users).values({ id: 1, email: 'a@x', displayName: 'A' }).run();
    await expectRowCount(env, 'users', 1, expect);
  });
});
