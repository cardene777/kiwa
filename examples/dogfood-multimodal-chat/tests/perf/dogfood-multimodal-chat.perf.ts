import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import {
  chatWithUploadedImage,
  compareTwoImages,
  streamVisionDescription,
} from '../../src/flows/chat-flows.js';

const MODULE = 'dogfood-multimodal-chat';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: describeImage / streamDescribeImage / compareImages',
    async () => {
      const result = await runPerf3Layer({
        moduleName: MODULE,
        // GC を呼べない測定は解放される一時使用まで拾い、memory 上限との
        // 比較が成立しない。 測れていない実行を pass にしない (#1708)。
        requireGc: true,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'describeImage',
            serialP95CapMs: 30,
            fn: async () => {
              const adapter = makeMockAdapter();
              await chatWithUploadedImage(adapter);
            },
          },
          {
            name: 'streamDescribeImage',
            serialP95CapMs: 50,
            fn: async () => {
              const adapter = makeMockAdapter();
              await streamVisionDescription(adapter);
            },
          },
          {
            name: 'compareImages',
            serialP95CapMs: 40,
            fn: async () => {
              const adapter = makeMockAdapter();
              await compareTwoImages(adapter);
            },
          },
        ],
        serialIterations: 60,
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
