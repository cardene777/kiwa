/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { setupCliEnv } from '../../src/index.js';

const MODULE = 'cli-test-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('cli-test app scenario perf (real workload)', () => {
  it('3-layer perf: file scaffold / batch cli run / cleanup cycle', async () => {
    const result = await runPerf3Layer({
      moduleName: MODULE,
      requireGc: true,
      reportPath: REPORT_PATH,
      serialIterations: 173,
      serialWarmup: 17,
      concurrency: 2,
      iterationsPerWorker: 3,
      memoryIterations: 15,
      ops: [
        {
          name: 'file_scaffold_workflow (setup + 20 writeFile + listFiles)',
          fn: async () => {
            const env = await setupCliEnv();
            for (let i = 0; i < 20; i++) await env.writeFile(`f-${i}.txt`, `c-${i}`);
            await env.listFiles();
            await env.stop();
          },
          serialP95CapMs: 500,
        },
        {
          name: 'batch_cli_run (5x echo test)',
          fn: async () => {
            const env = await setupCliEnv();
            for (let i = 0; i < 5; i++) {
              const r = await env.runCli({ cmd: 'echo', args: [`test-${i}`] });
              if (r.exitCode !== 0) throw new Error('cli fail');
            }
            await env.stop();
          },
          serialP95CapMs: 1000,
        },
        {
          name: 'setup_cleanup_cycle (5 sequential setup+stop)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              const env = await setupCliEnv();
              await env.writeFile('quick.txt', 'x');
              await env.stop();
            }
          },
          serialP95CapMs: 500,
        },
      ],
    });
    expect(result.allPassed).toBe(true);
  });
});
