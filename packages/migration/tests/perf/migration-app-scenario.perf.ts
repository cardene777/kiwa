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
  createLockRegistry,
  planDryRun,
  resolveDependencyOrder,
  type Migration,
  type MigrationWithDeps,
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

describe('migration app scenario perf v2.1 (real workload)', () => {
  it('5-op perf: apply / diff / down_error / lock / dry-run+deps', async () => {
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
      requireGc: true,
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
        {
          name: 'lock_acquire_release_batch (10 acquire-release cycle)',
          fn: async () => {
            let t = 0;
            const reg = createLockRegistry(() => (t += 1));
            for (let i = 0; i < 10; i++) {
              const lock = reg.acquire(`m-${i}`, 'w', 1000);
              if (!lock) throw new Error('lock acquire failed');
              reg.release(`m-${i}`, 'w');
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'dryrun_dep_batch (5 plan + resolve)',
          fn: async () => {
            const migs: MigrationWithDeps[] = Array.from({ length: 5 }, (_, i) => ({
              id: `d${i}`,
              name: `d${i}`,
              up: i === 2 ? `DROP TABLE t${i}` : `CREATE TABLE t${i} (id int)`,
              down: '',
              dependsOn: i === 0 ? [] : [`d${i - 1}`],
            }));
            for (let i = 0; i < 5; i++) {
              const plan = planDryRun(migs);
              const ordered = resolveDependencyOrder(migs);
              if (plan.totalSteps !== 5 || ordered.length !== 5) throw new Error('unexpected sizes');
            }
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result.allPassed).toBe(true);
    const client = createMigrationClient({ provider: 'kysely' });
    runUp(client, MIGRATIONS[0]!);
    expect(client.applied.length).toBe(1);
  });
});
