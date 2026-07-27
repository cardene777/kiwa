# @kiwa-lab/migration

DB migration mock harness for kiwa — Prisma / Drizzle / Kysely / Knex を統一 interface で in-process から叩ける test infra。

## Installation

```bash
pnpm add -D @kiwa-lab/migration
# or
npm install -D @kiwa-lab/migration
# or
yarn add -D @kiwa-lab/migration
```

## Supported providers

| Provider | Status | Migration style |
|---|---|---|
| Prisma | ✅ Ready | migration_lock + SQL steps |
| Drizzle | ✅ Ready | journal + snapshot |
| Kysely | ✅ Ready | numeric prefix TS |
| Knex | ✅ Ready | up/down JS |

## Quick start

```ts
import { describe, expect, it } from 'vitest';
import {
  createMigrationClient,
  runUp,
  runDown,
  diffSchema,
  listAppliedMigrations,
} from '@kiwa-lab/migration';

describe('user table migration', () => {
  it('up → down で schema が初期状態に戻る', async () => {
    const client = createMigrationClient({ provider: 'prisma' });
    const m = { id: '001', up: 'CREATE TABLE users (id INT)', down: 'DROP TABLE users' };
    await runUp(client, m);
    expect(listAppliedMigrations(client).map((r) => r.id)).toEqual(['001']);
    await runDown(client, m);
    expect(listAppliedMigrations(client)).toEqual([]);
  });
});
```

## API reference

- `createMigrationClient({ provider: MigrationProvider }): MigrationClient` — provider 別 mock
- `runUp(client, migration: Migration): Promise<MigrationResult>` — 1 migration 前進
- `runDown(client, migration: Migration): Promise<MigrationResult>` — 1 migration 後退
- `applyPendingMigrations(client, pending: Migration[]): Promise<ApplyPendingResult>` — 全 pending 順次適用
- `diffSchema(prev: Schema, next: Schema): SchemaDiff` — 前後 schema 差分
- `listAppliedMigrations(client): MigrationRecord[]` — history 取得

## Test integration

vitest + `/kiwa-migration` skill で real DB 起動なしで schema evolution を verify。

<!-- kiwa-docs:start -->
## Documentation

公開ドキュメントを正本として管理しています。

- [概要](https://cardene777.github.io/kiwa/libraries/services/migration/)
- [はじめる](https://cardene777.github.io/kiwa/libraries/services/migration/quickstart)
- [使い方](https://cardene777.github.io/kiwa/libraries/services/migration/how-to)
- [リファレンス](https://cardene777.github.io/kiwa/libraries/services/migration/reference)

編集元は [docs/libraries/services/migration](../../docs/libraries/services/migration/) です。
<!-- kiwa-docs:end -->

## License

UNLICENSED — see [github.com/cardene777/kiwa](https://github.com/cardene777/kiwa).
