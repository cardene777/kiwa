/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createFlagClient, evaluateFlag, evaluateAllFlags } from '../../src/index.js';

const MODULE = 'feature-flag-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('feature-flag app scenario perf (real workload)', () => {
  it('3-layer perf: evaluation_workflow / all_flags_batch / rule_error_handling', async () => {
    const result = await runPerf3Layer({
      moduleName: MODULE,
      reportPath: REPORT_PATH,
      serialIterations: 20,
      serialWarmup: 3,
      concurrency: 4,
      iterationsPerWorker: 5,
      memoryIterations: 20,
      ops: [
        {
          name: 'evaluation_workflow (10 evaluateFlag across 4 providers)',
          fn: async () => {
            const providers = ['growthbook', 'launchdarkly', 'posthog', 'unleash'] as const;
            for (let i = 0; i < 10; i++) {
              const client = createFlagClient({
                provider: providers[i % 4],
                flags: [{ key: 'new-checkout', variant: 'boolean', defaultValue: false }],
              });
              client.registerRule('new-checkout', { type: 'targeting', userIds: [`u-${i}`], value: true });
              evaluateFlag(client, 'new-checkout', { id: `u-${i}`, attributes: { plan: 'pro' } });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'all_flags_batch (5 evaluateAllFlags with 3 flags)',
          fn: async () => {
            const client = createFlagClient({
              provider: 'launchdarkly',
              flags: [
                { key: 'new-checkout', variant: 'boolean', defaultValue: false },
                { key: 'plan-name', variant: 'string', defaultValue: 'free' },
                { key: 'discount', variant: 'number', defaultValue: 0 },
              ],
            });
            client.registerRule('discount', { type: 'percentage', percentage: 50, value: 10, fallback: 0 });
            for (let i = 0; i < 5; i++) {
              evaluateAllFlags(client, { id: `u-${i}`, attributes: { plan: i % 2 === 0 ? 'pro' : 'free' } });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'rule_error_handling (5 unknown flag + attribute mismatch)',
          fn: async () => {
            const client = createFlagClient({
              provider: 'posthog',
              flags: [{ key: 'known-flag', variant: 'boolean', defaultValue: false }],
            });
            client.registerRule('known-flag', {
              type: 'attribute',
              attribute: 'country',
              operator: 'eq',
              value: 'JP',
              matchValue: true,
              fallback: false,
            });
            for (let i = 0; i < 5; i++) {
              evaluateFlag(client, 'unknown-flag', { id: `u-${i}` });
              evaluateFlag(client, 'known-flag', { id: `u-${i}`, attributes: { country: 'US' } });
            }
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
