# @kiwa-test/orm

<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-promo-en.gif" alt="kiwa 127s overview" width="640" />
  <br />
  <sub>Full <a href="https://github.com/cardene777/kiwa">kiwa</a> overview (127s) — this package covers the ORM query test surface.</sub>
</p>

ORM query test adapter for kiwa.

## Overview

`@kiwa-test/orm` provides deterministic primitives for testing ORM-backed query layers.

- **v0.1** — Drizzle ORM + in-memory SQLite (`mode: 'mock'`). Fast, Docker-free, type-safe.
- **v0.2** — Drizzle ORM + Postgres via testcontainers.
- **v0.2.1** — Drizzle ORM + MySQL via testcontainers.
- **v0.3** — Prisma + tempdir SQLite + `prisma db push`.
- **v0.4** — Kysely query builder across SQLite (in-memory) + Postgres / MySQL (testcontainers).
- **v0.5** (this release) — file-based migration via `drizzle-orm/migrator` (`migrations: { folder }`). Drizzle-only.

**Roadmap** — Prisma + testcontainers Postgres/MySQL (rest of CAR-293).

## Install

```bash
# mock mode (SQLite) — minimum install
pnpm add -D @kiwa-test/orm @kiwa-test/core drizzle-orm better-sqlite3 vitest

# live mode (Postgres) — add testcontainers + postgres.js
pnpm add -D @testcontainers/postgresql postgres
```

All driver / runtime packages are declared as `peerDependencies` so callers control the versions directly. `better-sqlite3` is only required for mock mode; `testcontainers` + `@testcontainers/postgresql` + `postgres` only for live mode.

## Quick start — mock SQLite (v0.1)

```ts
import { setupOrmEnv } from '@kiwa-test/orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

const users = sqliteTable('users', { id: integer('id').primaryKey(), email: text('email').notNull().unique() });
const schema = { users };

const env = await setupOrmEnv({
  mode: 'mock',
  orm: 'drizzle',
  dialect: 'sqlite',
  schema,
  migrations: 'CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE);',
});
env.db.insert(users).values({ id: 1, email: 'a@x' }).run();
const rows = env.db.select().from(users).all();
await env.stop();
```

## Quick start — live Postgres via testcontainers (v0.2)

```ts
import { setupOrmEnv } from '@kiwa-test/orm';
import { pgTable, serial, text } from 'drizzle-orm/pg-core';

const users = pgTable('users', { id: serial('id').primaryKey(), email: text('email').notNull().unique() });
const schema = { users };

const env = await setupOrmEnv({
  mode: 'live',
  orm: 'drizzle',
  dialect: 'postgres',
  schema,
  migrations: 'CREATE TABLE users (id SERIAL PRIMARY KEY, email TEXT NOT NULL UNIQUE);',
  // Optional — override the Docker image. Default: postgres:16-alpine.
  containerImage: 'postgres:16-alpine',
});
await env.db.insert(users).values({ email: 'a@x' });
const rows = await env.db.select().from(users);
console.log(env.connectionUri); // postgres://...
await env.stop(); // closes pool + stops container
```

> live mode requires a working Docker daemon. The first `setupOrmEnv` call pulls `postgres:16-alpine` (~50 MB) and adds ~3-5 s startup per container.

## API

### `setupOrmEnv(opts)`

| `mode` | `orm` | `dialect` | Notes |
|---|---|---|---|
| `'mock'` | `'drizzle'` | `'sqlite'` | v0.1 — in-memory better-sqlite3 |
| `'live'` | `'drizzle'` | `'postgres'` | v0.2 — testcontainers Postgres |
| `'live'` | `'drizzle'` | `'mysql'` | v0.2.1 — testcontainers MySQL |
| `'mock'` | `'prisma'` | `'sqlite'` | v0.3 — tempdir SQLite + `prisma db push` |
| `'mock'` | `'kysely'` | `'sqlite'` | v0.4 — in-memory better-sqlite3 (this release) |
| `'live'` | `'kysely'` | `'postgres'` | v0.4 — testcontainers Postgres + pg (this release) |
| `'live'` | `'kysely'` | `'mysql'` | v0.4 — testcontainers MySQL + mysql2 (this release) |
| `'live'` | `'prisma'` | `'postgres'` / `'mysql'` | follow-up (CAR-293 残) |

Common options:

| Option | Type | Notes |
|---|---|---|
| `schema` | `Record<string, unknown>` | The object exported from your Drizzle schema file. |
| `migrations` | `string \| string[]` | Optional SQL applied sequentially before `seed`. |
| `seed` | `(db) => void \| Promise<void>` | Optional seed callback. Receives the dialect-appropriate Drizzle client. |
| `containerImage` (live only) | `string` | Docker image override. Default `postgres:16-alpine`. |

Returns the discriminated union `OrmTestEnvMock | OrmTestEnvLive` so callers can narrow on `mode` / `dialect`.

### `expectQuery(env, sql, expected, expect)` (async)

Runs raw SQL through the underlying driver (better-sqlite3 for mock, postgres.js for live) and asserts deep equality against `expected`.

### `expectRowCount(env, table, expected, expect)` (async)

Asserts that the row count of `table` equals `expected`.

## Design — Pattern A (Dependency Injection)

Production code stays thin around the ORM client; tests inject a fresh `setupOrmEnv` per test (isolation by default). Swapping `'mock'` → `'live'` in CI keeps the test API identical — only the dialect-specific SQL and error patterns differ.

## Limitations (v0.4)

- All 3 ORM brands supported (Drizzle / Prisma / Kysely). Prisma + testcontainers (Postgres/MySQL) lands in CAR-293 residual.
- Accepted combinations: `mock+drizzle+sqlite`, `live+drizzle+postgres`, `live+drizzle+mysql`, `mock+prisma+sqlite`, `mock+kysely+sqlite`, `live+kysely+postgres`, `live+kysely+mysql`. Other combinations throw a descriptive Error.
- Drizzle / Kysely migrations are SQL strings split on `;` followed by newline. Prisma migrations are applied via `prisma db push --schema=<schemaPath>`. File-based Drizzle migrations land in CAR-295.
- live mode requires a Docker daemon. CI runners that disable Docker should restrict their suite to `mode: 'mock'`.
- Prisma mode requires the caller to run `prisma generate` ahead of time and pass the resulting `PrismaClient` constructor — kiwa never invokes `prisma generate` itself.
- Kysely mode requires the caller to supply the phantom-typed `Database` interface (hand-written or `kysely-codegen` output).

## Related

- Skill: `/kiwa-orm` — generate Vitest tests from a Layer 1 spec.
- Layer 1: `/kiwa-design --layer orm-query`.
- Tracking Issue: [#527](https://github.com/cardene777/kiwa/issues/527) / Linear CAR-291.
