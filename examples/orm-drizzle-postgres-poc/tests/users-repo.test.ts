// PoC tests — @kiwa-lab/orm v0.2 (Drizzle + Postgres via testcontainers).

import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { setupOrmEnv, expectRowCount } from '@kiwa-lab/orm';
import type { OrmTestEnvLive } from '@kiwa-lab/orm';
import { posts, schema, type Schema } from '../src/schema.js';
import { INITIAL_MIGRATION } from '../src/migration.sql.js';
import { UsersRepository } from '../src/users-repo.js';

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

let env: OrmTestEnvLive<Schema> | null = null;
afterEach(async () => {
  if (env) { await env.stop(); env = null; }
}, 30_000);

describe('UsersRepository via @kiwa-lab/orm (postgres testcontainers)', () => {
  it('T-PG-001: create + findByEmail round-trip on real Postgres', async () => {
    if (!dockerAvailable) return;
    env = await setupOrmEnv({
      mode: 'live',
      orm: 'drizzle',
      dialect: 'postgres',
      schema,
      migrations: INITIAL_MIGRATION,
    });
    const repo = new UsersRepository(env.db);
    const created = await repo.create({ email: 'alice@example.com', displayName: 'Alice' });
    expect(created.ok).toBe(true);
    const found = await repo.findByEmail('alice@example.com');
    expect(found?.email).toBe('alice@example.com');
    expect(found?.displayName).toBe('Alice');
  }, 120_000);

  it('T-PG-002: duplicate email returns duplicate-email reason (real Postgres UNIQUE)', async () => {
    if (!dockerAvailable) return;
    env = await setupOrmEnv({
      mode: 'live',
      orm: 'drizzle',
      dialect: 'postgres',
      schema,
      migrations: INITIAL_MIGRATION,
      seed: async (db) => {
        await db.insert(schema.users).values({ email: 'alice@example.com', displayName: 'Alice' });
      },
    });
    const second = await new UsersRepository(env.db).create({ email: 'alice@example.com', displayName: 'Alice 2' });
    expect(second).toEqual({ ok: false, reason: 'duplicate-email' });
  }, 120_000);

  it('T-PG-003: findByEmail returns null for missing email', async () => {
    if (!dockerAvailable) return;
    env = await setupOrmEnv({ mode: 'live', orm: 'drizzle', dialect: 'postgres', schema, migrations: INITIAL_MIGRATION });
    expect(await new UsersRepository(env.db).findByEmail('nobody@example.com')).toBeNull();
  }, 120_000);

  it('T-PG-004: user delete cascades to posts (real Postgres FK)', async () => {
    if (!dockerAvailable) return;
    env = await setupOrmEnv({
      mode: 'live',
      orm: 'drizzle',
      dialect: 'postgres',
      schema,
      migrations: INITIAL_MIGRATION,
      seed: async (db) => {
        await db.insert(schema.users).values({ id: 1, email: 'a@x', displayName: 'A' });
        await db.insert(schema.posts).values([
          { id: 10, authorId: 1, title: 'p1', published: false },
          { id: 11, authorId: 1, title: 'p2', published: true },
        ]);
      },
    });
    const result = await new UsersRepository(env.db).deleteCascading(1);
    expect(result.deletedPosts).toBe(2);
    await expectRowCount(env, 'posts', 0, expect);
    await expectRowCount(env, 'users', 0, expect);
  }, 120_000);

  it('T-PG-005: other user posts survive cascade delete', async () => {
    if (!dockerAvailable) return;
    env = await setupOrmEnv({
      mode: 'live',
      orm: 'drizzle',
      dialect: 'postgres',
      schema,
      migrations: INITIAL_MIGRATION,
      seed: async (db) => {
        await db.insert(schema.users).values([
          { id: 1, email: 'a@x', displayName: 'A' },
          { id: 2, email: 'b@x', displayName: 'B' },
        ]);
        await db.insert(schema.posts).values([
          { id: 10, authorId: 1, title: 'p1', published: false },
          { id: 20, authorId: 2, title: 'p2', published: true },
        ]);
      },
    });
    await new UsersRepository(env.db).deleteCascading(1);
    const remaining = await env.db.select().from(posts);
    expect(remaining.length).toBe(1);
    expect(remaining[0]?.authorId).toBe(2);
  }, 120_000);

  it('T-PG-006: case-sensitive email filter (real Postgres collation default)', async () => {
    if (!dockerAvailable) return;
    env = await setupOrmEnv({
      mode: 'live',
      orm: 'drizzle',
      dialect: 'postgres',
      schema,
      migrations: INITIAL_MIGRATION,
      seed: async (db) => {
        await db.insert(schema.users).values({ id: 1, email: 'alice@example.com', displayName: 'Alice' });
      },
    });
    const upper = await env.db.select().from(schema.users).where(eq(schema.users.email, 'ALICE@EXAMPLE.COM'));
    const lower = await env.db.select().from(schema.users).where(eq(schema.users.email, 'alice@example.com'));
    expect(upper.length).toBe(0);
    expect(lower.length).toBe(1);
  }, 120_000);

  it('T-PG-007: orphan post insert rejects with Postgres FK violation', async () => {
    if (!dockerAvailable) return;
    env = await setupOrmEnv({ mode: 'live', orm: 'drizzle', dialect: 'postgres', schema, migrations: INITIAL_MIGRATION });
    await expect(
      env.db.insert(schema.posts).values({ id: 99, authorId: 999, title: 'orphan', published: false }),
    ).rejects.toThrow(/violates foreign key constraint/);
  }, 120_000);

  it('T-PG-008: parallel envs are isolated (different containers)', async () => {
    if (!dockerAvailable) return;
    const envA = await setupOrmEnv({
      mode: 'live', orm: 'drizzle', dialect: 'postgres', schema, migrations: INITIAL_MIGRATION,
      seed: async (db) => {
        await db.insert(schema.users).values({ id: 1, email: 'a@x', displayName: 'Alice in A' });
      },
    });
    const envB = await setupOrmEnv({
      mode: 'live', orm: 'drizzle', dialect: 'postgres', schema, migrations: INITIAL_MIGRATION,
      seed: async (db) => {
        await db.insert(schema.users).values({ id: 1, email: 'a@x', displayName: 'Alice in B' });
      },
    });
    const a = (await envA.db.select().from(schema.users))[0];
    const b = (await envB.db.select().from(schema.users))[0];
    expect(a?.displayName).toBe('Alice in A');
    expect(b?.displayName).toBe('Alice in B');
    expect(envA.connectionUri).not.toBe(envB.connectionUri);
    await envA.stop();
    await envB.stop();
  }, 180_000);
});
