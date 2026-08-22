// setup-orm-env.ts — entry point for @kiwa-lab/orm.
//
// v0.1: Drizzle + better-sqlite3 in-memory (mode='mock' + dialect='sqlite').
// v0.2: Drizzle + Postgres via testcontainers (mode='live' + dialect='postgres').
// follow-up: MySQL via testcontainers (CAR-292.1), Prisma (CAR-293), Kysely (CAR-294),
// file-based migration (CAR-295).

import type {
  DrizzleSchema,
  KyselyDatabase,
  LiveKyselyMysqlOptions,
  LiveKyselyPostgresOptions,
  LiveMysqlOptions,
  LivePostgresOptions,
  LivePrismaMysqlOptions,
  LivePrismaPostgresOptions,
  MigrationSource,
  MockKyselySqliteOptions,
  MockPrismaSqliteOptions,
  MockSqliteOptions,
  OrmTestEnv,
} from './types.js';

function isFolderMigration(source: MigrationSource): source is { readonly folder: string } {
  return typeof source === 'object' && source !== null && !Array.isArray(source) && typeof (source as { folder?: unknown }).folder === 'string';
}

function splitSqlStatements(source: Exclude<MigrationSource, { folder: string }>): string[] {
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

async function setupMockSqlite<TSchema extends DrizzleSchema>(
  opts: MockSqliteOptions<TSchema>,
): Promise<OrmTestEnv<TSchema>> {
  const { default: Database } = await import('better-sqlite3');
  const { drizzle } = await import('drizzle-orm/better-sqlite3');

  const raw = new Database(':memory:');
  raw.pragma('foreign_keys = ON');
  const db = drizzle(raw, { schema: opts.schema });

  if (typeof opts.migrations !== 'undefined') {
    if (isFolderMigration(opts.migrations)) {
      const { migrate } = await import('drizzle-orm/better-sqlite3/migrator');
      migrate(db, { migrationsFolder: opts.migrations.folder });
    } else {
      for (const stmt of splitSqlStatements(opts.migrations)) {
        raw.exec(stmt);
      }
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

async function setupLivePostgres<TSchema extends DrizzleSchema>(
  opts: LivePostgresOptions<TSchema>,
): Promise<OrmTestEnv<TSchema>> {
  let containerModule: typeof import('@testcontainers/postgresql');
  let postgresModule: { default?: unknown } & Record<string, unknown>;
  let drizzleModule: typeof import('drizzle-orm/postgres-js');
  try {
    containerModule = await import('@testcontainers/postgresql');
    // postgres v3.x ships both `default` and named exports; type as a loose
    // record so we can pick whichever shape the bundler emits.
    postgresModule = (await import('postgres')) as unknown as { default?: unknown } & Record<string, unknown>;
    drizzleModule = await import('drizzle-orm/postgres-js');
  } catch (caught) {
    throw new Error(
      "@kiwa-lab/orm: live mode requires '@testcontainers/postgresql' + 'postgres' + 'drizzle-orm/postgres-js'. Install with `pnpm add -D @testcontainers/postgresql postgres drizzle-orm`. Original error: " +
        (caught instanceof Error ? caught.message : String(caught)),
    );
  }

  const image = opts.containerImage ?? 'postgres:16-alpine';
  let container: import('@testcontainers/postgresql').StartedPostgreSqlContainer;
  try {
    container = await new containerModule.PostgreSqlContainer(image).start();
  } catch (caught) {
    const msg = caught instanceof Error ? caught.message : String(caught);
    throw new Error(
      `@kiwa-lab/orm: failed to start Postgres testcontainer (image=${image}). Verify the Docker daemon is running (\`docker ps\` should succeed). Original error: ${msg}`,
    );
  }

  const connectionUri = container.getConnectionUri();
  // postgres.js default ESM export = the factory function. Bundlers may
  // wrap it under `.default` or expose it directly; handle both.
  const maybeDefault = postgresModule.default;
  const sqlFactoryRaw = typeof maybeDefault === 'function' ? maybeDefault : postgresModule;
  const sqlFactory = sqlFactoryRaw as unknown as (
    url: string,
    opts: { max: number; onnotice?: () => void },
  ) => import('postgres').Sql;
  const raw = sqlFactory(connectionUri, { max: 4, onnotice: () => undefined });
  const db = drizzleModule.drizzle(raw, { schema: opts.schema });

  if (typeof opts.migrations !== 'undefined') {
    if (isFolderMigration(opts.migrations)) {
      const { migrate } = await import('drizzle-orm/postgres-js/migrator');
      await migrate(db, { migrationsFolder: opts.migrations.folder });
    } else {
    for (const stmt of splitSqlStatements(opts.migrations)) {
      // postgres.js `sql.unsafe` accepts arbitrary DDL and returns a Promise.
      await raw.unsafe(stmt);
    }
    }
  }
  if (typeof opts.seed === 'function') {
    await opts.seed(db);
  }

  return {
    mode: 'live',
    orm: 'drizzle',
    dialect: 'postgres',
    db,
    raw,
    connectionUri,
    stop: async () => {
      try {
        await raw.end({ timeout: 5 });
      } finally {
        await container.stop();
      }
    },
  };
}

async function setupLiveMysql<TSchema extends DrizzleSchema>(
  opts: LiveMysqlOptions<TSchema>,
): Promise<OrmTestEnv<TSchema>> {
  let containerModule: typeof import('@testcontainers/mysql');
  let mysql2Module: { default?: unknown } & Record<string, unknown>;
  let drizzleModule: typeof import('drizzle-orm/mysql2');
  try {
    containerModule = await import('@testcontainers/mysql');
    mysql2Module = (await import('mysql2/promise')) as unknown as { default?: unknown } & Record<string, unknown>;
    drizzleModule = await import('drizzle-orm/mysql2');
  } catch (caught) {
    throw new Error(
      "@kiwa-lab/orm: live MySQL mode requires '@testcontainers/mysql' + 'mysql2' + 'drizzle-orm/mysql2'. Install with `pnpm add -D @testcontainers/mysql mysql2 drizzle-orm`. Original error: " +
        (caught instanceof Error ? caught.message : String(caught)),
    );
  }

  const image = opts.containerImage ?? 'mysql:8.4';
  let container: import('@testcontainers/mysql').StartedMySqlContainer;
  try {
    container = await new containerModule.MySqlContainer(image).start();
  } catch (caught) {
    const msg = caught instanceof Error ? caught.message : String(caught);
    throw new Error(
      `@kiwa-lab/orm: failed to start MySQL testcontainer (image=${image}). Verify the Docker daemon is running (\`docker ps\` should succeed). Original error: ${msg}`,
    );
  }

  const connectionUri = container.getConnectionUri();
  // mysql2/promise exposes `createPool` either as a named export or under
  // `.default.createPool` depending on the bundler; handle both.
  const directCreatePool = (mysql2Module as unknown as { createPool?: unknown }).createPool;
  const defaultExport = (mysql2Module as unknown as { default?: { createPool?: unknown } }).default;
  const createPoolFn = (typeof directCreatePool === 'function' ? directCreatePool : defaultExport?.createPool) as unknown as (
    uri: string,
  ) => import('mysql2/promise').Pool;
  if (typeof createPoolFn !== 'function') {
    throw new Error('@kiwa-lab/orm: could not resolve mysql2/promise createPool export.');
  }
  const raw = createPoolFn(connectionUri);
  const db = drizzleModule.drizzle(raw, { schema: opts.schema, mode: 'default' });

  if (typeof opts.migrations !== 'undefined') {
    if (isFolderMigration(opts.migrations)) {
      const { migrate } = await import('drizzle-orm/mysql2/migrator');
      await migrate(db, { migrationsFolder: opts.migrations.folder });
    } else {
    for (const stmt of splitSqlStatements(opts.migrations)) {
      // mysql2 `query` accepts arbitrary DDL.
      await raw.query(stmt);
    }
    }
  }
  if (typeof opts.seed === 'function') {
    await opts.seed(db);
  }

  return {
    mode: 'live',
    orm: 'drizzle',
    dialect: 'mysql',
    db,
    raw,
    connectionUri,
    stop: async () => {
      try {
        await raw.end();
      } finally {
        await container.stop();
      }
    },
  };
}

async function setupMockPrismaSqlite<TClient>(
  opts: MockPrismaSqliteOptions<TClient>,
): Promise<OrmTestEnv<DrizzleSchema, TClient>> {
  const { join } = await import('node:path');
  const { spawnSync } = await import('node:child_process');
  const { createManagedTempDir } = await import('@kiwa-lab/core');

  const managed = createManagedTempDir({ label: 'orm-prisma' });
  const tmpDir = managed.path;
  const dbPath = join(tmpDir, 'test.db');
  const datasourceUrl = `file:${dbPath}`;
  const envName = opts.datasourceUrlEnv ?? 'DATABASE_URL';
  const previousEnv = process.env[envName];
  process.env[envName] = datasourceUrl;

  // Push the schema to the empty SQLite file (creates the tables without
  // requiring a migration history). `prisma` CLI is resolved via the
  // caller's local install — kiwa never bundles it.
  const result = spawnSync(
    'pnpm',
    ['exec', 'prisma', 'db', 'push', `--schema=${opts.schemaPath}`, '--skip-generate', '--accept-data-loss'],
    {
      stdio: 'pipe',
      env: { ...process.env, [envName]: datasourceUrl },
      encoding: 'utf8',
    },
  );
  if (result.status !== 0) {
    if (typeof previousEnv === 'string') process.env[envName] = previousEnv;
    else delete process.env[envName];
    managed.dispose();
    throw new Error(
      `@kiwa-lab/orm: prisma db push failed (status=${result.status}). stderr=${result.stderr ?? ''} stdout=${result.stdout ?? ''}`,
    );
  }

  const client = new opts.prismaClient({ datasourceUrl });
  if (typeof opts.seed === 'function') {
    await opts.seed(client);
  }

  return {
    mode: 'mock',
    orm: 'prisma',
    dialect: 'sqlite',
    client,
    dbPath,
    datasourceUrl,
    stop: async () => {
      // PrismaClient exposes `$disconnect`; type as loose since TClient is
      // a generic placeholder for the caller's narrowed instance.
      const maybeDisconnect = (client as unknown as { $disconnect?: () => Promise<void> }).$disconnect;
      if (typeof maybeDisconnect === 'function') {
        try {
          await maybeDisconnect.call(client);
        } catch {
          /* swallow disconnect errors — tempdir cleanup below is the priority */
        }
      }
      if (typeof previousEnv === 'string') process.env[envName] = previousEnv;
      else delete process.env[envName];
      managed.dispose();
    },
  };
}

async function setupLivePrismaPostgres<TClient>(
  opts: LivePrismaPostgresOptions<TClient>,
): Promise<OrmTestEnv<DrizzleSchema, TClient>> {
  const { spawnSync } = await import('node:child_process');
  let containerModule: typeof import('@testcontainers/postgresql');
  try {
    containerModule = await import('@testcontainers/postgresql');
  } catch (caught) {
    throw new Error(
      "@kiwa-lab/orm: live Prisma Postgres mode requires '@testcontainers/postgresql'. Install with `pnpm add -D @testcontainers/postgresql`. Original error: " +
        (caught instanceof Error ? caught.message : String(caught)),
    );
  }

  const image = opts.containerImage ?? 'postgres:16-alpine';
  let container: import('@testcontainers/postgresql').StartedPostgreSqlContainer;
  try {
    container = await new containerModule.PostgreSqlContainer(image).start();
  } catch (caught) {
    const msg = caught instanceof Error ? caught.message : String(caught);
    throw new Error(
      `@kiwa-lab/orm: failed to start Postgres testcontainer (image=${image}). Verify the Docker daemon is running (\`docker ps\` should succeed). Original error: ${msg}`,
    );
  }

  const connectionUri = container.getConnectionUri();
  const envName = opts.datasourceUrlEnv ?? 'DATABASE_URL';
  const previousEnv = process.env[envName];
  process.env[envName] = connectionUri;


  const result = pushSchemaWithRetry(spawnSync, opts.schemaPath, envName, connectionUri);
  if (result.status !== 0) {
    if (typeof previousEnv === 'string') process.env[envName] = previousEnv;
    else delete process.env[envName];
    await container.stop();
    throw new Error(
      `@kiwa-lab/orm: prisma db push failed against testcontainers Postgres (status=${result.status}). Verify the schema.prisma datasource has provider="postgresql" + url = env("${envName}"). stderr=${result.stderr ?? ''}`,
    );
  }

  const client = new opts.prismaClient({ datasourceUrl: connectionUri });
  if (typeof opts.seed === 'function') {
    await opts.seed(client);
  }

  return {
    mode: 'live',
    orm: 'prisma',
    dialect: 'postgres',
    client,
    connectionUri,
    stop: async () => {
      const maybeDisconnect = (client as unknown as { $disconnect?: () => Promise<void> }).$disconnect;
      if (typeof maybeDisconnect === 'function') {
        try {
          await maybeDisconnect.call(client);
        } catch {
          /* swallow */
        }
      }
      if (typeof previousEnv === 'string') process.env[envName] = previousEnv;
      else delete process.env[envName];
      await container.stop();
    },
  };
}

async function setupLivePrismaMysql<TClient>(
  opts: LivePrismaMysqlOptions<TClient>,
): Promise<OrmTestEnv<DrizzleSchema, TClient>> {
  const { spawnSync } = await import('node:child_process');
  let containerModule: typeof import('@testcontainers/mysql');
  try {
    containerModule = await import('@testcontainers/mysql');
  } catch (caught) {
    throw new Error(
      "@kiwa-lab/orm: live Prisma MySQL mode requires '@testcontainers/mysql'. Install with `pnpm add -D @testcontainers/mysql`. Original error: " +
        (caught instanceof Error ? caught.message : String(caught)),
    );
  }

  const image = opts.containerImage ?? 'mysql:8.4';
  let container: import('@testcontainers/mysql').StartedMySqlContainer;
  try {
    container = await new containerModule.MySqlContainer(image).start();
  } catch (caught) {
    const msg = caught instanceof Error ? caught.message : String(caught);
    throw new Error(
      `@kiwa-lab/orm: failed to start MySQL testcontainer (image=${image}). Verify the Docker daemon is running (\`docker ps\` should succeed). Original error: ${msg}`,
    );
  }

  const connectionUri = container.getConnectionUri();
  const envName = opts.datasourceUrlEnv ?? 'DATABASE_URL';
  const previousEnv = process.env[envName];
  process.env[envName] = connectionUri;


  const result = pushSchemaWithRetry(spawnSync, opts.schemaPath, envName, connectionUri);
  if (result.status !== 0) {
    if (typeof previousEnv === 'string') process.env[envName] = previousEnv;
    else delete process.env[envName];
    await container.stop();
    throw new Error(
      `@kiwa-lab/orm: prisma db push failed against testcontainers MySQL (status=${result.status}). Verify the schema.prisma datasource has provider="mysql" + url = env("${envName}"). stderr=${result.stderr ?? ''}`,
    );
  }

  const client = new opts.prismaClient({ datasourceUrl: connectionUri });
  if (typeof opts.seed === 'function') {
    await opts.seed(client);
  }

  return {
    mode: 'live',
    orm: 'prisma',
    dialect: 'mysql',
    client,
    connectionUri,
    stop: async () => {
      const maybeDisconnect = (client as unknown as { $disconnect?: () => Promise<void> }).$disconnect;
      if (typeof maybeDisconnect === 'function') {
        try {
          await maybeDisconnect.call(client);
        } catch {
          /* swallow */
        }
      }
      if (typeof previousEnv === 'string') process.env[envName] = previousEnv;
      else delete process.env[envName];
      await container.stop();
    },
  };
}

/**
 * Apply Kysely folder-based migrations via `kysely.Migrator` + `FileMigrationProvider`.
 *
 * Caller's migration folder must contain Kysely `Migration` modules (each
 * exporting an `up(db)` function and optionally `down(db)`). Migration order
 * is the alphabetical order of file names — same contract as Kysely's own
 * `FileMigrationProvider`.
 */
async function applyKyselyFolderMigrations(
  db: import('kysely').Kysely<KyselyDatabase>,
  folder: string,
): Promise<void> {
  const kyselyModule = await import('kysely');
  const FileMigrationProvider =
    (kyselyModule as unknown as { FileMigrationProvider?: unknown }).FileMigrationProvider;
  if (typeof FileMigrationProvider !== 'function') {
    throw new Error(
      "@kiwa-lab/orm v0.7: kysely FileMigrationProvider is not exposed by the installed kysely build. Ensure kysely >= 0.27 is installed.",
    );
  }
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const ProviderCtor = FileMigrationProvider as new (props: {
    fs: typeof fs;
    path: typeof path;
    migrationFolder: string;
  }) => import('kysely').MigrationProvider;
  const provider = new ProviderCtor({ fs, path, migrationFolder: folder });
  const migrator = new kyselyModule.Migrator({ db, provider });
  const { error, results } = await migrator.migrateToLatest();
  if (typeof error !== 'undefined') {
    const failed = results?.filter((r) => r.status === 'Error').map((r) => r.migrationName) ?? [];
    throw new Error(
      `@kiwa-lab/orm v0.7: kysely Migrator.migrateToLatest failed (folder=${folder}, failed=[${failed.join(', ')}]). Original error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function setupMockKyselySqlite<TDatabase extends KyselyDatabase>(
  opts: MockKyselySqliteOptions<TDatabase>,
): Promise<OrmTestEnv<DrizzleSchema, unknown, TDatabase>> {
  const { default: Database } = await import('better-sqlite3');
  const { Kysely, SqliteDialect } = await import('kysely');

  const raw = new Database(':memory:');
  raw.pragma('foreign_keys = ON');
  const db = new Kysely<TDatabase>({ dialect: new SqliteDialect({ database: raw }) });

  if (typeof opts.migrations !== 'undefined') {
    if (isFolderMigration(opts.migrations)) {
      await applyKyselyFolderMigrations(db as unknown as import('kysely').Kysely<KyselyDatabase>, opts.migrations.folder);
    } else {
      for (const stmt of splitSqlStatements(opts.migrations)) {
        raw.exec(stmt);
      }
    }
  }
  if (typeof opts.seed === 'function') {
    await opts.seed(db);
  }
  return {
    mode: 'mock',
    orm: 'kysely',
    dialect: 'sqlite',
    db,
    raw,
    stop: async () => {
      await db.destroy();
      raw.close();
    },
  };
}

async function setupLiveKyselyPostgres<TDatabase extends KyselyDatabase>(
  opts: LiveKyselyPostgresOptions<TDatabase>,
): Promise<OrmTestEnv<DrizzleSchema, unknown, TDatabase>> {
  let containerModule: typeof import('@testcontainers/postgresql');
  let pgModule: { default?: unknown } & Record<string, unknown>;
  let kyselyModule: typeof import('kysely');
  try {
    containerModule = await import('@testcontainers/postgresql');
    pgModule = (await import('pg')) as unknown as { default?: unknown } & Record<string, unknown>;
    kyselyModule = await import('kysely');
  } catch (caught) {
    throw new Error(
      "@kiwa-lab/orm: live Kysely (Postgres) mode requires '@testcontainers/postgresql' + 'pg' + 'kysely'. Install with `pnpm add -D @testcontainers/postgresql pg kysely`. Original error: " +
        (caught instanceof Error ? caught.message : String(caught)),
    );
  }

  const image = opts.containerImage ?? 'postgres:16-alpine';
  let container: import('@testcontainers/postgresql').StartedPostgreSqlContainer;
  try {
    container = await new containerModule.PostgreSqlContainer(image).start();
  } catch (caught) {
    const msg = caught instanceof Error ? caught.message : String(caught);
    throw new Error(
      `@kiwa-lab/orm: failed to start Postgres testcontainer (image=${image}). Verify the Docker daemon is running (\`docker ps\` should succeed). Original error: ${msg}`,
    );
  }

  const connectionUri = container.getConnectionUri();
  const PoolCtor = ((pgModule as { default?: { Pool?: unknown } }).default?.Pool ?? (pgModule as { Pool?: unknown }).Pool) as new (config: { connectionString: string; max?: number }) => import('pg').Pool;
  const raw = new PoolCtor({ connectionString: connectionUri, max: 4 });
  let rawEnded = false;
  const endRaw = async (): Promise<void> => {
    if (rawEnded) return;
    rawEnded = true;
    await raw.end();
  };
  // Kysely owns its dialect pool after the first query. Keep that close and
  // the explicit stop-path close idempotent because setup can return before a query runs.
  const dialectPool = {
    connect: raw.connect.bind(raw),
    end: endRaw,
  } as unknown as import('pg').Pool;
  const db = new kyselyModule.Kysely<TDatabase>({ dialect: new kyselyModule.PostgresDialect({ pool: dialectPool }) });

  if (typeof opts.migrations !== 'undefined') {
    if (isFolderMigration(opts.migrations)) {
      await applyKyselyFolderMigrations(db as unknown as import('kysely').Kysely<KyselyDatabase>, opts.migrations.folder);
    } else {
      for (const stmt of splitSqlStatements(opts.migrations)) {
        await raw.query(stmt);
      }
    }
  }
  if (typeof opts.seed === 'function') {
    await opts.seed(db);
  }

  return {
    mode: 'live',
    orm: 'kysely',
    dialect: 'postgres',
    db,
    raw,
    connectionUri,
    stop: async () => {
      try {
        await db.destroy();
      } finally {
        try {
          await endRaw();
        } finally {
          await container.stop();
        }
      }
    },
  };
}

async function setupLiveKyselyMysql<TDatabase extends KyselyDatabase>(
  opts: LiveKyselyMysqlOptions<TDatabase>,
): Promise<OrmTestEnv<DrizzleSchema, unknown, TDatabase>> {
  let containerModule: typeof import('@testcontainers/mysql');
  let mysql2Module: { default?: unknown } & Record<string, unknown>;
  let kyselyModule: typeof import('kysely');
  try {
    containerModule = await import('@testcontainers/mysql');
    mysql2Module = (await import('mysql2/promise')) as unknown as { default?: unknown } & Record<string, unknown>;
    kyselyModule = await import('kysely');
  } catch (caught) {
    throw new Error(
      "@kiwa-lab/orm: live Kysely (MySQL) mode requires '@testcontainers/mysql' + 'mysql2' + 'kysely'. Install with `pnpm add -D @testcontainers/mysql mysql2 kysely`. Original error: " +
        (caught instanceof Error ? caught.message : String(caught)),
    );
  }

  const image = opts.containerImage ?? 'mysql:8.4';
  let container: import('@testcontainers/mysql').StartedMySqlContainer;
  try {
    container = await new containerModule.MySqlContainer(image).start();
  } catch (caught) {
    const msg = caught instanceof Error ? caught.message : String(caught);
    throw new Error(
      `@kiwa-lab/orm: failed to start MySQL testcontainer (image=${image}). Verify the Docker daemon is running. Original error: ${msg}`,
    );
  }

  const connectionUri = container.getConnectionUri();
  const directCreatePool = (mysql2Module as unknown as { createPool?: unknown }).createPool;
  const defaultExport = (mysql2Module as unknown as { default?: { createPool?: unknown } }).default;
  const createPoolFn = (typeof directCreatePool === 'function' ? directCreatePool : defaultExport?.createPool) as unknown as (
    uri: string,
  ) => import('mysql2/promise').Pool;
  if (typeof createPoolFn !== 'function') {
    await container.stop();
    throw new Error('@kiwa-lab/orm: could not resolve mysql2/promise createPool export.');
  }
  const raw = createPoolFn(connectionUri);
  let rawEnded = false;
  const endRaw = async (): Promise<void> => {
    if (rawEnded) return;
    rawEnded = true;
    await raw.end();
  };
  // `mysql2/promise` exposes the callback pool under `.pool`; Kysely calls
  // getConnection/end with callbacks, while env.raw remains the promise facade.
  const callbackPool = raw.pool;
  const dialectPool = {
    getConnection: callbackPool.getConnection.bind(callbackPool),
    end: (callback: (error: Error | null) => void): void => {
      void endRaw().then(
        () => callback(null),
        (caught: unknown) => callback(caught instanceof Error ? caught : new Error(String(caught))),
      );
    },
  };
  const db = new kyselyModule.Kysely<TDatabase>({
    dialect: new kyselyModule.MysqlDialect({ pool: dialectPool } as unknown as ConstructorParameters<typeof kyselyModule.MysqlDialect>[0]),
  });

  if (typeof opts.migrations !== 'undefined') {
    if (isFolderMigration(opts.migrations)) {
      await applyKyselyFolderMigrations(db as unknown as import('kysely').Kysely<KyselyDatabase>, opts.migrations.folder);
    } else {
      for (const stmt of splitSqlStatements(opts.migrations)) {
        await raw.query(stmt);
      }
    }
  }
  if (typeof opts.seed === 'function') {
    await opts.seed(db);
  }

  return {
    mode: 'live',
    orm: 'kysely',
    dialect: 'mysql',
    db,
    raw,
    connectionUri,
    stop: async () => {
      try {
        await db.destroy();
      } finally {
        try {
          await endRaw();
        } finally {
          await container.stop();
        }
      }
    },
  };
}

/**
 * Set up an isolated ORM test environment.
 *
 * - `mode='mock' + orm='drizzle' + dialect='sqlite'` (v0.1) — in-memory better-sqlite3
 * - `mode='live' + orm='drizzle' + dialect='postgres'` (v0.2) — testcontainers Postgres
 * - `mode='live' + orm='drizzle' + dialect='mysql'` (v0.2.1) — testcontainers MySQL
 * - `mode='mock' + orm='prisma' + dialect='sqlite'` (v0.3) — Prisma + tempdir SQLite
 * - `mode='mock' + orm='kysely' + dialect='sqlite'` (v0.4) — Kysely + in-memory SQLite
 * - `mode='live' + orm='kysely' + dialect='postgres'|'mysql'` (v0.4) — Kysely + testcontainers
 *
 * Other combinations throw a descriptive Error so callers know which
 * follow-up Issue tracks the missing capability.
 */
import type {
  OrmTestEnvLive as OrmTestEnvLiveT,
  OrmTestEnvLiveKyselyMysql as OrmTestEnvLiveKyselyMysqlT,
  OrmTestEnvLiveKyselyPostgres as OrmTestEnvLiveKyselyPostgresT,
  OrmTestEnvLiveMysql as OrmTestEnvLiveMysqlT,
  OrmTestEnvMock as OrmTestEnvMockT,
  OrmTestEnvMockKysely as OrmTestEnvMockKyselyT,
  OrmTestEnvMockPrisma as OrmTestEnvMockPrismaT,
} from './types.js';

// Mock SQLite overload — `seed` receives the SQLite client (no union).
export function setupOrmEnv<TSchema extends DrizzleSchema = DrizzleSchema>(
  opts: MockSqliteOptions<TSchema>,
): Promise<OrmTestEnvMockT<TSchema>>;
// Live Postgres overload — `seed` receives the Postgres client.
export function setupOrmEnv<TSchema extends DrizzleSchema = DrizzleSchema>(
  opts: LivePostgresOptions<TSchema>,
): Promise<OrmTestEnvLiveT<TSchema>>;
// Live MySQL overload — `seed` receives the MySQL client.
export function setupOrmEnv<TSchema extends DrizzleSchema = DrizzleSchema>(
  opts: LiveMysqlOptions<TSchema>,
): Promise<OrmTestEnvLiveMysqlT<TSchema>>;
// Prisma SQLite overload — `seed` receives the caller's PrismaClient.
export function setupOrmEnv<TClient>(
  opts: MockPrismaSqliteOptions<TClient>,
): Promise<OrmTestEnvMockPrismaT<TClient>>;
// Prisma Postgres overload — testcontainers + caller's PrismaClient.
export function setupOrmEnv<TClient>(
  opts: LivePrismaPostgresOptions<TClient>,
): Promise<import('./types.js').OrmTestEnvLivePrismaPostgres<TClient>>;
// Prisma MySQL overload — testcontainers + caller's PrismaClient.
export function setupOrmEnv<TClient>(
  opts: LivePrismaMysqlOptions<TClient>,
): Promise<import('./types.js').OrmTestEnvLivePrismaMysql<TClient>>;
// Kysely SQLite overload — `seed` receives Kysely<TDatabase>.
export function setupOrmEnv<TDatabase extends KyselyDatabase>(
  opts: MockKyselySqliteOptions<TDatabase>,
): Promise<OrmTestEnvMockKyselyT<TDatabase>>;
// Kysely Postgres overload.
export function setupOrmEnv<TDatabase extends KyselyDatabase>(
  opts: LiveKyselyPostgresOptions<TDatabase>,
): Promise<OrmTestEnvLiveKyselyPostgresT<TDatabase>>;
// Kysely MySQL overload.
export function setupOrmEnv<TDatabase extends KyselyDatabase>(
  opts: LiveKyselyMysqlOptions<TDatabase>,
): Promise<OrmTestEnvLiveKyselyMysqlT<TDatabase>>;
// Implementation signature — accepts the union and dispatches at runtime.
export async function setupOrmEnv(
  opts:
    | MockSqliteOptions<DrizzleSchema>
    | LivePostgresOptions<DrizzleSchema>
    | LiveMysqlOptions<DrizzleSchema>
    | MockPrismaSqliteOptions<unknown>
    | LivePrismaPostgresOptions<unknown>
    | LivePrismaMysqlOptions<unknown>
    | MockKyselySqliteOptions<KyselyDatabase>
    | LiveKyselyPostgresOptions<KyselyDatabase>
    | LiveKyselyMysqlOptions<KyselyDatabase>,
): Promise<OrmTestEnv<DrizzleSchema, unknown, KyselyDatabase>> {
  if (opts.orm === 'prisma') {
    if (opts.mode === 'mock' && opts.dialect === 'sqlite') {
      return setupMockPrismaSqlite(opts);
    }
    if (opts.mode === 'live' && opts.dialect === 'postgres') {
      return setupLivePrismaPostgres(opts);
    }
    if (opts.mode === 'live' && opts.dialect === 'mysql') {
      return setupLivePrismaMysql(opts);
    }
    throw new Error(
      `@kiwa-lab/orm v0.7: prisma adapter supports mode='mock'+dialect='sqlite', mode='live'+dialect='postgres', and mode='live'+dialect='mysql' (received mode='${(opts as { mode: string }).mode}' / dialect='${(opts as { dialect: string }).dialect}').`,
    );
  }
  if (opts.orm === 'kysely') {
    if (opts.mode === 'mock' && opts.dialect === 'sqlite') {
      return setupMockKyselySqlite(opts);
    }
    if (opts.mode === 'live' && opts.dialect === 'postgres') {
      return setupLiveKyselyPostgres(opts);
    }
    if (opts.mode === 'live' && opts.dialect === 'mysql') {
      return setupLiveKyselyMysql(opts);
    }
    throw new Error(
      `@kiwa-lab/orm v0.7: kysely adapter only supports mock+sqlite / live+postgres / live+mysql (received mode='${(opts as { mode: string }).mode}' / dialect='${(opts as { dialect: string }).dialect}').`,
    );
  }
  if (opts.orm !== 'drizzle') {
    throw new Error(
      `@kiwa-lab/orm v0.7 only supports orm='drizzle' / 'prisma' / 'kysely' (received '${(opts as { orm: string }).orm}').`,
    );
  }
  if (opts.mode === 'mock' && opts.dialect === 'sqlite') {
    return setupMockSqlite(opts);
  }
  if (opts.mode === 'live' && opts.dialect === 'postgres') {
    return setupLivePostgres(opts);
  }
  if (opts.mode === 'live' && opts.dialect === 'mysql') {
    return setupLiveMysql(opts);
  }
  throw new Error(
    `@kiwa-lab/orm v0.7: unsupported combination mode='${(opts as { mode: string }).mode}' / orm='${(opts as { orm: string }).orm}' / dialect='${(opts as { dialect: string }).dialect}'. See README for the supported matrix.`,
  );
}

/**
 * `prisma db push` を、 接続を受けるまで再試行する。
 *
 * testcontainers の `start()` は「container が立った」 までしか保証しない。
 * MySQL / Postgres は起動後さらに初期化を続けるため、 直後に叩くと
 * `Please make sure your database server is running` で弾かれる。 Docker が
 * 混んでいるほどこの間隔が開く (#1724 実測 = 他 project の container が 25 個
 * 稼働している時に失敗)。
 *
 * 別に接続を試すのではなく `db push` 自体を再試行する。 実際に使う経路で判定するので、
 * 「立った」 と「使える」 の取り違えが起きない。 接続以外の理由 (schema の誤り 等)
 * で失敗する場合は再試行しても同じ結果になり、 上限に達して最後の出力を返す。
 *
 * `spawnSync` を引数で受けるのは、 container を立てずに再試行の判断を確かめるため。
 */
export function pushSchemaWithRetry(
  spawnSync: typeof import('node:child_process').spawnSync,
  schemaPath: string,
  envName: string,
  connectionUri: string,
  limitMs = 120_000,
): { status: number | null; stderr: string; stdout: string } {
  const startedAt = Date.now();
  let last: { status: number | null; stderr: string; stdout: string };
  for (;;) {
    // 上限は 1 回の呼出にも掛ける。 掛けないと、 接続先で止まった `db push` が
    // 戻らない限り上限の判定に到達せず、 全体テストごと止まる。
    const remainingMs = Math.max(1, limitMs - (Date.now() - startedAt));
    const result = spawnSync(
      'pnpm',
      ['exec', 'prisma', 'db', 'push', `--schema=${schemaPath}`, '--skip-generate', '--accept-data-loss'],
      {
        stdio: 'pipe',
        env: { ...process.env, [envName]: connectionUri },
        encoding: 'utf8',
        timeout: remainingMs,
      },
    );
    // 起動できなかった / 打ち切られた場合、 理由は `error` にしか出ない。
    // 落とすと最後の診断が空になる。
    const spawnError = result.error ? `${result.error.message}\n` : '';
    last = {
      status: result.status,
      stderr: spawnError + (result.stderr ?? ''),
      stdout: result.stdout ?? '',
    };
    if (result.status === 0) return last;
    // 接続を受けていないことが読み取れる時だけ待って繰り返す。
    const reachable = !/database server is running|ECONNREFUSED|Can't reach database server/i.test(last.stderr + last.stdout);
    if (reachable || Date.now() - startedAt >= limitMs) return last;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
  }
}
