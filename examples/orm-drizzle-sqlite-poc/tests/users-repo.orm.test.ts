// PoC tests — kiwa-test/orm + Drizzle + SQLite。
// 8 test で UsersRepository の正常系 / 異常系 / FK cascade / unique 衝突 / 並行 env 隔離 を cover。

import { afterEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { setupOrmEnv, expectRowCount } from '@kiwa-lab/orm';
import type { OrmTestEnv } from '@kiwa-lab/orm';
import { posts, schema, type Schema } from '../src/schema.js';
import { INITIAL_MIGRATION } from '../src/migration.sql.js';
import { UsersRepository } from '../src/users-repo.js';

let env: OrmTestEnv<Schema> | null = null;
afterEach(async () => {
  if (env) { await env.stop(); env = null; }
});

describe('UsersRepository via @kiwa-lab/orm', () => {
  it('T-POC-001: create + findByEmail で round-trip', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: INITIAL_MIGRATION,
    });
    const repo = new UsersRepository(env.db);
    expect(repo.create({ id: 1, email: 'alice@example.com', displayName: 'Alice' })).toEqual({ ok: true });
    expect(repo.findByEmail('alice@example.com')).toEqual({ id: 1, email: 'alice@example.com', displayName: 'Alice' });
  });

  it('T-POC-002: 重複 email で duplicate-email を返す (UNIQUE 制約)', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: INITIAL_MIGRATION,
      seed: (db) => {
        db.insert(schema.users).values({ id: 1, email: 'alice@example.com', displayName: 'Alice' }).run();
      },
    });
    const repo = new UsersRepository(env.db);
    expect(repo.create({ id: 2, email: 'alice@example.com', displayName: 'Alice 2' })).toEqual({ ok: false, reason: 'duplicate-email' });
  });

  it('T-POC-003: findByEmail で存在しない email は null', async () => {
    env = await setupOrmEnv({ mode: 'mock', orm: 'drizzle', dialect: 'sqlite', schema, migrations: INITIAL_MIGRATION });
    expect(new UsersRepository(env.db).findByEmail('nobody@example.com')).toBeNull();
  });

  it('T-POC-004: user delete で関連 posts も cascade 削除', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: INITIAL_MIGRATION,
      seed: (db) => {
        db.insert(schema.users).values({ id: 1, email: 'a@x', displayName: 'A' }).run();
        db.insert(schema.posts).values({ id: 10, authorId: 1, title: 'p1', published: false }).run();
        db.insert(schema.posts).values({ id: 11, authorId: 1, title: 'p2', published: true }).run();
      },
    });
    const repo = new UsersRepository(env.db);
    const result = repo.deleteCascading(1);
    expect(result.deletedPosts).toBe(2);
    expectRowCount(env, 'posts', 0, expect);
    expectRowCount(env, 'users', 0, expect);
  });

  it('T-POC-005: 別 user の posts は cascade で消えない', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: INITIAL_MIGRATION,
      seed: (db) => {
        db.insert(schema.users).values({ id: 1, email: 'a@x', displayName: 'A' }).run();
        db.insert(schema.users).values({ id: 2, email: 'b@x', displayName: 'B' }).run();
        db.insert(schema.posts).values({ id: 10, authorId: 1, title: 'p1', published: false }).run();
        db.insert(schema.posts).values({ id: 20, authorId: 2, title: 'p2', published: true }).run();
      },
    });
    new UsersRepository(env.db).deleteCascading(1);
    const remaining = env.db.select().from(posts).all();
    expect(remaining.length).toBe(1);
    expect(remaining[0]?.authorId).toBe(2);
  });

  it('T-POC-006: drizzle eq filter で email 検索 (case-sensitive)', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: INITIAL_MIGRATION,
      seed: (db) => {
        db.insert(schema.users).values({ id: 1, email: 'alice@example.com', displayName: 'Alice' }).run();
      },
    });
    expect(env.db.select().from(schema.users).where(eq(schema.users.email, 'ALICE@EXAMPLE.COM')).all().length).toBe(0);
    expect(env.db.select().from(schema.users).where(eq(schema.users.email, 'alice@example.com')).all().length).toBe(1);
  });

  it('T-POC-007: orphan post (存在しない author_id) は FK 制約で reject', async () => {
    // Bound to a const because the assertion reads it inside a callback, and
    // TypeScript will not carry a narrowing of `env` — a mutable `let` of the
    // whole `OrmTestEnv` union — across that boundary. `!` only removes `null`,
    // and the Prisma variants that remain have no `db`.
    const drizzle = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: INITIAL_MIGRATION,
    });
    env = drizzle;

    expect(() =>
      drizzle.db.insert(schema.posts).values({ id: 99, authorId: 999, title: 'orphan', published: false }).run(),
    ).toThrow(/FOREIGN KEY/);
  });

  it('T-POC-008: 並行 env で同 id の user を別 displayName で持てる (隔離保証)', async () => {
    const envA = await setupOrmEnv({
      mode: 'mock', orm: 'drizzle', dialect: 'sqlite', schema, migrations: INITIAL_MIGRATION,
      seed: (db) => {
        db.insert(schema.users).values({ id: 1, email: 'a@x', displayName: 'Alice in A' }).run();
      },
    });
    const envB = await setupOrmEnv({
      mode: 'mock', orm: 'drizzle', dialect: 'sqlite', schema, migrations: INITIAL_MIGRATION,
      seed: (db) => {
        db.insert(schema.users).values({ id: 1, email: 'a@x', displayName: 'Alice in B' }).run();
      },
    });
    expect(envA.db.select().from(schema.users).all()[0]?.displayName).toBe('Alice in A');
    expect(envB.db.select().from(schema.users).all()[0]?.displayName).toBe('Alice in B');
    await envA.stop();
    await envB.stop();
  });
});

describe('UsersRepository — 捕まえない例外', () => {
  it('T-POC-009: 重複 id は捕まえず送出する (regex が users.email 限定)', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: INITIAL_MIGRATION,
      seed: (db) => {
        db.insert(schema.users).values({ id: 1, email: 'a@x', displayName: 'A' }).run();
      },
    });
    const repo = new UsersRepository(env.db);
    expect(() => repo.create({ id: 1, email: 'b@x', displayName: 'B' })).toThrow(
      /UNIQUE constraint failed: users\.id/,
    );
  });
});

describe('UsersRepository — 削除の境界', () => {
  it('T-POC-010: 存在しない id の削除は 0 件で送出しない', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: INITIAL_MIGRATION,
    });
    expect(new UsersRepository(env.db).deleteCascading(999)).toEqual({ deletedPosts: 0 });
  });
});

describe('schema の既定値と NOT NULL', () => {
  it('T-POC-011: published を省くと false になる', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: INITIAL_MIGRATION,
      seed: (db) => {
        db.insert(schema.users).values({ id: 1, email: 'a@x', displayName: 'A' }).run();
      },
    });
    env.db.insert(posts).values({ id: 10, authorId: 1, title: 'p1' }).run();
    expect(env.db.select().from(posts).all()[0]?.published).toBe(false);
  });

  it('T-POC-012: email が NOT NULL', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: INITIAL_MIGRATION,
    });
    expect(() =>
      env!.db
        .insert(schema.users)
        .values({ id: 1, email: null, displayName: 'A' } as never)
        .run(),
    ).toThrow(/NOT NULL constraint failed: users\.email/);
  });

  it('T-POC-013: display_name が NOT NULL', async () => {
    // 列ごとに分ける。 まとめると片方の NOT NULL が外れても気付けない。
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: INITIAL_MIGRATION,
    });
    expect(() =>
      env!.db
        .insert(schema.users)
        .values({ id: 1, email: 'a@x', displayName: null } as never)
        .run(),
    ).toThrow(/NOT NULL constraint failed: users\.display_name/);
  });
});

describe('SQL 側の既定値', () => {
  it('T-POC-014: raw SQL で列を省くと SQL 側の既定 (0) が使われる', async () => {
    // T-POC-011 は Drizzle 側の既定を見る。 Drizzle は列を省いても値を明示的に
    // 送るため、SQL 側の既定はその経路では使われない (変異で実測した)。
    // 両者がずれても Drizzle 経由では気付けないので、raw で SQL 側を直接見る。
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: INITIAL_MIGRATION,
      seed: (db) => {
        db.insert(schema.users).values({ id: 1, email: 'a@x', displayName: 'A' }).run();
      },
    });
    env.raw.prepare('INSERT INTO posts (id, author_id, title) VALUES (?, ?, ?)').run(10, 1, 'p1');
    const row = env.raw.prepare('SELECT published FROM posts WHERE id = ?').get(10) as {
      published: number;
    };
    expect(row.published).toBe(0);
  });
});
