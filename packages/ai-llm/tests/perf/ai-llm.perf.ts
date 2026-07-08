import {
  createAnthropicMock,
  createLangchainMock,
  createOpenAIMock,
  createVercelAiMock,
} from '../../src/index.js';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MODULE = 'ai-llm';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: serial + concurrent + memory across 4 SDK mocks',
    async () => {
      // Reuse the same mock across iterations so `responses` map lookup is
      // the perf target (not construction). Registering a canned response
      // keeps the mock deterministic.
      const anthropic = createAnthropicMock({
        artificialLatencyMs: 8,
        responses: {
          ping: { content: 'pong', usage: { promptTokens: 4, completionTokens: 4 } },
        },
      });
      const openai = createOpenAIMock({
        artificialLatencyMs: 8,
        responses: {
          ping: { content: 'pong', usage: { promptTokens: 4, completionTokens: 4 } },
        },
      });
      const vercel = createVercelAiMock({
        artificialLatencyMs: 8,
        responses: {
          ping: { content: 'pong', usage: { promptTokens: 4, completionTokens: 4 } },
        },
      });
      const langchain = createLangchainMock({
        artificialLatencyMs: 8,
        responses: {
          ping: { content: 'pong', usage: { promptTokens: 4, completionTokens: 4 } },
        },
      });

      // Serial caps from docs/quality/perf-thresholds.md.
      // Anthropic / OpenAI / Vercel / LangChain mocks all sit at 40 ms (SLA
      // 10 % rule) so their per-call latency budget is identical.
      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'anthropicMessagesCreate',
            serialP95CapMs: 40,
            fn: async () => {
              await anthropic.messages.create({
                messages: [{ role: 'user', content: 'ping' }],
              });
            },
          },
          {
            name: 'openAiChatCompletionsCreate',
            serialP95CapMs: 40,
            fn: async () => {
              await openai.chat.completions.create({
                messages: [{ role: 'user', content: 'ping' }],
              });
            },
          },
          {
            name: 'vercelGenerateText',
            serialP95CapMs: 40,
            fn: async () => {
              await vercel.generateText({
                messages: [{ role: 'user', content: 'ping' }],
              });
            },
          },
          {
            name: 'langchainInvoke',
            serialP95CapMs: 40,
            fn: async () => {
              await langchain.invoke([{ role: 'human', content: 'ping' }]);
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
