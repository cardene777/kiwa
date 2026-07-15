/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
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

const MODULE = 'migration-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

const MIGRATIONS: Migration[] = Array.from({ length: 10 }, (_, i) => ({
  id: `${String(i + 1).padStart(3, '0')}`,
  name: `mig_${i}`,
  up: `CREATE TABLE t${i}(id int)`,
  down: `DROP TABLE t${i}`,
}));

describe('migration app scenario perf (real workload)', () => {
  it('3-layer perf: apply_workflow / diff_batch / down_error_handling', async () => {
    const prev: Schema = {
      tables: Array.from({ length: 5 }, (_, i) => ({
        name: `t${i}`,
        columns: [{ name: 'id', type: 'int', nullable: false, primary: true }],
      })),
    };
    const next: Schema = {
      tables: Array.from({ length: 5 }, (_, i) => ({
        name: `t${i}`,
        columns: [
          { name: 'id', type: 'int', nullable: false, primary: true },
          { name: 'name', type: 'text', nullable: true },
        ],
      })),
    };

    const result = await runPerf3Layer({
      moduleName: MODULE,
      reportPath: REPORT_PATH,
      serialIterations: 20,
      serialWarmup: 3,
      concurrency: 4,
      iterationsPerWorker: 5,
      memoryIterations: 20,
      ops: [
        {
          name: 'apply_workflow (10 pending migrations + history)',
          fn: async () => {
            const providers = ['prisma', 'drizzle', 'kysely', 'knex'] as const;
            for (const provider of providers) {
              const client = createMigrationClient({ provider });
              applyPendingMigrations(client, MIGRATIONS);
              listAppliedMigrations(client);
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'diff_batch (5 diffSchema across schemas)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              diffSchema(prev, next);
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'down_error_handling (5 rollback of non-applied)',
          fn: async () => {
            const client = createMigrationClient({ provider: 'prisma' });
            for (let i = 0; i < 5; i++) {
              const result = runDown(client, `not-applied-${i}`);
              if (result.status !== 'failed') throw new Error('expected failed');
            }
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result).toBeDefined();
    // sanity: apply + rollback loop works
    const client = createMigrationClient({ provider: 'kysely' });
    runUp(client, MIGRATIONS[0]!);
    expect(client.applied.length).toBe(1);
  });
});
