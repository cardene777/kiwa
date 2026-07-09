// PoC tests — @kiwa-lab/orm v0.3 (Prisma + SQLite via tempdir).

import { afterEach, describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { setupOrmEnv, expectRowCount } from '@kiwa-lab/orm';
import type { OrmTestEnvMockPrisma } from '@kiwa-lab/orm';
import { PrismaClient } from '../prisma/generated/index.js';
import { UsersRepository } from '../src/users-repo.js';

// vitest は project root を cwd にして実行する。 `.vitest-dist` 経由でも
// schemaPath は `prisma/schema.prisma` を project root 相対で resolve する。
const SCHEMA_PATH = resolve(process.cwd(), 'prisma', 'schema.prisma');

let env: OrmTestEnvMockPrisma<PrismaClient> | null = null;
afterEach(async () => {
  if (env) { await env.stop(); env = null; }
}, 30_000);

async function newEnv(): Promise<OrmTestEnvMockPrisma<PrismaClient>> {
  return setupOrmEnv({
    mode: 'mock',
    orm: 'prisma',
    dialect: 'sqlite',
    prismaClient: PrismaClient,
    schemaPath: SCHEMA_PATH,
  });
}

describe('UsersRepository via @kiwa-lab/orm (prisma + tempdir SQLite)', () => {
  it('T-PR-001: create + findByEmail round-trip via Prisma client', async () => {
    env = await newEnv();
    const repo = new UsersRepository(env.client);
    const created = await repo.create({ email: 'alice@example.com', displayName: 'Alice' });
    expect(created.ok).toBe(true);
    const found = await repo.findByEmail('alice@example.com');
    expect(found?.email).toBe('alice@example.com');
    expect(found?.displayName).toBe('Alice');
  }, 60_000);

  it('T-PR-002: duplicate email returns duplicate-email reason (Prisma P2002)', async () => {
    env = await newEnv();
    await env.client.user.create({ data: { email: 'alice@example.com', displayName: 'Alice' } });
    const second = await new UsersRepository(env.client).create({ email: 'alice@example.com', displayName: 'Alice 2' });
    expect(second).toEqual({ ok: false, reason: 'duplicate-email' });
  }, 60_000);

  it('T-PR-003: findByEmail returns null for missing email', async () => {
    env = await newEnv();
    expect(await new UsersRepository(env.client).findByEmail('nobody@example.com')).toBeNull();
  }, 60_000);

  it('T-PR-004: user delete cascades to posts (Prisma onDelete: Cascade)', async () => {
    env = await newEnv();
    await env.client.user.create({
      data: {
        email: 'a@x',
        displayName: 'A',
        posts: {
          create: [
            { title: 'p1', published: false },
            { title: 'p2', published: true },
          ],
        },
      },
    });
    const userId = (await env.client.user.findFirstOrThrow()).id;
    const result = await new UsersRepository(env.client).deleteCascading(userId);
    expect(result.deletedPosts).toBe(2);
    await expectRowCount(env, 'Post', 0, expect);
    await expectRowCount(env, 'User', 0, expect);
  }, 60_000);

  it('T-PR-005: tempdir DB is isolated per env (different datasourceUrl)', async () => {
    const envA = await newEnv();
    const envB = await newEnv();
    await envA.client.user.create({ data: { email: 'a@x', displayName: 'Alice in A' } });
    await envB.client.user.create({ data: { email: 'a@x', displayName: 'Alice in B' } });
    const a = await envA.client.user.findUniqueOrThrow({ where: { email: 'a@x' } });
    const b = await envB.client.user.findUniqueOrThrow({ where: { email: 'a@x' } });
    expect(a.displayName).toBe('Alice in A');
    expect(b.displayName).toBe('Alice in B');
    expect(envA.datasourceUrl).not.toBe(envB.datasourceUrl);
    await envA.stop();
    await envB.stop();
  }, 90_000);

  it('T-PR-006: stop() disconnects PrismaClient + removes tempdir', async () => {
    const { existsSync } = await import('node:fs');
    const local = await newEnv();
    expect(existsSync(local.dbPath)).toBe(true);
    await local.stop();
    expect(existsSync(local.dbPath)).toBe(false);
  }, 60_000);

  it('T-PR-007: seed callback runs before tests see the env', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'prisma',
      dialect: 'sqlite',
      prismaClient: PrismaClient,
      schemaPath: SCHEMA_PATH,
      seed: async (client) => {
        await client.user.create({ data: { email: 'seeded@example.com', displayName: 'Seed' } });
      },
    });
    const found = await env.client.user.findUnique({ where: { email: 'seeded@example.com' } });
    expect(found?.displayName).toBe('Seed');
  }, 60_000);

  it('T-PR-008: env exposes datasourceUrl as file: URL', async () => {
    env = await newEnv();
    expect(env.datasourceUrl).toMatch(/^file:\//);
    expect(env.datasourceUrl).toContain(env.dbPath);
  }, 60_000);
});
