// expectations.ts — query-result assertion helpers for @kiwa-test/orm.
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
  if (env.mode === 'mock') {
    const rows = env.raw.prepare(sql).all() as TRow[];
    expect(rows).toEqual(expected);
    return;
  }
  // live mode (Postgres) — postgres.js returns a thenable Result.
  const rows = (await env.raw.unsafe(sql)) as unknown as TRow[];
  expect([...rows]).toEqual(expected);
}

/** Assert that the row count of `table` equals `expected`. */
export async function expectRowCount(
  env: OrmTestEnv,
  table: string,
  expected: number,
  expect: MinimalExpect,
): Promise<void> {
  if (env.mode === 'mock') {
    // SQLite identifier quoting — wrap in double quotes so reserved words +
    // mixed-case names work. The caller passes the bare table name.
    const safe = `"${String(table).replace(/"/g, '""')}"`;
    const row = env.raw.prepare(`SELECT COUNT(*) AS c FROM ${safe}`).get() as { c: number };
    expect(row.c).toBe(expected);
    return;
  }
  // Postgres — same double-quote identifier quoting works.
  const safe = `"${String(table).replace(/"/g, '""')}"`;
  const rows = (await env.raw.unsafe(`SELECT COUNT(*)::int AS c FROM ${safe}`)) as unknown as Array<{ c: number }>;
  expect(rows[0]?.c).toBe(expected);
}
