import { resolveKiwaRepoRoot, runPerf3LayerLive } from '@kiwa/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeRealAdapter } from '../../src/adapters/real.js';
import { runOrderedThreeToolFlow } from '../../src/flows/agent-flows.js';

const MODULE = 'dogfood-openai-tool-agent';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.live.md`,
);

describe(`${MODULE} — live`, () => {
  it(
    '3-layer LIVE perf: tool-use loop against real OpenAI Chat Completions (env-skip when OPENAI_API_KEY absent)',
    async () => {
      const adapter = makeRealAdapter();

      const result = await runPerf3LayerLive({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'runToolLoop.live',
            // Live threshold: OpenAI Chat Completions non-streaming ~1500ms.
            // Tool loop can span up to 5 iterations so budget is 3× single call.
            serialP95CapMs: 5000,
            requiredEnv: ['OPENAI_API_KEY'],
            fn: async () => {
              try {
                await runOrderedThreeToolFlow(adapter);
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
