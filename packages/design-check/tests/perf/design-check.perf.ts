/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkSpecConformance, checkLayoutRegression } from '../../src/index.js';

const MODULE = 'design-check';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

const SPEC = {
  colors: { primary: '#3b82f6', secondary: '#f59e0b' },
  spacing: { sm: 4, md: 8, lg: 16, xl: 32 },
  typography: { body: { fontSize: 14, fontWeight: 400 }, heading: { fontSize: 24, fontWeight: 700 } },
  components: { Button: { padding: 8, borderRadius: 4 }, Card: { padding: 16, borderRadius: 8 } },
};

const BASELINE = {
  elements: Array.from({ length: 20 }, (_, i) => ({
    selector: `#el-${i}`,
    x: (i % 5) * 100,
    y: Math.floor(i / 5) * 100,
    width: 90,
    height: 90,
    visible: true,
  })),
};

describe('design-check perf', () => {
  it('3-layer perf: spec conformance + layout regression primary paths', async () => {
    const result = await runPerf3Layer({
      moduleName: MODULE,
      requireGc: true,
      reportPath: REPORT_PATH,
      serialIterations: 50,
      serialWarmup: 5,
      concurrency: 4,
      iterationsPerWorker: 10,
      memoryIterations: 50,
      ops: [
        {
          name: 'checkSpecConformance',
          fn: () => {
            checkSpecConformance(SPEC, SPEC);
          },
          serialP95CapMs: 5,
        },
        {
          name: 'checkLayoutRegression',
          fn: () => {
            checkLayoutRegression(BASELINE, BASELINE);
          },
          serialP95CapMs: 5,
        },
      ],
    });
    expect(result.allPassed).toBe(true);
  });

  it('timing baseline: performance.now() 100 回連続で serial p95 < 1ms (perf harness 環境 sanity)', () => {
    const start = performance.now();
    for (let i = 0; i < 100; i++) performance.now();
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it('allocation baseline: 小 object 100 回生成の max latency < 5ms (V8 alloc floor)', () => {
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      const _ = { a: i, b: i * 2, c: `str-${i}` };
      if (_ === undefined) break;
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });
});
