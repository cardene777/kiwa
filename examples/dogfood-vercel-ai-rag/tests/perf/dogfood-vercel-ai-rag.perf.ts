import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-test/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../../src/adapters/mock.js';

const MODULE = 'dogfood-vercel-ai-rag';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: embed / retrieve / answer',
    async () => {
      const adapter = makeMockAdapter();
      await adapter.ingest();

      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'embed',
            serialP95CapMs: 20,
            fn: async () => {
              await adapter.embed('What is kiwa?');
            },
          },
          {
            name: 'retrieve',
            serialP95CapMs: 30,
            fn: async () => {
              await adapter.retrieve({ query: 'AI-LLM release gate axes', topK: 5 });
            },
          },
          {
            name: 'answer',
            serialP95CapMs: 100,
            fn: async () => {
              await adapter.answer({ question: 'What is kiwa?', topK: 5 });
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
    180_000,
  );
});
