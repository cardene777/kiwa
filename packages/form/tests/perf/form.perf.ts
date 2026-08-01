import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { baselinePathFor, resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import {
  createFormClient,
  validateSchema,
  registerField,
  getFieldError,
} from '../../src/index.js';

const MODULE = 'form';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf', `${MODULE}.md`);
const BASELINE_PATH = baselinePathFor(REPO_ROOT, MODULE);

describe(MODULE, () => {
  it(
    '3-layer perf: registerField + validateSchema + submit primary paths',
    async () => {
      const schema = {
        fields: {
          email: { required: true, pattern: /@/ },
          age: { min: 0, max: 120 },
        },
      };

      const result = await runPerf3Layer({
        moduleName: MODULE,
        requireGc: true,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            name: 'validateSchema',
            serialP95CapMs: 5,
            fn: async () => {
              validateSchema(schema, { email: 'a@x', age: 30 }, 'zod');
            },
          },
          {
            name: 'registerFieldAndSubmit',
            serialP95CapMs: 5,
            fn: async () => {
              const client = createFormClient({ provider: 'react-hook-form' });
              registerField(client, { name: 'email', rule: { required: true }, defaultValue: 'a@x' });
              await client.submit({ onSubmit: () => {} });
            },
          },
          {
            name: 'getFieldErrorAfterFailure',
            serialP95CapMs: 5,
            fn: async () => {
              const client = createFormClient({ provider: 'formik' });
              registerField(client, { name: 'email', rule: { required: true } });
              await client.submit({ onSubmit: () => {} });
              getFieldError(client, 'email');
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
    120_000,
  );

  it(
    'timing baseline: performance.now() 100 回連続で serial p95 < 1ms',
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
    'allocation baseline: 小 object 100 回生成の max latency < 5ms',
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
