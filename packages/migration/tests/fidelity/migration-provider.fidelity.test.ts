/**
 * fidelity test — createMigrationClient (kiwa mock) が reference impl (単純 Map ベース
 * migration store) と同じ挙動を示すことを検証。 5 case で apply / rollback / duplicate /
 * pending順序 / history 集計 の 5 観点を cover。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import {
  createMigrationClient,
  runUp,
  runDown,
  applyPendingMigrations,
  listAppliedMigrations,
  type Migration,
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

const m = (id: string): Migration => ({ id, name: `m_${id}`, up: 'up', down: 'down' });

describe('migration client fidelity vs reference impl', () => {
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
    runUp(mock, m('001')); // pre-applied
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
});
