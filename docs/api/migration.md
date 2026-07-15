# @kiwa-lab/migration API reference

## Overview

`@kiwa-lab/migration` は Prisma / Drizzle / Kysely / Knex 4 migration lib を統一 interface で mock する DB migration test infra。 up/down + schema diff + pending applied を real DB 不要で叩ける。

## Supported providers

| provider | migration file | up/down | schema diff |
|---|---|---|---|
| prisma | `prisma/migrations/*/migration.sql` | 自動生成 | Prisma schema diff |
| drizzle | `drizzle/*.sql` + snapshot | 手動記述 | drizzle-kit diff |
| kysely | `db/migrations/*.ts` | 手動記述 | kysely-codegen |
| knex | `migrations/*.js` | knex.schema | schema builder |

## Main API

### `createMigrationClient(options): MigrationClient`

provider 別 mock client、 initial schema + migration 一覧を register。

### `runUp(client, migrationId: string): MigrationResult`

指定 migration の up を実行、 `{ status: 'applied' | 'failed', schema, elapsedMs }` を返す。

### `runDown(client, migrationId: string): MigrationResult`

down (rollback) を実行、 schema を prev state に戻す。

### `applyPendingMigrations(client): ApplyPendingResult`

未適用 migration を順次 up、 `{ applied: [{id, elapsedMs}], failed?, finalSchema }`。

### `diffSchema(prev: Schema, next: Schema): SchemaDiff`

schema 差分を抽出、 `{ tablesAdded, tablesDropped, columnsAdded, columnsDropped, columnsChanged }`。

### `listAppliedMigrations(client): MigrationHistory`

history table 相当を snapshot、 `[{ id, appliedAt, checksum }]`。

## Types

- `MigrationProvider = 'prisma' | 'drizzle' | 'kysely' | 'knex'`
- `Migration` = `{ id, up: string | ((db) => void), down: string | ((db) => void), checksum? }`
- `MigrationStatus = 'pending' | 'applied' | 'failed'`
- `Schema` = `{ tables: SchemaTable[] }`
- `SchemaTable` = `{ name, columns: SchemaColumn[], indexes?, constraints? }`

## Usage examples

### Up / down round trip

```typescript
import { createMigrationClient, runUp, runDown, listAppliedMigrations } from '@kiwa-lab/migration';
import { describe, expect, it } from 'vitest';

describe('add email_verified column', () => {
  it('up で column 追加 + down で rollback', () => {
    const client = createMigrationClient({
      provider: 'drizzle',
      initialSchema: { tables: [{ name: 'users', columns: [{ name: 'id', type: 'text', primaryKey: true }] }] },
      migrations: [{
        id: '20260715_add_email_verified',
        up: 'ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false',
        down: 'ALTER TABLE users DROP COLUMN email_verified',
      }],
    });
    const up = runUp(client, '20260715_add_email_verified');
    expect(up.status).toBe('applied');
    expect(up.schema.tables[0].columns.some((c) => c.name === 'email_verified')).toBe(true);
    const history = listAppliedMigrations(client);
    expect(history).toHaveLength(1);
    runDown(client, '20260715_add_email_verified');
    expect(listAppliedMigrations(client)).toHaveLength(0);
  });
});
```

### Schema diff

```typescript
import { diffSchema } from '@kiwa-lab/migration';

const prev = { tables: [{ name: 'users', columns: [{ name: 'id', type: 'text' }] }] };
const next = { tables: [{ name: 'users', columns: [{ name: 'id', type: 'text' }, { name: 'email', type: 'text' }] }, { name: 'posts', columns: [{ name: 'id', type: 'text' }] }] };
const diff = diffSchema(prev, next);
expect(diff.tablesAdded).toEqual(['posts']);
expect(diff.columnsAdded).toEqual([{ table: 'users', column: 'email' }]);
```

## Related skills

- [`/kiwa-migration`](../skills/kiwa-migration) — DB migration test 生成 skill
