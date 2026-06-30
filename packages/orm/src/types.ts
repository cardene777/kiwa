// types.ts — public type definitions for @kiwa-test/orm.
//
// v0.1 (mock + drizzle + sqlite) + v0.2 (live + drizzle + postgres).
// MySQL / Prisma / Kysely adapters land in follow-up Issues CAR-292.1 / CAR-293 / CAR-294.

import type { TestEnvBase, TestMode } from '@kiwa-test/core';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

/** ORM brand discriminator. */
export type OrmBrand = 'drizzle';

/** SQL dialect. v0.2 adds 'postgres'. */
export type SqlDialect = 'sqlite' | 'postgres';

/** Drizzle schema = the object exported from `schema.ts` (table records). */
export type DrizzleSchema = Record<string, unknown>;

/** Drizzle client returned by `drizzle(better-sqlite3 instance, { schema })`. */
export type DrizzleSqliteDb<TSchema extends DrizzleSchema = DrizzleSchema> =
  BetterSQLite3Database<TSchema>;

/** Drizzle client returned by `drizzle(postgres(uri), { schema })`. */
export type DrizzlePostgresDb<TSchema extends DrizzleSchema = DrizzleSchema> =
  PostgresJsDatabase<TSchema>;

/**
 * Migration source — either a raw SQL string or an explicit array of SQL
 * statements. Statements are split on `;` followed by a newline so standard
 * `CREATE TABLE ...; CREATE INDEX ...;` files parse correctly.
 *
 * file-based migrations (drizzle-orm/migrator) land in CAR-295.
 */
export type MigrationSource = string | ReadonlyArray<string>;

export interface MockSqliteOptions<TSchema extends DrizzleSchema = DrizzleSchema> {
  readonly mode: 'mock';
  readonly orm: 'drizzle';
  readonly dialect: 'sqlite';
  readonly schema: TSchema;
  readonly migrations?: MigrationSource;
  readonly seed?: (db: DrizzleSqliteDb<TSchema>) => Promise<void> | void;
}

export interface LivePostgresOptions<TSchema extends DrizzleSchema = DrizzleSchema> {
  readonly mode: 'live';
  readonly orm: 'drizzle';
  readonly dialect: 'postgres';
  readonly schema: TSchema;
  readonly migrations?: MigrationSource;
  readonly seed?: (db: DrizzlePostgresDb<TSchema>) => Promise<void> | void;
  /** Optional Docker image override. Default `postgres:16-alpine`. */
  readonly containerImage?: string;
}

/**
 * Union of all currently-supported v0.2 configurations.
 *
 * Generic parameters (TMode / TOrm / TDialect) are retained so future
 * adapters can extend the union without breaking type signatures. The
 * generic form is intentionally less precise; prefer the discrete
 * `MockSqliteOptions` / `LivePostgresOptions` types when authoring tests.
 */
export type SetupOrmEnvOptions<
  TMode extends TestMode = TestMode,
  _TOrm extends OrmBrand = 'drizzle',
  TDialect extends SqlDialect = SqlDialect,
  TSchema extends DrizzleSchema = DrizzleSchema,
> = TMode extends 'mock'
  ? TDialect extends 'sqlite'
    ? MockSqliteOptions<TSchema>
    : never
  : TMode extends 'live'
    ? TDialect extends 'postgres'
      ? LivePostgresOptions<TSchema>
      : never
    : never;

export interface OrmTestEnvMock<TSchema extends DrizzleSchema = DrizzleSchema>
  extends TestEnvBase<'mock'> {
  readonly orm: 'drizzle';
  readonly dialect: 'sqlite';
  readonly db: DrizzleSqliteDb<TSchema>;
  /** Raw better-sqlite3 connection — exposed for `expectQuery` raw-SQL paths. */
  readonly raw: import('better-sqlite3').Database;
}

export interface OrmTestEnvLive<TSchema extends DrizzleSchema = DrizzleSchema>
  extends TestEnvBase<'live'> {
  readonly orm: 'drizzle';
  readonly dialect: 'postgres';
  readonly db: DrizzlePostgresDb<TSchema>;
  /** Raw `postgres` (postgres.js) connection — exposed for `expectQuery` raw-SQL paths. */
  readonly raw: import('postgres').Sql;
  /** Connection URI assigned by the testcontainers Postgres instance. */
  readonly connectionUri: string;
}

/**
 * Discriminated union. Tests can narrow with `env.mode === 'mock'` or
 * `env.dialect === 'postgres'` to access the appropriate client shape.
 */
export type OrmTestEnv<TSchema extends DrizzleSchema = DrizzleSchema> =
  | OrmTestEnvMock<TSchema>
  | OrmTestEnvLive<TSchema>;
