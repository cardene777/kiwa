/**
 * fidelity test v2.1 — 10 case = apply / rollback / duplicate / sort / history +
 * lock / dry-run / dependency / destructive detect / dep resolve error。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import {
  createMigrationClient,
  runUp,
  runDown,
  applyPendingMigrations,
  listAppliedMigrations,
  createLockRegistry,
  planDryRun,
  resolveDependencyOrder,
  type Migration,
  type MigrationWithDeps,
} from '../../src/index.js';

function referenceMigrationStore() {
  const applied = new Map<string, 'applied' | 'rolled_back'>();
  return {
    apply(id: string) {
      if (applied.get(id) === 'applied') return 'already';
      applied.set(id, 'applied');
      return 'applied';
    },
    rollback(id: string) {
      if (!applied.has(id)) return 'not_applied';
      applied.set(id, 'rolled_back');
      return 'rolled_back';
    },
    count() {
      return applied.size;
    },
  };
}

const m = (id: string, up: string = 'up', down: string = 'down'): Migration => ({ id, name: `m_${id}`, up, down });

describe('migration client fidelity v2.1', () => {
  it('runUp = apply 状態を返す (mock ↔ reference)', async () => {
    const mock = createMigrationClient({ provider: 'prisma' });
    const real = referenceMigrationStore();
    const result = await assertFidelity({
      mockFn: async (id: string) => runUp(mock, m(id)).status,
      realFn: async (id: string) => real.apply(id),
      cases: [{ name: 'first apply', args: ['001'] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('二重 runUp で「already applied」 相当を返す', () => {
    const mock = createMigrationClient({ provider: 'drizzle' });
    runUp(mock, m('001'));
    const second = runUp(mock, m('001'));
    expect(second.status).toBe('applied');
    expect(second.reason).toBe('already applied');
  });

  it('applyPendingMigrations が sort + skip を正しく処理', () => {
    const mock = createMigrationClient({ provider: 'kysely' });
    runUp(mock, m('001'));
    const result = applyPendingMigrations(mock, [m('003'), m('001'), m('002')]);
    expect(result.applied.map((r) => r.id)).toEqual(['002', '003']);
    expect(result.skipped).toEqual(['001']);
  });

  it('runDown で applied status が rolled_back に変わる', () => {
    const mock = createMigrationClient({ provider: 'knex' });
    runUp(mock, m('010'));
    const result = runDown(mock, '010');
    expect(result.status).toBe('rolled_back');
    const history = listAppliedMigrations(mock);
    expect(history.rolledBack.length).toBe(1);
    expect(history.applied.length).toBe(0);
  });

  it('listAppliedMigrations の latestApplied = 最新 appliedAt', () => {
    let clock = 100;
    const mock = createMigrationClient({ provider: 'prisma', now: () => (clock += 10) });
    runUp(mock, m('001'));
    runUp(mock, m('002'));
    const history = listAppliedMigrations(mock);
    expect(history.latestApplied?.id).toBe('002');
    expect(history.total).toBe(2);
  });

  it('lock registry = acquire + release で同 scope の再取得可能', () => {
    let t = 0;
    const reg = createLockRegistry(() => t);
    const lock = reg.acquire('schema', 'worker-1', 1000);
    expect(lock).not.toBeNull();
    const conflict = reg.acquire('schema', 'worker-2', 1000);
    expect(conflict).toBeNull();
    expect(reg.release('schema', 'worker-1')).toBe(true);
    const reacquire = reg.acquire('schema', 'worker-2', 1000);
    expect(reacquire).not.toBeNull();
  });

  it('lock TTL 期限切れで別 owner が acquire できる', () => {
    let t = 0;
    const reg = createLockRegistry(() => t);
    reg.acquire('schema', 'owner-a', 100);
    t = 200;
    const late = reg.acquire('schema', 'owner-b', 100);
    expect(late).not.toBeNull();
    expect(reg.listActive().length).toBe(1);
  });

  it('planDryRun = destructive statement を検出', () => {
    const plan = planDryRun([
      m('001', 'CREATE TABLE users (id INT)'),
      m('002', 'DROP TABLE audit_log'),
      m('003', 'ALTER TABLE users ADD COLUMN name TEXT'),
    ]);
    expect(plan.totalSteps).toBe(3);
    expect(plan.destructiveCount).toBe(1);
    expect(plan.operations[1]!.estimated).toBe('destructive');
    expect(plan.operations[0]!.estimated).toBe('safe');
  });

  it('planDryRun direction=down = down SQL で risk 評価', () => {
    const plan = planDryRun(
      [m('001', 'CREATE TABLE u', 'DROP TABLE u')],
      'down',
    );
    expect(plan.operations[0]!.sql).toBe('DROP TABLE u');
    expect(plan.destructiveCount).toBe(1);
  });

  it('resolveDependencyOrder = topological order で並び替え', () => {
    const migrations: MigrationWithDeps[] = [
      { id: 'c', name: 'c', up: '', down: '', dependsOn: ['a', 'b'] },
      { id: 'a', name: 'a', up: '', down: '' },
      { id: 'b', name: 'b', up: '', down: '', dependsOn: ['a'] },
    ];
    const ordered = resolveDependencyOrder(migrations);
    const idx = (id: string) => ordered.findIndex((m) => m.id === id);
    expect(idx('a')).toBeLessThan(idx('b'));
    expect(idx('b')).toBeLessThan(idx('c'));
  });

  it('resolveDependencyOrder = 循環依存で throw', () => {
    const migrations: MigrationWithDeps[] = [
      { id: 'x', name: 'x', up: '', down: '', dependsOn: ['y'] },
      { id: 'y', name: 'y', up: '', down: '', dependsOn: ['x'] },
    ];
    expect(() => resolveDependencyOrder(migrations)).toThrow(/cyclic/);
  });
});
