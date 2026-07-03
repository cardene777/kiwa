import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-test/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import {
  askWeatherAndMath,
  greetUser,
  streamBedtimeStory,
} from '../../src/flows/chatbot-flows.js';

const MODULE = 'dogfood-anthropic-chatbot';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: reply / replyStream / toolLoop',
    async () => {
      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'reply',
            serialP95CapMs: 30,
            fn: async () => {
              const adapter = makeMockAdapter();
              await greetUser(adapter);
            },
          },
          {
            name: 'replyStream',
            serialP95CapMs: 50,
            fn: async () => {
              const adapter = makeMockAdapter();
              await streamBedtimeStory(adapter);
            },
          },
          {
            name: 'toolLoop',
            serialP95CapMs: 100,
            fn: async () => {
              const adapter = makeMockAdapter();
              await askWeatherAndMath(adapter);
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
