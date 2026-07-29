/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { comparePngBuffers } from '../../src/index.js';

const MODULE = 'visual-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

// Minimal PNG buffer generator (1x1 red pixel, valid PNG)
function makePng(w: number, h: number, color: [number, number, number]): Buffer {
  const png = require('pngjs').PNG;
  const p = new png({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (w * y + x) << 2;
      p.data[idx] = color[0];
      p.data[idx + 1] = color[1];
      p.data[idx + 2] = color[2];
      p.data[idx + 3] = 255;
    }
  }
  return png.sync.write(p);
}

describe('visual app scenario perf (real workload)', () => {
  it('3-layer perf: baseline compare / burst compare / large image diff', async () => {
    const small = makePng(10, 10, [255, 0, 0]);
    const different = makePng(10, 10, [0, 255, 0]);
    const large = makePng(100, 100, [0, 0, 255]);

    const result = await runPerf3Layer({
      moduleName: MODULE,
      requireGc: true,
      reportPath: REPORT_PATH,
      serialIterations: 20,
      serialWarmup: 3,
      concurrency: 2,
      iterationsPerWorker: 5,
      memoryIterations: 20,
      ops: [
        {
          name: 'baseline_compare (identical 10x10 png)',
          fn: () => {
            const res = comparePngBuffers(small, small);
            if (!res) throw new Error('compare returned null');
          },
          serialP95CapMs: 30,
        },
        {
          name: 'burst_compare (5 different 10x10 diff)',
          fn: () => {
            for (let i = 0; i < 5; i++) comparePngBuffers(small, different);
          },
          serialP95CapMs: 100,
        },
        {
          name: 'large_image_diff (100x100 png)',
          fn: () => {
            comparePngBuffers(large, large);
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result.allPassed).toBe(true);
  });
});
