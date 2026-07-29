/// <reference types="vitest/globals" />
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runSpecToTest } from '../../src/commands/spec-to-test.js';
import { runInit, InitConflictError } from '../../src/commands/init.js';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import { describe, expect, it } from 'vitest';

const MODULE = 'cli-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

const SPEC_MD = `# Sample cli spec

- id: perf-001
- layer: api
- mode: mock

| priority | id | observation | given | when | then |
|---|---|---|---|---|---|
| P1 | c1 | first  | initial state | trigger action | expect success |
| P1 | c2 | second | edge case     | trigger action | expect failure |
`;

describe('cli app scenario perf (real workload)', () => {
  it('3-layer perf: init workflow / spec-to-test batch / error handling', async () => {
    let projectCounter = 0;
    let specCounter = 0;

    const specDir = mkdtempSync(path.join(os.tmpdir(), 'kiwa-cli-spec-perf-'));
    writeFileSync(path.join(specDir, 'in.spec.md'), SPEC_MD);

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
          name: 'init_workflow (3 fresh project scaffold)',
          regressionGateWaived: 'p10 の実行間の振れ幅が 21-24% で閾値 20% を超える (#1718)',
          fn: () => {
            for (let i = 0; i < 3; i++) {
              const projDir = mkdtempSync(path.join(os.tmpdir(), `kiwa-cli-init-${++projectCounter}-`));
              try {
                runInit({ cwd: projDir });
              } finally {
                rmSync(projDir, { recursive: true, force: true });
              }
            }
          },
          serialP95CapMs: 500,
        },
        {
          name: 'spec_to_test_batch (5 consecutive runSpecToTest)',
          fn: () => {
            for (let i = 0; i < 5; i++) {
              runSpecToTest({
                inPath: 'in.spec.md',
                outPath: `out-${++specCounter}.test.ts`,
                cwd: specDir,
              });
            }
          },
          serialP95CapMs: 300,
        },
        {
          name: 'init_error_handling (3 InitConflictError catch)',
          regressionGateWaived: 'p10 の実行間の振れ幅が 18-32% で閾値 20% を跨ぐ (#1718)',
          fn: () => {
            const projDir = mkdtempSync(path.join(os.tmpdir(), 'kiwa-cli-conflict-'));
            try {
              runInit({ cwd: projDir });
              for (let i = 0; i < 3; i++) {
                try {
                  runInit({ cwd: projDir });
                } catch (e) {
                  if (!(e instanceof InitConflictError)) throw e;
                }
              }
            } finally {
              rmSync(projDir, { recursive: true, force: true });
            }
          },
          serialP95CapMs: 500,
        },
      ],
    });

    rmSync(specDir, { recursive: true, force: true });
    expect(result.allPassed).toBe(true);
  });
});
