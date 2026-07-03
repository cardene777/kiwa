import { resolveKiwaRepoRoot, runPerf3LayerLive } from '@kiwa-test/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeRealAdapter } from '../../src/adapters/real.js';

const MODULE = 'dogfood-vercel-ai-rag';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.live.md`,
);

describe(`${MODULE} — live`, () => {
  it(
    '3-layer LIVE perf: RAG retrieve + answer against real OpenAI + vector store (env-skip when any required var absent)',
    async () => {
      const adapter = makeRealAdapter();

      const result = await runPerf3LayerLive({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'answer.live',
            // Live threshold: retrieve + LLM budget ~2500ms
            serialP95CapMs: 2500,
            requiredEnv: [
              'OPENAI_API_KEY',
              'RAG_VECTOR_STORE_URL',
              'RAG_VECTOR_STORE_API_KEY',
            ],
            fn: async () => {
              try {
                await adapter.answer({ question: 'What is kiwa?', topK: 5 });
              } catch (err) {
                if (err instanceof Error && err.message.includes('ENV_MISSING')) return;
                throw err;
              }
            },
          },
        ],
      });

      const measured = result.outcomes.filter((o) => !o.skipped);
      if (measured.length > 0) {
        for (const outcome of measured) {
          expect.soft(outcome.serialGatePassed, `${outcome.name} live serial p95`).toBe(true);
        }
        expect(result.allPassed).toBe(true);
      } else {
        expect(result.anySkipped).toBe(true);
      }
    },
    600_000,
  );
});
