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
      serialIterations: 15,
      serialWarmup: 3,
      concurrency: 2,
      iterationsPerWorker: 3,
      memoryIterations: 15,
      ops: [
        {
          name: 'file_scaffold_workflow (setup + 20 writeFile + listFiles)',
          referenceKind: 'fs-write',
          regressionGateWaived: 'p10 の実行間の振れ幅が 35-110% で閾値 20% を大きく超える (#1718)',
          fn: async () => {
            const env = await setupCliEnv();
            for (let i = 0; i < 20; i++) await env.writeFile(`f-${i}.txt`, `c-${i}`);
            await env.listFiles();
            await env.stop();
          },
          serialP95CapMs: 500,
          // memory 軸の判定を外していたが、 #1730 で計測区間の前に空回しを入れて以降
          // 上限を跨がなくなったため戻した。 waiver 追加時の 118-199KB は再現しない
          // (#1719 で再測定)。
        },
        {
          name: 'batch_cli_run (5x echo test)',
          regressionGateWaived: '子 process の起動時間で p10 が 42-108% 動く (#1718)',
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
          referenceKind: 'fs-write',
          regressionGateWaived: 'p10 の実行間の振れ幅が 65-244% で閾値 20% を大きく超える (#1718)',
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
