import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { comparePngBuffers } from '../../src/index.js';

const MODULE = 'visual';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

interface PngStatic {
  sync: {
    write: (img: { width: number; height: number; data: Buffer }) => Buffer;
  };
}

async function loadPng(): Promise<PngStatic> {
  const mod = (await import('pngjs')) as unknown as { PNG: PngStatic };
  return mod.PNG;
}

function fillBuffer(width: number, height: number, rgba: [number, number, number, number]): Buffer {
  const data = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = rgba[0];
    data[i * 4 + 1] = rgba[1];
    data[i * 4 + 2] = rgba[2];
    data[i * 4 + 3] = rgba[3];
  }
  return data;
}

async function buildPng(width: number, height: number, rgba: [number, number, number, number]): Promise<Buffer> {
  const png = await loadPng();
  return png.sync.write({ width, height, data: fillBuffer(width, height, rgba) });
}

describe(MODULE, () => {
  it(
    '3-layer perf: comparePngBuffers primary paths (visual diff p95)',
    async () => {
      // 64x64 (small) と 256x256 (larger) の 2 baseline を pre-build して
      // ops.fn 内では圧縮された PNG 上での pixelmatch + PNG decode/encode の
      // 純粋なコストのみを measure する (fixture 生成コストは含めない)。
      const smallA = await buildPng(64, 64, [255, 0, 0, 255]);
      const smallB = await buildPng(64, 64, [255, 0, 0, 255]);
      const largeA = await buildPng(256, 256, [0, 0, 0, 255]);
      const largeB = await buildPng(256, 256, [255, 255, 255, 255]);

      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        // PNG decode + pixelmatch は CPU-heavy。 iteration 少なめ + concurrency
        // 落とし で run time を優先する (issue 記載 10-30 iteration に沿う)。
        serialIterations: 30,
        serialWarmup: 3,
        concurrency: 4,
        iterationsPerWorker: 8,
        memoryIterations: 30,
        ops: [
          {
            // identical buffer path = PNG decode × 2 + pixelmatch = 0 diff
            // baseline (最軽量 diff path)。 pngjs / pixelmatch は per-call で
            // arrayBuffer allocate するため、 30 iteration × 2 buffer で ~5MB
            // 前後残る。 SSOT default 100KB では低すぎるため 8MB 上限に上げる
            // (実測 ~5MB × 1.6 マージン)。
            name: 'comparePngBuffersIdentical',
            serialP95CapMs: 50,
            memoryArrayBuffersCapBytes: 8 * 1024 * 1024,
            fn: async () => {
              await comparePngBuffers(smallA, smallB, { emitDiff: false });
            },
          },
          {
            // full-diff path = pixelmatch が全 pixel を walk する worst case。
            // emitDiff:true で diff Buffer を allocate + write するコストも含む。
            // 256×256 image では per-call ~260KB × 30 iteration ≒ 7MB alloc、
            // 実測では大量 buffer 開放で negative delta になるが、 GC 挙動で
            // 逆に increase するケースも許容するため 16MB 上限。
            name: 'comparePngBuffersFullDiff',
            serialP95CapMs: 200,
            memoryArrayBuffersCapBytes: 16 * 1024 * 1024,
            fn: async () => {
              await comparePngBuffers(largeA, largeB);
            },
          },
        ],
      });

      for (const outcome of result.outcomes) {
        expect.soft(outcome.serialGatePassed, `${outcome.name} serial p95`).toBe(true);
        expect.soft(outcome.concurrentGatePassed, `${outcome.name} concurrent p95`).toBe(true);
        expect.soft(outcome.memoryGatePassed, `${outcome.name} memory arrayBuffers`).toBe(true);
      }
      expect(result.allPassed).toBe(true);
    },
    180_000,
  );
});
