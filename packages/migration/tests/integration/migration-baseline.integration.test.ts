/**
 * integration test v2.1 — 10 case = apply/rollback/diff workflow + lock coordination
 * + dry-run gate + dependency-resolved apply + destructive block。
 */
import { describe, expect, it } from 'vitest';
import {
  createMigrationClient,
  runUp,
  runDown,
  applyPendingMigrations,
  diffSchema,
  listAppliedMigrations,
  createLockRegistry,
  planDryRun,
  resolveDependencyOrder,
  type Migration,
  type MigrationWithDeps,
  type Schema,
} from '../../src/index.js';

const M = (id: string, table: string, upSql?: string, downSql?: string): Migration => ({
  id,
  name: `create_${table}`,
  up: upSql ?? `CREATE TABLE ${table}(id int)`,
  down: downSql ?? `DROP TABLE ${table}`,
});

describe('migration integration v2.1 — end-to-end workflow', () => {
  it('T-INT-M-001 pending migrations 3 件を一括 apply → history に反映', () => {
    const client = createMigrationClient({ provider: 'prisma' });
    const result = applyPendingMigrations(client, [M('001', 'u'), M('002', 'p'), M('003', 'c')]);
    expect(result.applied.length).toBe(3);
    const history = listAppliedMigrations(client);
    expect(history.applied.length).toBe(3);
    expect(history.latestApplied?.id).toBe('003');
  });

  it('T-INT-M-002 apply → rollback → 再 apply で status transition', () => {
    const client = createMigrationClient({ provider: 'drizzle' });
    runUp(client, M('001', 'u'));
    runDown(client, '001');
    const reapply = runUp(client, M('001', 'u'));
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

  it('T-INT-M-006 lock coordinate = worker A が握った lock で worker B の apply を block', () => {
    let t = 0;
    const reg = createLockRegistry(() => t);
    const client = createMigrationClient({ provider: 'prisma' });
    const lockA = reg.acquire('migration', 'worker-a', 5000);
    expect(lockA).not.toBeNull();
    const lockB = reg.acquire('migration', 'worker-b', 5000);
    expect(lockB).toBeNull();
    runUp(client, M('001', 'u'));
    reg.release('migration', 'worker-a');
    const lockBRetry = reg.acquire('migration', 'worker-b', 5000);
    expect(lockBRetry).not.toBeNull();
  });

  it('T-INT-M-007 dry-run gate = destructive migration を実 apply 前に検知', () => {
    const pending = [M('001', 'u'), M('002', 'audit', 'DROP TABLE audit', 'CREATE TABLE audit')];
    const plan = planDryRun(pending);
    expect(plan.destructiveCount).toBe(1);
    if (plan.destructiveCount > 0) {
      // production では abort、 本 test では確認のみ
      expect(plan.operations[1]!.estimated).toBe('destructive');
    }
  });

  it('T-INT-M-008 dependency-resolved apply = topo order で pending 適用', () => {
    const client = createMigrationClient({ provider: 'drizzle' });
    const migrations: MigrationWithDeps[] = [
      { id: '003', name: 'c', up: '', down: '', dependsOn: ['001', '002'] },
      { id: '001', name: 'a', up: '', down: '' },
      { id: '002', name: 'b', up: '', down: '', dependsOn: ['001'] },
    ];
    const ordered = resolveDependencyOrder(migrations);
    const result = applyPendingMigrations(client, ordered);
    expect(result.applied.map((r) => r.id)).toEqual(['001', '002', '003']);
  });

  it('T-INT-M-009 rollback all workflow = 直前 3 migration を LIFO で戻す', () => {
    const client = createMigrationClient({ provider: 'kysely' });
    applyPendingMigrations(client, [M('001', 'u'), M('002', 'p'), M('003', 'c')]);
    const rev = runDown(client, '003');
    const rev2 = runDown(client, '002');
    const rev3 = runDown(client, '001');
    expect(rev.status).toBe('rolled_back');
    expect(rev2.status).toBe('rolled_back');
    expect(rev3.status).toBe('rolled_back');
    const history = listAppliedMigrations(client);
    expect(history.applied.length).toBe(0);
    expect(history.rolledBack.length).toBe(3);
  });

  it('T-INT-M-010 diff → migration 生成 gate = 差分あり時のみ pending 追加', () => {
    const prev: Schema = { tables: [{ name: 'u', columns: [{ name: 'id', type: 'int', nullable: false }] }] };
    const next: Schema = { tables: [{ name: 'u', columns: [{ name: 'id', type: 'int', nullable: false }] }] };
    const diffSame = diffSchema(prev, next);
    expect(diffSame.addedTables.length).toBe(0);
    expect(diffSame.columnDiffs.length).toBe(0);
    const changed: Schema = { tables: [{ name: 'u', columns: [{ name: 'id', type: 'bigint', nullable: false }] }] };
    const diffChanged = diffSchema(prev, changed);
    expect(diffChanged.columnDiffs.length).toBeGreaterThan(0);
  });
});
