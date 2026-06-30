// types.ts — public type definitions for @kiwa-test/orm.
//
// v0.1 (mock + drizzle + sqlite) + v0.2 (live + drizzle + postgres).
// MySQL / Prisma / Kysely adapters land in follow-up Issues CAR-292.1 / CAR-293 / CAR-294.

import type { TestEnvBase, TestMode } from '@kiwa-test/core';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { MySql2Database } from 'drizzle-orm/mysql2';

/** ORM brand discriminator. v0.3 adds 'prisma'. */
export type OrmBrand = 'drizzle' | 'prisma';

/** SQL dialect. v0.2.1 adds 'mysql'. */
export type SqlDialect = 'sqlite' | 'postgres' | 'mysql';

/** Drizzle schema = the object exported from `schema.ts` (table records). */
export type DrizzleSchema = Record<string, unknown>;

/** Drizzle client returned by `drizzle(better-sqlite3 instance, { schema })`. */
export type DrizzleSqliteDb<TSchema extends DrizzleSchema = DrizzleSchema> =
  BetterSQLite3Database<TSchema>;

/** Drizzle client returned by `drizzle(postgres(uri), { schema })`. */
export type DrizzlePostgresDb<TSchema extends DrizzleSchema = DrizzleSchema> =
  PostgresJsDatabase<TSchema>;

/** Drizzle client returned by `drizzle(mysql2Pool, { schema, mode: 'default' })`. */
export type DrizzleMysqlDb<TSchema extends DrizzleSchema = DrizzleSchema> =
  MySql2Database<TSchema>;

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

export interface LiveMysqlOptions<TSchema extends DrizzleSchema = DrizzleSchema> {
  readonly mode: 'live';
  readonly orm: 'drizzle';
  readonly dialect: 'mysql';
  readonly schema: TSchema;
  readonly migrations?: MigrationSource;
  readonly seed?: (db: DrizzleMysqlDb<TSchema>) => Promise<void> | void;
  /** Optional Docker image override. Default `mysql:8.4`. */
  readonly containerImage?: string;
}

/**
 * Constructor signature for `@prisma/client` `PrismaClient` (kept loose so
 * callers can pass their generated client without importing the type here).
 * The generic `TClient` is the caller's narrowed PrismaClient instance type.
 */
export type PrismaClientCtor<TClient = unknown> = new (options?: {
  datasourceUrl?: string;
  datasources?: { db: { url: string } };
}) => TClient;

export interface MockPrismaSqliteOptions<TClient = unknown> {
  readonly mode: 'mock';
  readonly orm: 'prisma';
  readonly dialect: 'sqlite';
  /**
   * The generated `PrismaClient` constructor exported from the caller's
   * `@prisma/client` (i.e. `import { PrismaClient } from '@prisma/client'`).
   * kiwa never invokes `prisma generate` itself; the caller manages codegen
   * as part of their normal Prisma workflow.
   */
  readonly prismaClient: PrismaClientCtor<TClient>;
  /**
   * Path to the schema.prisma file. The schema's `datasource db { url = env(...) }`
   * env var name is overridden via the `datasourceUrlEnv` field below.
   */
  readonly schemaPath: string;
  /**
   * Name of the env var the schema's `datasource db { url = env(...) }`
   * references. kiwa sets this env var to the temp SQLite file URL before
   * invoking `prisma db push --schema=<schemaPath>`. Default `DATABASE_URL`.
   */
  readonly datasourceUrlEnv?: string;
  /**
   * Optional seed callback. Receives the live PrismaClient instance.
   */
  readonly seed?: (client: TClient) => Promise<void> | void;
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
  TOrm extends OrmBrand = 'drizzle',
  TDialect extends SqlDialect = SqlDialect,
  TSchema extends DrizzleSchema = DrizzleSchema,
> = TMode extends 'mock'
  ? TOrm extends 'drizzle'
    ? TDialect extends 'sqlite'
      ? MockSqliteOptions<TSchema>
      : never
    : TOrm extends 'prisma'
      ? TDialect extends 'sqlite'
        ? MockPrismaSqliteOptions
        : never
      : never
  : TMode extends 'live'
    ? TOrm extends 'drizzle'
      ? TDialect extends 'postgres'
        ? LivePostgresOptions<TSchema>
        : TDialect extends 'mysql'
          ? LiveMysqlOptions<TSchema>
          : never
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

export interface OrmTestEnvLiveMysql<TSchema extends DrizzleSchema = DrizzleSchema>
  extends TestEnvBase<'live'> {
  readonly orm: 'drizzle';
  readonly dialect: 'mysql';
  readonly db: DrizzleMysqlDb<TSchema>;
  /** Raw `mysql2` Pool — exposed for `expectQuery` raw-SQL paths. */
  readonly raw: import('mysql2/promise').Pool;
  /** Connection URI assigned by the testcontainers MySQL instance. */
  readonly connectionUri: string;
}

export interface OrmTestEnvMockPrisma<TClient = unknown>
  extends TestEnvBase<'mock'> {
  readonly orm: 'prisma';
  readonly dialect: 'sqlite';
  /** Live PrismaClient instance constructed against the isolated tempdir DB. */
  readonly client: TClient;
  /** Absolute path to the tempdir-hosted SQLite file. */
  readonly dbPath: string;
  /** `file:` URL form of `dbPath` — same value injected into `datasourceUrlEnv`. */
  readonly datasourceUrl: string;
}

/**
 * Discriminated union. Tests narrow with `env.mode` / `env.orm` / `env.dialect`
 * to access the appropriate ORM client + raw driver shape.
 */
export type OrmTestEnv<TSchema extends DrizzleSchema = DrizzleSchema, TPrismaClient = unknown> =
  | OrmTestEnvMock<TSchema>
  | OrmTestEnvLive<TSchema>
  | OrmTestEnvLiveMysql<TSchema>
  | OrmTestEnvMockPrisma<TPrismaClient>;
