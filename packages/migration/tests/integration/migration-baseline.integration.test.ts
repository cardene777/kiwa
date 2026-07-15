/**
 * integration test — migration domain の end-to-end workflow (initial schema →
 * apply pending → diff → rollback → new pending 追加 → 再 apply) を 5 case で cover。
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

const M = (id: string, table: string): Migration => ({
  id,
  name: `create_${table}`,
  up: `CREATE TABLE ${table}(id int)`,
  down: `DROP TABLE ${table}`,
});

describe('migration integration — end-to-end apply/rollback/diff workflow', () => {
  it('T-INT-M-001 pending migrations 3 件を一括 apply → history に反映', () => {
    const client = createMigrationClient({ provider: 'prisma' });
    const result = applyPendingMigrations(client, [M('001', 'u'), M('002', 'p'), M('003', 'c')]);
    expect(result.applied.length).toBe(3);
    const history = listAppliedMigrations(client);
    expect(history.applied.length).toBe(3);
    expect(history.latestApplied?.id).toBe('003');
  });

  it('T-INT-M-002 apply → rollback → 再 apply で status transition が正しい', () => {
    const client = createMigrationClient({ provider: 'drizzle' });
    runUp(client, M('001', 'u'));
    runDown(client, '001');
    const reapply = runUp(client, M('001', 'u'));
    // rolled_back record が残るので new apply record が別途追加される
    expect(reapply.status).toBe('applied');
    const history = listAppliedMigrations(client);
    expect(history.applied.length).toBe(1);
    expect(history.rolledBack.length).toBe(1);
  });

  it('T-INT-M-003 seedApplied で pre-existing migration を skip', () => {
    const client = createMigrationClient({
      provider: 'kysely',
      seedApplied: [{ id: '001', name: 'existing', status: 'applied', appliedAt: 100 }],
    });
    const result = applyPendingMigrations(client, [M('001', 'u'), M('002', 'p')]);
    expect(result.skipped).toEqual(['001']);
    expect(result.applied.map((r) => r.id)).toEqual(['002']);
  });

  it('T-INT-M-004 schema diff が added / removed / column change 全 branch を検出', () => {
    const prev: Schema = {
      tables: [{ name: 'users', columns: [{ name: 'id', type: 'int', nullable: false, primary: true }] }],
    };
    const next: Schema = {
      tables: [
        { name: 'users', columns: [
          { name: 'id', type: 'bigint', nullable: false, primary: true },
          { name: 'email', type: 'text', nullable: false, unique: true },
        ] },
        { name: 'posts', columns: [{ name: 'id', type: 'int', nullable: false }] },
      ],
    };
    const diff = diffSchema(prev, next);
    expect(diff.addedTables).toEqual(['posts']);
    expect(diff.removedTables).toEqual([]);
    const changes = diff.columnDiffs.filter((c) => c.table === 'users');
    expect(changes.some((c) => c.change === 'type_changed')).toBe(true);
    expect(changes.some((c) => c.change === 'added' && c.column === 'email')).toBe(true);
  });

  it('T-INT-M-005 4 provider それぞれで applyPending が独立に動く', () => {
    const providers = ['prisma', 'drizzle', 'kysely', 'knex'] as const;
    const migrations = [M('001', 'u'), M('002', 'p')];
    for (const provider of providers) {
      const client = createMigrationClient({ provider });
      const result = applyPendingMigrations(client, migrations);
      expect(result.applied.length).toBe(2);
      expect(client.provider).toBe(provider);
    }
  });
});
