/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkSpecConformance, checkLayoutRegression } from '../../src/index.js';

const MODULE = 'design-check-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

const LARGE_SPEC = {
  colors: Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`c-${i}`, `#${i.toString(16).padStart(6, '0')}`])),
  spacing: Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`s-${i}`, i * 4])),
  typography: Object.fromEntries(
    Array.from({ length: 10 }, (_, i) => [`t-${i}`, { fontSize: 14 + i, fontWeight: 400 }]),
  ),
  components: Object.fromEntries(
    Array.from({ length: 20 }, (_, i) => [`Comp-${i}`, { padding: i * 2, borderRadius: i }]),
  ),
};

const LARGE_SNAPSHOT = {
  elements: Array.from({ length: 50 }, (_, i) => ({
    selector: `#el-${i}`,
    x: (i % 10) * 100,
    y: Math.floor(i / 10) * 100,
    width: 90,
    height: 90,
    visible: true,
  })),
};

describe('design-check app scenario perf (real workload)', () => {
  it('3-layer perf: full design audit / large spec conformance / regression scan', async () => {
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
          name: 'full_design_audit (spec + layout combined 10 iter)',
          fn: () => {
            for (let i = 0; i < 10; i++) {
              checkSpecConformance(LARGE_SPEC, LARGE_SPEC);
              checkLayoutRegression(LARGE_SNAPSHOT, LARGE_SNAPSHOT);
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'large_spec_conformance (spec 80 keys × 5 iter)',
          fn: () => {
            for (let i = 0; i < 5; i++) checkSpecConformance(LARGE_SPEC, LARGE_SPEC);
          },
          serialP95CapMs: 50,
        },
        {
          name: 'regression_scan_burst (50 element layout × 10 iter)',
          fn: () => {
            for (let i = 0; i < 10; i++) checkLayoutRegression(LARGE_SNAPSHOT, LARGE_SNAPSHOT);
          },
          serialP95CapMs: 50,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
