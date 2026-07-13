import {
  createAnthropicMock,
  createLangchainMock,
  createOpenAIMock,
  createVercelAiMock,
} from '../../src/index.js';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
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

  it(
    'timing baseline: performance.now() 100 回連続で serial p95 < 1ms (perf harness 環境 sanity)',
    () => {
      const N = 100;
      const samples: number[] = [];
      for (let i = 0; i < N; i += 1) {
        const s = performance.now();
        void performance.now();
        samples.push(performance.now() - s);
      }
      samples.sort((a, b) => a - b);
      const p95 = samples[Math.floor(samples.length * 0.95)] ?? 0;
      expect(p95).toBeLessThan(1);
    },
    30_000,
  );

  it(
    'allocation baseline: 小 object 100 回生成の max latency < 5ms (V8 alloc floor)',
    () => {
      const N = 100;
      let maxLatency = 0;
      for (let i = 0; i < N; i += 1) {
        const start = performance.now();
        const obj = { id: i, val: `v${i}`, ts: Date.now() };
        if (obj.id < 0) throw new Error('unreachable');
        const elapsed = performance.now() - start;
        if (elapsed > maxLatency) maxLatency = elapsed;
      }
      expect(maxLatency).toBeLessThan(5);
    },
    30_000,
  );
});
