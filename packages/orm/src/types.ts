// types.ts — public type definitions for @kiwa-test/orm.
//
// MVP scope: Drizzle + better-sqlite3 in-memory only (mode = 'mock').
// Postgres / MySQL via testcontainers + Prisma / Kysely adapters land in
// follow-up Issues #527-2 .. #527-5.

import type { TestEnvBase, TestMode } from '@kiwa-test/core';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

/** ORM brand discriminator. Extensible to 'prisma' / 'kysely' in follow-ups. */
export type OrmBrand = 'drizzle';

/** SQL dialect. Extensible to 'postgres' / 'mysql' in follow-ups. */
export type SqlDialect = 'sqlite';

/** Drizzle schema is the object exported from `schema.ts` (table records). */
export type DrizzleSchema = Record<string, unknown>;

/** Drizzle client returned by `drizzle(better-sqlite3 instance, { schema })`. */
export type DrizzleSqliteDb<TSchema extends DrizzleSchema = DrizzleSchema> =
  BetterSQLite3Database<TSchema>;

/**
 * Migration source — either a raw SQL string or an explicit array of SQL
 * statements. In v0.1 each statement is applied sequentially against the
 * in-memory better-sqlite3 connection; future versions will add Drizzle's
 * own `migrate()` helper from `drizzle-orm/better-sqlite3/migrator` once
 * the example PoC verifies the migration file workflow.
 */
export type MigrationSource = string | ReadonlyArray<string>;

export interface SetupOrmEnvOptions<
  TMode extends TestMode = 'mock',
  TOrm extends OrmBrand = 'drizzle',
  TDialect extends SqlDialect = 'sqlite',
  TSchema extends DrizzleSchema = DrizzleSchema,
> {
  /** Test mode. MVP only accepts 'mock' (in-memory SQLite). */
  readonly mode: TMode;
  /** ORM brand. MVP only accepts 'drizzle'. */
  readonly orm: TOrm;
  /** SQL dialect. MVP only accepts 'sqlite'. */
  readonly dialect: TDialect;
  /** Drizzle schema object — pass the namespace import from your schema file. */
  readonly schema: TSchema;
  /**
   * Optional SQL migration source(s). Applied sequentially before `seed`.
   * Statements are split on semicolons that are followed by a newline so
   * standard `CREATE TABLE ...; CREATE INDEX ...;` files parse correctly.
   */
  readonly migrations?: MigrationSource;
  /**
   * Optional seed function invoked after migrations. Receives the live
   * Drizzle client so production-shape inserts can be reused.
   */
  readonly seed?: (db: DrizzleSqliteDb<TSchema>) => Promise<void> | void;
}

export interface OrmTestEnvMock<TSchema extends DrizzleSchema = DrizzleSchema>
  extends TestEnvBase<'mock'> {
  readonly orm: 'drizzle';
  readonly dialect: 'sqlite';
  readonly db: DrizzleSqliteDb<TSchema>;
  /** Raw better-sqlite3 connection — exposed for `expectQuery` raw-SQL paths. */
  readonly raw: import('better-sqlite3').Database;
}

/** Discriminated union — extends with live / hybrid variants in follow-ups. */
export type OrmTestEnv<TSchema extends DrizzleSchema = DrizzleSchema> =
  OrmTestEnvMock<TSchema>;
