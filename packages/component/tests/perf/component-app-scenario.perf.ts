/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createStoryRegistry, createPlaywrightCTMock, createChromaticVisualMock } from '../../src/index.js';

const MODULE = 'component-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('component app scenario perf (real workload)', () => {
  it('3-layer perf: storybook registry burst / playwright CT mock / chromatic visual', async () => {
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
          name: 'storybook_registry_burst (create registry x 30)',
          fn: () => {
            for (let i = 0; i < 30; i++) createStoryRegistry();
          },
          serialP95CapMs: 50,
        },
        {
          name: 'playwright_ct_mock_lifecycle (create mock x 30)',
          fn: () => {
            for (let i = 0; i < 30; i++) createPlaywrightCTMock();
          },
          serialP95CapMs: 50,
        },
        {
          name: 'chromatic_visual_snapshot (create mock x 30)',
          fn: () => {
            for (let i = 0; i < 30; i++) createChromaticVisualMock({ projectId: `p-${i}` });
          },
          serialP95CapMs: 50,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
