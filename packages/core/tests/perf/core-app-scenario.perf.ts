/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseSpec, createPool } from '../../src/index.js';

const MODULE = 'core-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

const SAMPLE_SPEC = `# Spec\n\n- module: mod\n- layer: unit\n\n| id | observation | given | when | then |\n|----|-------------|-------|------|------|\n| T-1 | ok | in | call | out |\n| T-2 | err | in | call | err |\n| T-3 | edge | in | call | edge |`;

describe('core app scenario perf (real workload)', () => {
  it('3-layer perf: spec parsing / pool borrow-release / spec+pool integration', async () => {
    const result = await runPerf3Layer({
      moduleName: MODULE,
      requireGc: true,
      reportPath: REPORT_PATH,
      serialIterations: 30,
      serialWarmup: 5,
      concurrency: 4,
      iterationsPerWorker: 8,
      memoryIterations: 30,
      ops: [
        {
          name: 'spec_parsing (50 parseSpec of typical spec)',
          fn: () => {
            for (let i = 0; i < 50; i++) parseSpec(SAMPLE_SPEC);
          },
          serialP95CapMs: 50,
        },
        {
          name: 'pool_lifecycle (create + 10 borrow/release + stopAll)',
          fn: async () => {
            const pool = await createPool<number>({ size: 5, acquire: async () => Math.random() });
            for (let i = 0; i < 10; i++) {
              const lease = await pool.borrow();
              await lease.release();
            }
            await pool.stopAll();
          },
          serialP95CapMs: 50,
        },
        {
          name: 'spec_pool_integration (parseSpec + pool per case)',
          fn: async () => {
            const doc = parseSpec(SAMPLE_SPEC);
            const pool = await createPool<string>({ size: doc.cases.length, acquire: async () => 'r' });
            for (const c of doc.cases) {
              const lease = await pool.borrow();
              if (!lease.value) throw new Error(`case ${c.id} pool fail`);
              await lease.release();
            }
            await pool.stopAll();
          },
          serialP95CapMs: 50,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
