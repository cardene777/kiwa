// expectations.ts — query-result assertion helpers for @kiwa/orm.
//
// Helpers are framework-agnostic: they accept a Vitest-shaped `expect`
// argument so test files keep their assertion library intact. The helpers
// dispatch internally based on `env.mode` so the same assertion call works
// against both in-memory SQLite (v0.1) and a testcontainers Postgres (v0.2).

import type { OrmTestEnv } from './types.js';

// Minimal Vitest-compatible expect surface — keeps the public API decoupled
// from @types/vitest while still type-checking expect chains.
export interface MinimalExpect {
  (actual: unknown): {
    toEqual(expected: unknown): void;
    toBe(expected: unknown): void;
  };
}

/**
 * Run a raw SQL query against the underlying driver and assert that the
 * returned rows deeply equal `expected`. SQLite mock uses better-sqlite3's
 * synchronous `prepare(...).all()`; Postgres live uses postgres.js's
 * tagged template via `sql.unsafe(...)`.
 */
export async function expectQuery<TRow = unknown>(
  env: OrmTestEnv,
  sql: string,
  expected: ReadonlyArray<TRow>,
  expect: MinimalExpect,
): Promise<void> {
  if (env.mode === 'mock' && env.orm === 'prisma') {
    // Prisma raw SQL — `$queryRawUnsafe` returns a Promise<TRow[]>.
    const client = env.client as unknown as { $queryRawUnsafe: (sql: string) => Promise<TRow[]> };
    const rows = await client.$queryRawUnsafe(sql);
    expect(rows).toEqual(expected);
    return;
  }
  if (env.mode === 'mock') {
    const rows = env.raw.prepare(sql).all() as TRow[];
    expect(rows).toEqual(expected);
    return;
  }
  if (env.dialect === 'postgres') {
    if (env.orm === 'prisma') {
      // Prisma live Postgres — $queryRawUnsafe routes via PrismaClient.
      const client = (env as unknown as { client: { $queryRawUnsafe: (sql: string) => Promise<TRow[]> } }).client;
      const rows = await client.$queryRawUnsafe(sql);
      expect(rows).toEqual(expected);
      return;
    }
    if (env.orm === 'kysely') {
      // Kysely Postgres uses pg.Pool — query(sql) returns { rows: T[] }.
      const result = (await (env.raw as unknown as { query: (sql: string) => Promise<{ rows: TRow[] }> }).query(sql));
      expect(result.rows).toEqual(expected);
      return;
    }
    // live mode (Drizzle Postgres) — postgres.js returns a thenable Result.
    const rows = (await ((env as unknown as { raw: import('postgres').Sql }).raw).unsafe(sql)) as unknown as TRow[];
    expect([...rows]).toEqual(expected);
    return;
  }
  // live mode (MySQL).
  if (env.orm === 'prisma') {
    // Prisma live MySQL — $queryRawUnsafe routes via PrismaClient.
    const client = (env as unknown as { client: { $queryRawUnsafe: (sql: string) => Promise<TRow[]> } }).client;
    const rows = await client.$queryRawUnsafe(sql);
    expect(rows).toEqual(expected);
    return;
  }
  // mysql2 `query` returns [rows, fields]. Same for Kysely + Drizzle.
  const [rows] = (await ((env as unknown as { raw: import('mysql2/promise').Pool }).raw).query(sql)) as unknown as [TRow[], unknown];
  expect(rows).toEqual(expected);
}

/** Assert that the row count of `table` equals `expected`. */
export async function expectRowCount(
  env: OrmTestEnv,
  table: string,
  expected: number,
  expect: MinimalExpect,
): Promise<void> {
  if (env.mode === 'mock' && env.orm === 'prisma') {
    // Prisma raw `$queryRawUnsafe` — SQLite identifier quoting.
    const safe = `"${String(table).replace(/"/g, '""')}"`;
    const client = env.client as unknown as { $queryRawUnsafe: (sql: string) => Promise<Array<{ c: number | bigint }>> };
    const rows = await client.$queryRawUnsafe(`SELECT COUNT(*) AS c FROM ${safe}`);
    expect(Number(rows[0]?.c)).toBe(expected);
    return;
  }
  if (env.mode === 'mock') {
    const safe = `"${String(table).replace(/"/g, '""')}"`;
    const row = env.raw.prepare(`SELECT COUNT(*) AS c FROM ${safe}`).get() as { c: number };
    expect(row.c).toBe(expected);
    return;
  }
  if (env.dialect === 'postgres') {
    const safe = `"${String(table).replace(/"/g, '""')}"`;
    if (env.orm === 'prisma') {
      const client = (env as unknown as { client: { $queryRawUnsafe: (sql: string) => Promise<Array<{ c: number | bigint }>> } }).client;
      const rows = await client.$queryRawUnsafe(`SELECT COUNT(*)::int AS c FROM ${safe}`);
      expect(Number(rows[0]?.c)).toBe(expected);
      return;
    }
    if (env.orm === 'kysely') {
      const result = await (env.raw as unknown as { query: (sql: string) => Promise<{ rows: Array<{ c: number }> }> }).query(`SELECT COUNT(*)::int AS c FROM ${safe}`);
      expect(result.rows[0]?.c).toBe(expected);
      return;
    }
    const rows = (await ((env as unknown as { raw: import('postgres').Sql }).raw).unsafe(`SELECT COUNT(*)::int AS c FROM ${safe}`)) as unknown as Array<{ c: number }>;
    expect(rows[0]?.c).toBe(expected);
    return;
  }
  // MySQL identifier quoting uses backticks.
  const safe = `\`${String(table).replace(/`/g, '``')}\``;
  if (env.orm === 'prisma') {
    const client = (env as unknown as { client: { $queryRawUnsafe: (sql: string) => Promise<Array<{ c: number | bigint }>> } }).client;
    const rows = await client.$queryRawUnsafe(`SELECT COUNT(*) AS c FROM ${safe}`);
    expect(Number(rows[0]?.c)).toBe(expected);
    return;
  }
  const [rows] = (await ((env as unknown as { raw: import('mysql2/promise').Pool }).raw).query(`SELECT COUNT(*) AS c FROM ${safe}`)) as unknown as [Array<{ c: number | bigint }>, unknown];
  expect(Number(rows[0]?.c)).toBe(expected);
}
