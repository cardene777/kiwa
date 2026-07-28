/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { MockEngine } from '../../src/index.js';

const MODULE = 'ai-llm-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('ai-llm app scenario perf (real workload)', () => {
  it('3-layer perf: chat completion / streaming / multi-turn conversation', async () => {
    const result = await runPerf3Layer({
      moduleName: MODULE,
      requireGc: true,
      reportPath: REPORT_PATH,
      serialIterations: 103,
      serialWarmup: 10,
      concurrency: 4,
      iterationsPerWorker: 5,
      memoryIterations: 20,
      ops: [
        {
          name: 'chat_completion (10x runChat + getMetrics)',
          fn: async () => {
            const engine = new MockEngine({ defaultResponse: 'ok', artificialLatencyMs: 0 });
            for (let i = 0; i < 10; i++) await engine.runChat({ messages: [{ role: 'user', content: `q-${i}` }] });
            engine.getMetrics();
          },
          serialP95CapMs: 100,
        },
        {
          name: 'streaming_workload (5 runStream + chunk collect)',
          fn: async () => {
            const engine = new MockEngine({ defaultResponse: 'streaming response test', artificialLatencyMs: 0 });
            for (let i = 0; i < 5; i++) {
              for await (const event of engine.runStream({ messages: [{ role: 'user', content: `s-${i}` }] })) {
                if (event.done) break;
              }
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'multi_turn_conversation (10-turn chat + reset)',
          fn: async () => {
            const engine = new MockEngine({ defaultResponse: 'reply', artificialLatencyMs: 0 });
            const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
            for (let i = 0; i < 10; i++) {
              messages.push({ role: 'user', content: `turn ${i}` });
              await engine.runChat({ messages });
              messages.push({ role: 'assistant', content: 'reply' });
            }
            engine.reset();
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result.allPassed).toBe(true);
  });
});
