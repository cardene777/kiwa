import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import {
  a11yAllForms,
  mountAllForms,
  submitAllForms,
  validateAllForms,
} from '../../src/flows/form-flows.js';

const MODULE = 'dogfood-form-ct';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: mountAllForms / validateAllForms / submitAllForms',
    async () => {
      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'mountAllForms',
            serialP95CapMs: 50,
            fn: async () => {
              const adapter = makeMockAdapter();
              await mountAllForms(adapter);
              await adapter.reset();
            },
          },
          {
            name: 'validateAllForms',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await validateAllForms(adapter);
              await adapter.reset();
            },
          },
          {
            name: 'submitAllForms',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await submitAllForms(adapter);
              await adapter.reset();
            },
          },
          {
            name: 'a11yAllForms',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await a11yAllForms(adapter);
              await adapter.reset();
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
