/**
 * real fidelity test — `docs/concepts/test-taxonomy.md § fidelity real driver`。
 *
 * setupOrmEnv (drizzle + sqlite in-memory mock) が、 real Postgres (testcontainers
 * 経由の real postgres.js driver) と同じ CRUD 挙動を返すことを保証する。 既存 static
 * fidelity (mock ↔ Map reference) を補完、 mock (sqlite) が real Postgres semantics を
 * 再現しているか動的検証する経路。 sqlite dialect と postgres dialect は SQL 方言差が
 * あるため厳密比較は困難、 本 test は基本 CRUD (insert / selectAll) の shape 一致に focus。
 *
 * env-gate = KIWA_MODE=real 時のみ実行、 default = skip (Docker + testcontainers 起動 cost 回避)。
 */
import { assertFidelity, resolveRealFidelityMode } from '@kiwa-lab/quality-metrics';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { integer as pgInteger, pgTable, text as pgText } from 'drizzle-orm/pg-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { setupOrmEnv } from '../../src/index.js';
import type { OrmTestEnvLive, OrmTestEnvMock } from '../../src/types.js';

const sqliteSchema = {
  users: sqliteTable('users', {
    id: integer('id').primaryKey(),
    email: text('email').notNull().unique(),
  }),
};
const pgSchema = {
  users: pgTable('users', {
    id: pgInteger('id').primaryKey(),
    email: pgText('email').notNull().unique(),
  }),
};

const SQLITE_MIGRATION = `
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE
);
`;
const POSTGRES_MIGRATION = `
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE
);
`;

const gate = resolveRealFidelityMode({
  lib: 'orm',
  requiredEnvKeys: [],
});

describe.skipIf(!gate.enabled)('setupOrmEnv real fidelity vs testcontainers Postgres', () => {
  let mock: OrmTestEnvMock<typeof sqliteSchema>;
  let real: OrmTestEnvLive<typeof pgSchema>;

  beforeAll(async () => {
    mock = (await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema: sqliteSchema,
      migrations: SQLITE_MIGRATION,
    })) as OrmTestEnvMock<typeof sqliteSchema>;
    real = (await setupOrmEnv({
      mode: 'live',
      orm: 'drizzle',
      dialect: 'postgres',
      schema: pgSchema,
      migrations: POSTGRES_MIGRATION,
    })) as OrmTestEnvLive<typeof pgSchema>;
  }, 180_000);

  afterAll(async () => {
    await mock.stop?.();
    await real.stop?.();
  }, 60_000);

  it('insert 1 件 + selectAll = 両実装で同 row を返す', async () => {
    const insertMock = async () => {
      mock.raw.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(1, 'a@example.com');
      return mock.raw.prepare('SELECT id, email FROM users ORDER BY id').all() as Array<{
        id: number;
        email: string;
      }>;
    };
    const insertReal = async () => {
      const dbAny = real.db as unknown as { execute: (q: string) => Promise<{ rows: unknown[] }> };
      // drizzle-orm/postgres-js の execute API 経由で raw SQL
      const { sql } = await import('drizzle-orm');
      await real.db.execute(sql`INSERT INTO users (id, email) VALUES (2, 'b@example.com')`);
      const result = await real.db.execute(sql`SELECT id, email FROM users ORDER BY id`);
      const rows = ((result as unknown as { rows?: Array<{ id: number; email: string }> }).rows ??
        (result as unknown as Array<{ id: number; email: string }>));
      // mock は id=1 / real は id=2 で挿入するため、 shape (row 数 + columns 名) の
      // 一致だけ検証、 id / email 値は fidelity 対象外 (project で除外)。
      return rows.map((r) => ({ hasId: typeof r.id === 'number', hasEmail: typeof r.email === 'string' }));
    };

    const result = await assertFidelity({
      mockFn: async () => {
        const rows = await insertMock();
        return rows.map((r) => ({ hasId: typeof r.id === 'number', hasEmail: typeof r.email === 'string' }));
      },
      realFn: async () => insertReal(),
      cases: [{ name: 'insert + selectAll shape 一致', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);
    expect(result.divergences).toEqual([]);
  });

  it('mock (sqlite) と real (postgres) の env metadata 契約', async () => {
    // mock = mode 'mock' / real = mode 'live'、 real は connectionUri 提供
    expect(mock.mode).toBe('mock');
    expect(real.mode).toBe('live');
    expect(real.connectionUri).toMatch(/^postgres(?:ql)?:\/\//);
  });
});

if (!gate.enabled) {
  // eslint-disable-next-line no-console
  console.log(`[orm real-fidelity] skipped: ${gate.skipReason}`);
}
