// setup-orm-env.ts — entry point for @kiwa-test/orm v0.1 (Drizzle + SQLite MVP).
//
// The helper accepts the same shape that future Postgres / MySQL / Prisma /
// Kysely adapters will accept, so callers can swap `mode` / `orm` / `dialect`
// without rewriting tests when follow-up issues land.

import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type {
  DrizzleSchema,
  MigrationSource,
  OrmTestEnv,
  SetupOrmEnvOptions,
} from './types.js';

function splitSqlStatements(source: MigrationSource): string[] {
  const sources = typeof source === 'string' ? [source] : source.slice();
  const out: string[] = [];
  for (const block of sources) {
    for (const raw of block.split(/;\s*(?:\r?\n|$)/)) {
      const trimmed = raw.trim();
      if (trimmed.length > 0) out.push(trimmed);
    }
  }
  return out;
}

/**
 * Set up an isolated, in-memory ORM test environment.
 *
 * MVP (v0.1): always returns a Drizzle + better-sqlite3 mock environment.
 * Future versions will branch on `opts.mode` / `opts.orm` / `opts.dialect`
 * to dispatch to Postgres / MySQL via testcontainers + Prisma / Kysely
 * adapters. Callers that hard-code those options today will keep working
 * once the dispatch lands because every adapter returns the same
 * `TestEnvBase` shape (mode + stop) plus an ORM-specific `db` handle.
 */
export async function setupOrmEnv<TSchema extends DrizzleSchema = DrizzleSchema>(
  opts: SetupOrmEnvOptions<'mock', 'drizzle', 'sqlite', TSchema>,
): Promise<OrmTestEnv<TSchema>> {
  if (opts.mode !== 'mock') {
    throw new Error(`@kiwa-test/orm v0.1 only supports mode='mock' (received '${opts.mode}'). Postgres / MySQL via testcontainers land in follow-up Issue #527-2.`);
  }
  if (opts.orm !== 'drizzle') {
    throw new Error(`@kiwa-test/orm v0.1 only supports orm='drizzle' (received '${opts.orm}'). Prisma / Kysely adapters land in follow-up Issues #527-3 / #527-4.`);
  }
  if (opts.dialect !== 'sqlite') {
    throw new Error(`@kiwa-test/orm v0.1 only supports dialect='sqlite' (received '${opts.dialect}'). Postgres / MySQL land with the testcontainers follow-up.`);
  }

  const raw = new Database(':memory:');
  // Foreign keys are off by default in SQLite; enable so test schemas behave
  // closer to Postgres / MySQL where FK enforcement is implicit.
  raw.pragma('foreign_keys = ON');

  const db = drizzle(raw, { schema: opts.schema }) as BetterSQLite3Database<TSchema>;

  if (typeof opts.migrations !== 'undefined') {
    const statements = splitSqlStatements(opts.migrations);
    for (const stmt of statements) {
      raw.exec(stmt);
    }
  }

  if (typeof opts.seed === 'function') {
    await opts.seed(db);
  }

  return {
    mode: 'mock',
    orm: 'drizzle',
    dialect: 'sqlite',
    db,
    raw,
    stop: async () => {
      raw.close();
    },
  };
}
