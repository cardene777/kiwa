import { describe, expect, it } from 'vitest';
import {
  applyPendingMigrations,
  createMigrationClient,
  diffSchema,
  listAppliedMigrations,
  planDryRun,
  runDown,
  runUp,
} from '../src/index.js';

describe('library documentation migration recipes', () => {
  it('applies a migration, rolls it back, and reports an unapplied id', () => {
    const client = createMigrationClient({ provider: 'drizzle' });
    const migration = { id: '001', name: 'create users', up: 'CREATE TABLE users (id INT)', down: 'DROP TABLE users' };

    expect(runUp(client, migration).status).toBe('applied');
    expect(listAppliedMigrations(client).applied.map((record) => record.id)).toEqual(['001']);
    expect(runDown(client, migration.id).status).toBe('rolled_back');
    expect(listAppliedMigrations(client)).toMatchObject({ applied: [], rolledBack: [{ id: '001' }] });
    expect(runDown(client, '404')).toMatchObject({ status: 'failed', reason: 'not applied' });
  });

  it('sorts pending migrations and retains only unapplied history after rollback', () => {
    const client = createMigrationClient({ provider: 'kysely' });
    const result = applyPendingMigrations(client, [
      { id: '020', name: 'add email', up: 'ALTER TABLE users ADD email TEXT', down: 'ALTER TABLE users DROP email' },
      { id: '010', name: 'create users', up: 'CREATE TABLE users (id INT)', down: 'DROP TABLE users' },
    ]);

    expect(result.applied.map((item) => item.id)).toEqual(['010', '020']);
    expect(result.failed).toEqual([]);
    expect(runDown(client, '020').status).toBe('rolled_back');
    expect(listAppliedMigrations(client)).toMatchObject({ applied: [{ id: '010' }], rolledBack: [{ id: '020' }] });
  });

  it('reports schema changes and labels destructive SQL before execution', () => {
    const schema = diffSchema(
      { tables: [{ name: 'users', columns: [{ name: 'id', type: 'INT', nullable: false }] }] },
      { tables: [{ name: 'users', columns: [{ name: 'id', type: 'BIGINT', nullable: false }, { name: 'email', type: 'TEXT', nullable: true }] }] },
    );
    const plan = planDryRun([{ id: '030', name: 'remove logs', up: 'DROP TABLE logs', down: 'CREATE TABLE logs (id INT)' }]);

    expect(schema.columnDiffs).toEqual([
      expect.objectContaining({ column: 'id', change: 'type_changed' }),
      expect.objectContaining({ column: 'email', change: 'added' }),
    ]);
    expect(plan).toMatchObject({ destructiveCount: 1, operations: [{ id: '030', estimated: 'destructive' }] });
  });
});
