// expectations.ts — query-result assertion helpers for @kiwa-test/orm.
//
// Helpers are framework-agnostic: they accept a Vitest-shaped `expect`
// argument so test files keep their assertion library intact. The helpers
// do not throw on their own — they delegate to `expect(...)`.

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
 * Run a raw SQL query against the underlying better-sqlite3 connection and
 * assert that the returned rows deeply equal `expected`. Used when the test
 * wants to verify a query result without committing to a particular Drizzle
 * query shape (helpful for ad-hoc inspection of intermediate state).
 *
 * For type-safe Drizzle assertions, call `env.db.select().from(table).all()`
 * directly and assert with your own expect chain — this helper only exists
 * for raw-SQL convenience.
 */
export function expectQuery<TRow = unknown>(
  env: Pick<OrmTestEnv, 'raw'>,
  sql: string,
  expected: ReadonlyArray<TRow>,
  expect: MinimalExpect,
): void {
  const rows = env.raw.prepare(sql).all() as TRow[];
  expect(rows).toEqual(expected);
}

/** Assert that the row count of `table` equals `expected`. */
export function expectRowCount(
  env: Pick<OrmTestEnv, 'raw'>,
  table: string,
  expected: number,
  expect: MinimalExpect,
): void {
  // SQLite identifier quoting — wrap in double quotes so reserved words +
  // mixed-case names work. The caller passes the bare table name.
  const safe = `"${String(table).replace(/"/g, '""')}"`;
  const row = env.raw.prepare(`SELECT COUNT(*) AS c FROM ${safe}`).get() as { c: number };
  expect(row.c).toBe(expected);
}
