/**
 * skill test — migration skill が主要 API 群 (createMigrationClient / runUp / runDown /
 * applyPendingMigrations / diffSchema / listAppliedMigrations) を全公開 + 4 provider 分岐する
 * ことを assertion。
 */
import { describe, expect, it } from 'vitest';
import {
  createMigrationClient,
  runUp,
  runDown,
  applyPendingMigrations,
  diffSchema,
  listAppliedMigrations,
  type Migration,
  type Schema,
} from '../../src/index.js';

const M = (id: string): Migration => ({ id, name: `m_${id}`, up: `CREATE ${id}`, down: `DROP ${id}` });

describe('migration skill assertions', () => {
  it('createMigrationClient を 4 provider (prisma/drizzle/kysely/knex) 全てで instantiate 可能', () => {
    for (const provider of ['prisma', 'drizzle', 'kysely', 'knex'] as const) {
      const client = createMigrationClient({ provider });
      expect(client.provider).toBe(provider);
      expect(Array.isArray(client.applied)).toBe(true);
    }
  });

  it('runUp + runDown で status transition (applied → rolled_back)', () => {
    const client = createMigrationClient({ provider: 'prisma' });
    const up = runUp(client, M('001'));
    expect(up.status).toBe('applied');
    const down = runDown(client, '001');
    expect(down.status).toBe('rolled_back');
  });

  it('applyPendingMigrations が 空 array で {applied:[], skipped:[], failed:[]} を返す', () => {
    const client = createMigrationClient({ provider: 'drizzle' });
    const result = applyPendingMigrations(client, []);
    expect(result.applied).toEqual([]);
    expect(result.skipped).toEqual([]);
    expect(result.failed).toEqual([]);
  });

  it('diffSchema で added / removed / column_changed を全 branch 検出', () => {
    const prev: Schema = {
      tables: [
        { name: 'a', columns: [{ name: 'id', type: 'int', nullable: false }] },
        { name: 'b', columns: [{ name: 'id', type: 'int', nullable: false }] },
      ],
    };
    const next: Schema = {
      tables: [
        { name: 'a', columns: [{ name: 'id', type: 'bigint', nullable: true }] },
        { name: 'c', columns: [{ name: 'id', type: 'int', nullable: false }] },
      ],
    };
    const diff = diffSchema(prev, next);
    expect(diff.addedTables).toContain('c');
    expect(diff.removedTables).toContain('b');
    const changes = diff.columnDiffs.map((c) => c.change);
    expect(changes).toContain('type_changed');
    expect(changes).toContain('nullable_changed');
  });

  it('listAppliedMigrations が category (applied/rolledBack/failed) を集計', () => {
    const client = createMigrationClient({ provider: 'knex' });
    runUp(client, M('001'));
    runUp(client, M('002'));
    runDown(client, '001');
    client.markFailed(M('003'), 'syntax error');
    const history = listAppliedMigrations(client);
    expect(history.applied.length).toBe(1);
    expect(history.rolledBack.length).toBe(1);
    expect(history.failed.length).toBe(1);
    expect(history.total).toBe(3);
  });
});
