// setup-orm-env.ts — entry point for @kiwa-test/orm.
//
// v0.1: Drizzle + better-sqlite3 in-memory (mode='mock' + dialect='sqlite').
// v0.2: Drizzle + Postgres via testcontainers (mode='live' + dialect='postgres').
// follow-up: MySQL via testcontainers (CAR-292.1), Prisma (CAR-293), Kysely (CAR-294),
// file-based migration (CAR-295).

import type {
  DrizzleSchema,
  LiveMysqlOptions,
  LivePostgresOptions,
  MigrationSource,
  MockPrismaSqliteOptions,
  MockSqliteOptions,
  OrmTestEnv,
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

async function setupMockSqlite<TSchema extends DrizzleSchema>(
  opts: MockSqliteOptions<TSchema>,
): Promise<OrmTestEnv<TSchema>> {
  const { default: Database } = await import('better-sqlite3');
  const { drizzle } = await import('drizzle-orm/better-sqlite3');

  const raw = new Database(':memory:');
  raw.pragma('foreign_keys = ON');
  const db = drizzle(raw, { schema: opts.schema });

  if (typeof opts.migrations !== 'undefined') {
    for (const stmt of splitSqlStatements(opts.migrations)) {
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
      "@kiwa-test/orm: live mode requires '@testcontainers/postgresql' + 'postgres' + 'drizzle-orm/postgres-js'. Install with `pnpm add -D @testcontainers/postgresql postgres drizzle-orm`. Original error: " +
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
      `@kiwa-test/orm: failed to start Postgres testcontainer (image=${image}). Verify the Docker daemon is running (\`docker ps\` should succeed). Original error: ${msg}`,
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
    for (const stmt of splitSqlStatements(opts.migrations)) {
      // postgres.js `sql.unsafe` accepts arbitrary DDL and returns a Promise.
      await raw.unsafe(stmt);
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
      "@kiwa-test/orm: live MySQL mode requires '@testcontainers/mysql' + 'mysql2' + 'drizzle-orm/mysql2'. Install with `pnpm add -D @testcontainers/mysql mysql2 drizzle-orm`. Original error: " +
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
      `@kiwa-test/orm: failed to start MySQL testcontainer (image=${image}). Verify the Docker daemon is running (\`docker ps\` should succeed). Original error: ${msg}`,
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
    throw new Error('@kiwa-test/orm: could not resolve mysql2/promise createPool export.');
  }
  const raw = createPoolFn(connectionUri);
  const db = drizzleModule.drizzle(raw, { schema: opts.schema, mode: 'default' });

  if (typeof opts.migrations !== 'undefined') {
    for (const stmt of splitSqlStatements(opts.migrations)) {
      // mysql2 `query` accepts arbitrary DDL.
      await raw.query(stmt);
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
  const { mkdtemp, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { spawnSync } = await import('node:child_process');

  const tmpDir = await mkdtemp(join(tmpdir(), 'kiwa-orm-prisma-'));
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
    await rm(tmpDir, { recursive: true, force: true });
    throw new Error(
      `@kiwa-test/orm: prisma db push failed (status=${result.status}). stderr=${result.stderr ?? ''} stdout=${result.stdout ?? ''}`,
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
      await rm(tmpDir, { recursive: true, force: true });
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
 *
 * Other combinations throw a descriptive Error so callers know which
 * follow-up Issue tracks the missing capability.
 */
import type {
  OrmTestEnvLive as OrmTestEnvLiveT,
  OrmTestEnvLiveMysql as OrmTestEnvLiveMysqlT,
  OrmTestEnvMock as OrmTestEnvMockT,
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
// Implementation signature — accepts the union and dispatches at runtime.
// The return is widened via the overload signatures above; here we use a
// loose return shape and cast at the implementation level so the public
// overloads stay precise.
export async function setupOrmEnv(
  opts:
    | MockSqliteOptions<DrizzleSchema>
    | LivePostgresOptions<DrizzleSchema>
    | LiveMysqlOptions<DrizzleSchema>
    | MockPrismaSqliteOptions<unknown>,
): Promise<OrmTestEnv<DrizzleSchema, unknown>> {
  if (opts.orm === 'prisma') {
    if (opts.mode === 'mock' && opts.dialect === 'sqlite') {
      return setupMockPrismaSqlite(opts);
    }
    throw new Error(
      `@kiwa-test/orm v0.3: prisma adapter currently only supports mode='mock' + dialect='sqlite' (received mode='${(opts as { mode: string }).mode}' / dialect='${(opts as { dialect: string }).dialect}'). Postgres / MySQL via Prisma + testcontainers ships in CAR-293 follow-up.`,
    );
  }
  if (opts.orm !== 'drizzle') {
    throw new Error(
      `@kiwa-test/orm v0.3 only supports orm='drizzle' or 'prisma' (received '${(opts as { orm: string }).orm}'). Kysely adapter lands in CAR-294.`,
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
    `@kiwa-test/orm v0.3: unsupported combination mode='${(opts as { mode: string }).mode}' / orm='${(opts as { orm: string }).orm}' / dialect='${(opts as { dialect: string }).dialect}'. See README for the supported matrix.`,
  );
}
