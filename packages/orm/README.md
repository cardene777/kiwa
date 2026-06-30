# @kiwa-test/orm

<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-promo-en.gif" alt="kiwa 127s overview — generate full-spec tests across Web (Next.js) / Contract (Solidity) / dApp (Playwright) in 6 steps (this package covers the ORM query surface)" width="640" />
  <br />
  <sub>Full <a href="https://github.com/cardene777/kiwa">kiwa</a> overview (127s) — this package covers the ORM query test surface. <a href="https://github.com/cardene777/kiwa/blob/main/assets/kiwa-promo-en.mp4">▶ Full-quality MP4 (2.9 MB)</a>.</sub>
</p>

ORM query test adapter for kiwa.

## Overview

`@kiwa-test/orm` provides deterministic primitives for testing ORM-backed query layers without booting external infrastructure.

**v0.1 (this release)** — Drizzle ORM + in-memory SQLite (mock mode). Fast, Docker-free, type-safe.

**Roadmap** — Postgres / MySQL via testcontainers (#527-2), Prisma adapter (#527-3), Kysely adapter (#527-4), full example suite (#527-5).

## Install

```bash
pnpm add -D @kiwa-test/orm @kiwa-test/core drizzle-orm better-sqlite3 vitest
```

`drizzle-orm` and `better-sqlite3` are declared as `peerDependencies` so callers control the ORM and driver versions directly.

## Quick start

```ts
import { setupOrmEnv, expectQuery, expectRowCount } from '@kiwa-test/orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';

const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  email: text('email').notNull().unique(),
});
const schema = { users };

const MIGRATION = `
  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE
  );
`;

let env: Awaited<ReturnType<typeof setupOrmEnv<typeof schema>>> | null = null;

afterEach(async () => {
  if (env) {
    await env.stop();
    env = null;
  }
});

describe('users repository', () => {
  it('finds a user by email', async () => {
    env = await setupOrmEnv({
      mode: 'mock',
      orm: 'drizzle',
      dialect: 'sqlite',
      schema,
      migrations: MIGRATION,
      seed: (db) => {
        db.insert(users).values({ id: 1, email: 'alice@example.com' }).run();
      },
    });

    const rows = env.db.select().from(users).where(eq(users.email, 'alice@example.com')).all();
    expect(rows).toEqual([{ id: 1, email: 'alice@example.com' }]);

    expectRowCount(env, 'users', 1, expect);
  });
});
```

## API

### `setupOrmEnv(opts)`

| Option | Type | Notes |
|---|---|---|
| `mode` | `'mock'` | v0.1 only accepts `'mock'`. `'live'` (testcontainers) lands in #527-2. |
| `orm` | `'drizzle'` | v0.1 only accepts `'drizzle'`. `'prisma'` / `'kysely'` land in #527-3 / #527-4. |
| `dialect` | `'sqlite'` | v0.1 only accepts `'sqlite'`. `'postgres'` / `'mysql'` land with the testcontainers follow-up. |
| `schema` | `Record<string, unknown>` | The object exported from your Drizzle schema file. |
| `migrations` | `string \| string[]` | Optional SQL applied sequentially before `seed`. |
| `seed` | `(db) => void \| Promise<void>` | Optional seed callback that receives the live Drizzle client. |

Returns `{ mode, orm, dialect, db, raw, stop }`.

### `expectQuery(env, sql, expected, expect)`

Runs raw SQL against the underlying `better-sqlite3` connection and asserts deep equality against `expected`. Convenient for ad-hoc verification when you do not want to commit to a particular Drizzle query shape.

### `expectRowCount(env, table, expected, expect)`

Asserts that the row count of `table` equals `expected`.

## Design — Pattern A (Dependency Injection)

`@kiwa-test/orm` follows the same Pattern A used by `@kiwa-test/api` / `@kiwa-test/nuxt` / `@kiwa-test/nextjs` / etc.

- Production code stays thin around the ORM client.
- Tests inject a fresh `setupOrmEnv` per test (isolation by default).
- `mode` / `orm` / `dialect` are explicit, so swapping `'mock'` → `'live'` (Postgres via testcontainers) in #527-2 will not require rewriting tests.

## Limitations (v0.1)

- Only Drizzle ORM and in-memory SQLite are supported. Other ORMs / dialects throw on `setupOrmEnv`.
- Migrations are SQL strings split on `;` followed by newline. Use `drizzle-orm`'s own `migrate()` for production migration files (follow-up Issue).
- No connection pooling / parallel-write semantics — each `setupOrmEnv` call returns an isolated in-memory database.

## Related

- Skill: `/kiwa-orm` — generate Vitest tests from a Layer 1 spec.
- Layer 1: `/kiwa-design --layer orm-query`.
- Tracking Issue: [#527](https://github.com/cardene777/kiwa/issues/527).
