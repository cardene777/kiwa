// PoC tests — @kiwa-lab/orm v0.6 (Prisma + testcontainers Postgres).

import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { setupOrmEnv, expectRowCount } from '@kiwa-lab/orm';
import type { OrmTestEnvLivePrismaPostgres } from '@kiwa-lab/orm';
import { PrismaClient } from '../prisma/generated/index.js';
import { UsersRepository } from '../src/users-repo.js';

const SCHEMA_PATH = resolve(process.cwd(), 'prisma', 'schema.prisma');

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

let env: OrmTestEnvLivePrismaPostgres<PrismaClient> | null = null;
afterEach(async () => {
  if (env) { await env.stop(); env = null; }
}, 60_000);

async function newEnv(): Promise<OrmTestEnvLivePrismaPostgres<PrismaClient>> {
  return setupOrmEnv({
    mode: 'live',
    orm: 'prisma',
    dialect: 'postgres',
    prismaClient: PrismaClient,
    schemaPath: SCHEMA_PATH,
  });
}

describe('UsersRepository via @kiwa-lab/orm (prisma + testcontainers postgres)', () => {
  it('T-PP-001: create + findByEmail round-trip on real Postgres via Prisma', async () => {
    if (!dockerAvailable) return;
    env = await newEnv();
    const repo = new UsersRepository(env.client);
    const created = await repo.create({ email: 'alice@example.com', displayName: 'Alice' });
    expect(created.ok).toBe(true);
    const found = await repo.findByEmail('alice@example.com');
    expect(found?.email).toBe('alice@example.com');
    expect(found?.displayName).toBe('Alice');
  }, 180_000);

  it('T-PP-002: duplicate email returns duplicate-email reason (Postgres P2002)', async () => {
    if (!dockerAvailable) return;
    env = await newEnv();
    await env.client.user.create({ data: { email: 'alice@example.com', displayName: 'Alice' } });
    const second = await new UsersRepository(env.client).create({ email: 'alice@example.com', displayName: 'Alice 2' });
    expect(second).toEqual({ ok: false, reason: 'duplicate-email' });
  }, 180_000);

  it('T-PP-003: findByEmail returns null for missing email', async () => {
    if (!dockerAvailable) return;
    env = await newEnv();
    expect(await new UsersRepository(env.client).findByEmail('nobody@example.com')).toBeNull();
  }, 180_000);

  it('T-PP-004: user delete cascades to posts (Postgres FK onDelete: Cascade)', async () => {
    if (!dockerAvailable) return;
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
  }, 180_000);

  it('T-PP-005: parallel envs are isolated (different containers + URIs)', async () => {
    if (!dockerAvailable) return;
    const envA = await newEnv();
    const envB = await newEnv();
    await envA.client.user.create({ data: { email: 'a@x', displayName: 'Alice in A' } });
    await envB.client.user.create({ data: { email: 'a@x', displayName: 'Alice in B' } });
    const a = await envA.client.user.findUniqueOrThrow({ where: { email: 'a@x' } });
    const b = await envB.client.user.findUniqueOrThrow({ where: { email: 'a@x' } });
    expect(a.displayName).toBe('Alice in A');
    expect(b.displayName).toBe('Alice in B');
    expect(envA.connectionUri).not.toBe(envB.connectionUri);
    await envA.stop();
    await envB.stop();
  }, 240_000);

  it('T-PP-006: stop() disconnects PrismaClient + tears down container', async () => {
    if (!dockerAvailable) return;
    const local = await newEnv();
    await local.stop();
    // 切断後の query は reject。
    await expect(local.client.user.findMany()).rejects.toBeDefined();
  }, 180_000);

  it('T-PP-007: env.connectionUri は postgres:// 接頭辞を持つ', async () => {
    if (!dockerAvailable) return;
    env = await newEnv();
    expect(env.connectionUri).toMatch(/^postgres(?:ql)?:\/\//);
  }, 180_000);

  it('T-PP-008: seed callback runs before tests see env', async () => {
    if (!dockerAvailable) return;
    env = await setupOrmEnv({
      mode: 'live',
      orm: 'prisma',
      dialect: 'postgres',
      prismaClient: PrismaClient,
      schemaPath: SCHEMA_PATH,
      seed: async (client) => {
        await client.user.create({ data: { email: 'seeded@example.com', displayName: 'Seed' } });
      },
    });
    const found = await env.client.user.findUnique({ where: { email: 'seeded@example.com' } });
    expect(found?.displayName).toBe('Seed');
  }, 180_000);
});
