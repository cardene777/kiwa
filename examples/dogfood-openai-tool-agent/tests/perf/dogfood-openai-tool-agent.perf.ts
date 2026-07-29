import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  runOrderedThreeToolFlow,
  runParallelWeatherFlow,
  validateAllToolSchemas,
} from '../../src/flows/agent-flows.js';
import { makeMockAdapter } from '../../src/adapters/mock.js';

const MODULE = 'dogfood-openai-tool-agent';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: validateToolSchemas / runToolLoop / runParallelToolCall',
    async () => {
      const result = await runPerf3Layer({
        moduleName: MODULE,
        // GC を呼べない測定は解放される一時使用まで拾い、memory 上限との
        // 比較が成立しない。 測れていない実行を pass にしない (#1708)。
        requireGc: true,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'validateToolSchemas',
            serialP95CapMs: 50,
            fn: async () => {
              const adapter = makeMockAdapter();
              await validateAllToolSchemas(adapter);
            },
          },
          {
            name: 'runToolLoop',
            serialP95CapMs: 100,
            fn: async () => {
              const adapter = makeMockAdapter();
              await runOrderedThreeToolFlow(adapter);
            },
          },
          {
            name: 'runParallelToolCall',
            serialP95CapMs: 100,
            fn: async () => {
              const adapter = makeMockAdapter();
              await runParallelWeatherFlow(adapter);
            },
          },
        ],
        serialIterations: 40,
      });

      for (const outcome of result.outcomes) {
        expect.soft(outcome.serialGatePassed, `${outcome.name} serial p95`).toBe(true);
        expect.soft(outcome.concurrentGatePassed, `${outcome.name} concurrent p95`).toBe(true);
        expect.soft(outcome.memoryGatePassed, `${outcome.name} memory arrayBuffers`).toBe(true);
      }
      expect(result.allPassed).toBe(true);
    },
    240_000,
  );
});
