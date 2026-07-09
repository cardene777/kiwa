// Unit tests for @kiwa-lab/orm v0.7 — Kysely Migrator (file-based migration).
//
// Exercises `migrations: { folder }` for `orm: 'kysely' + dialect: 'sqlite'`.
// Folder fixtures are written into a per-test tmpdir to avoid relying on
// repository-level paths.

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { setupOrmEnv, expectRowCount } from '../src/index.js';
import type { OrmTestEnvMockKysely } from '../src/index.js';

interface UsersTable {
  id: number;
  email: string;
  display_name: string;
}

interface Database {
  users: UsersTable;
}

const schema = {} as Database;

let env: OrmTestEnvMockKysely<Database> | null = null;
let tmp: string | null = null;

afterEach(async () => {
  if (env !== null) {
    await env.stop();
    env = null;
  }
  if (tmp !== null) {
    await rm(tmp, { recursive: true, force: true });
    tmp = null;
  }
});

async function writeKyselyMigrationFolder(): Promise<string> {
  tmp = await mkdtemp(join(tmpdir(), 'kiwa-kysely-migrator-'));
  // Migration files are sorted alphabetically; prefix with zero-padded
  // sequence numbers to control execution order.
  await writeFile(
    join(tmp, '20260101_create_users.mjs'),
    `export async function up(db) {
  await db.schema
    .createTable('users')
    .addColumn('id', 'integer', (c) => c.primaryKey())
    .addColumn('email', 'text', (c) => c.notNull().unique())
    .addColumn('display_name', 'text', (c) => c.notNull())
    .execute();
}
export async function down(db) {
  await db.schema.dropTable('users').execute();
}
`,
  );
  await writeFile(
    join(tmp, '20260102_seed_admin.mjs'),
    `export async function up(db) {
  await db.insertInto('users').values({ id: 999, email: 'admin@example.com', display_name: 'Admin' }).execute();
}
export async function down(db) {
  await db.deleteFrom('users').where('id', '=', 999).execute();
}
`,
  );
  return tmp;
}

describe('setupOrmEnv (kysely + sqlite + folder migration via kysely Migrator)', () => {
  it('T-ORM-KM-001: { folder } で kysely Migrator が migration を順に適用する', async () => {
    const folder = await writeKyselyMigrationFolder();
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'kysely',
      dialect: 'sqlite',
      schema,
      migrations: { folder },
    });
    await expectRowCount(env, 'users', 1, expect);
    const row = await env.db.selectFrom('users').selectAll().where('email', '=', 'admin@example.com').executeTakeFirstOrThrow();
    expect(row.display_name).toBe('Admin');
  });

  it('T-ORM-KM-002: folder migration 後に seed callback が実行される', async () => {
    const folder = await writeKyselyMigrationFolder();
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'kysely',
      dialect: 'sqlite',
      schema,
      migrations: { folder },
      seed: async (db) => {
        await db.insertInto('users').values({ id: 1, email: 'seed@example.com', display_name: 'Seed' }).execute();
      },
    });
    const rows = await env.db.selectFrom('users').selectAll().orderBy('id').execute();
    expect(rows.map((r) => r.email)).toEqual(['seed@example.com', 'admin@example.com']);
  });

  it('T-ORM-KM-003: kysely Migrator が `kysely_migration` table を append する (status 行残存)', async () => {
    const folder = await writeKyselyMigrationFolder();
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'kysely',
      dialect: 'sqlite',
      schema,
      migrations: { folder },
    });
    // FileMigrationProvider 内部 table — kiwa はこれを隠さず透過する。
    const rows = env.raw.prepare('SELECT name FROM kysely_migration ORDER BY name').all() as Array<{ name: string }>;
    expect(rows.map((r) => r.name)).toEqual(['20260101_create_users', '20260102_seed_admin']);
  });

  it('T-ORM-KM-004: 失敗 migration を含む folder は Error throw + 失敗 migration 名を含む', async () => {
    tmp = await mkdtemp(join(tmpdir(), 'kiwa-kysely-migrator-fail-'));
    await writeFile(
      join(tmp, '01_broken.mjs'),
      `export async function up(db) {
        // 存在しない table への INSERT で fail。
        await db.insertInto('does_not_exist').values({ x: 1 }).execute();
      }`,
    );
    await expect(
      setupOrmEnv({
        mode: 'mock',
        orm: 'kysely',
        dialect: 'sqlite',
        schema,
        migrations: { folder: tmp },
      }),
    ).rejects.toThrow(/kysely Migrator\.migrateToLatest failed/);
  });
});
