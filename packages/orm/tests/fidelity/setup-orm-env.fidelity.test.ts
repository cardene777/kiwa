/**
 * fidelity test — `docs/concepts/test-taxonomy.md § fidelity` pattern。
 *
 * setupOrmEnv (drizzle + sqlite in-memory mock) が、 想定 reference impl
 * (Map ベース単純 row store) と同じ CRUD 挙動を返すことを保証する。
 * mock ≠ Postgres testcontainers 比較の live fidelity は別 file 化して
 * `*.real.fidelity.test.ts` で書く経路 (現状 scope 外)。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { describe, expect, it } from 'vitest';
import { setupOrmEnv } from '../../src/index.js';

const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  email: text('email').notNull().unique(),
});
const schema = { users };
const MIGRATION = `
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE
);
`;

interface UserRow {
  readonly id: number;
  readonly email: string;
}

/** Reference impl = 仕様通り動く最小 Map ベース row store。 mock 挙動の期待仕様を体現する。 */
function referenceStore() {
  const rows = new Map<number, UserRow>();
  return {
    insert(row: UserRow): void {
      if (rows.has(row.id)) throw new Error('UNIQUE constraint failed: users.id');
      for (const existing of rows.values()) {
        if (existing.email === row.email) throw new Error('UNIQUE constraint failed: users.email');
      }
      rows.set(row.id, row);
    },
    selectAll(): UserRow[] {
      return Array.from(rows.values()).sort((a, b) => a.id - b.id);
    },
    findById(id: number): UserRow | undefined {
      return rows.get(id);
    },
  };
}

describe('setupOrmEnv (drizzle + sqlite mock) fidelity vs reference impl', () => {
  it('insert 1 件 + selectAll = reference と一致', async () => {
    const env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: MIGRATION,
    });
    const real = referenceStore();

    const result = await assertFidelity({
      mockFn: async (row: UserRow) => {
        env.raw.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(row.id, row.email);
        return env.raw.prepare('SELECT id, email FROM users ORDER BY id').all() as UserRow[];
      },
      realFn: async (row: UserRow) => {
        real.insert(row);
        return real.selectAll();
      },
      cases: [
        { name: 'insert 単発', args: [{ id: 1, email: 'a@example.com' }] as [UserRow] },
      ],
    });
    expect(result.ratio).toBe(100);
    expect(result.divergences).toEqual([]);

    await env.stop();
  });

  it('複数 insert + selectAll = 挿入順に関わらず id 昇順で並ぶ (mock ↔ reference)', async () => {
    const env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: MIGRATION,
    });
    const real = referenceStore();

    const seedRows: UserRow[] = [
      { id: 3, email: 'c@example.com' },
      { id: 1, email: 'a@example.com' },
      { id: 2, email: 'b@example.com' },
    ];
    for (const row of seedRows) {
      env.raw.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(row.id, row.email);
      real.insert(row);
    }

    const result = await assertFidelity({
      mockFn: async () => env.raw.prepare('SELECT id, email FROM users ORDER BY id').all() as UserRow[],
      realFn: async () => real.selectAll(),
      cases: [{ name: 'selectAll 並び順', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);
    expect(result.failed).toBe(0);

    await env.stop();
  });

  it('UNIQUE 制約違反 = mock も reference も throw (両 throw で fidelity 一致)', async () => {
    const env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: MIGRATION,
    });
    const real = referenceStore();

    env.raw.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(1, 'a@example.com');
    real.insert({ id: 1, email: 'a@example.com' });

    // mock (sqlite) 側は id 衝突で "UNIQUE constraint failed: users.id" を throw。
    // reference 側は同 message で throw。 両 throw = fidelity 一致扱い (assertFidelity 契約)。
    const result = await assertFidelity({
      mockFn: async () => {
        env.raw.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(1, 'dup@example.com');
      },
      realFn: async () => {
        real.insert({ id: 1, email: 'dup@example.com' });
      },
      cases: [{ name: 'id 衝突', args: [] as [] }],
    });
    expect(result.passed).toBe(1);
    expect(result.failed).toBe(0);

    await env.stop();
  });
});
