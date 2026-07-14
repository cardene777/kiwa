/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseSpec } from '../../src/index.js';

const MODULE = 'dapp-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

const SPEC_MD = `# dApp Spec\n\n- module: wallet-connect\n- layer: e2e\n\n| id | observation | given | when | then |\n|----|-------------|-------|------|------|\n| T-1 | connect | wallet | click connect | address shown |\n| T-2 | switch chain | connected | click switch | chain updated |\n| T-3 | disconnect | connected | click disconnect | disconnected |`;

describe('dapp app scenario perf (real workload)', () => {
  it('3-layer perf: dapp spec parsing / bulk parsing / spec integration', async () => {
    const result = await runPerf3Layer({
      moduleName: MODULE,
      reportPath: REPORT_PATH,
      serialIterations: 30,
      serialWarmup: 5,
      concurrency: 4,
      iterationsPerWorker: 8,
      memoryIterations: 30,
      ops: [
        {
          name: 'dapp_spec_parse (10 parseSpec of wallet spec)',
          fn: () => {
            for (let i = 0; i < 10; i++) parseSpec(SPEC_MD);
          },
          serialP95CapMs: 30,
        },
        {
          name: 'bulk_dapp_spec_parse (50 parseSpec rapid)',
          fn: () => {
            for (let i = 0; i < 50; i++) parseSpec(SPEC_MD);
          },
          serialP95CapMs: 50,
        },
        {
          name: 'dapp_spec_with_module_override (10 parseSpec with opts.module)',
          fn: () => {
            for (let i = 0; i < 10; i++) parseSpec(SPEC_MD, { module: `wallet-${i}` });
          },
          serialP95CapMs: 30,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
