import { diffReports, evaluateReleaseGate, type QualityReport } from '../../src/index.js';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-test/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MODULE = 'quality-metrics';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

function buildReport(provider: string): QualityReport {
  return {
    provider,
    version: '0.0.0-perf-fixture',
    reportedAt: new Date(0).toISOString(),
    coverage: { line: 92, branch: 89, function: 95 },
    testCount: { behavior: 150, integration: 30, e2e: 20, total: 200 },
    fidelity: { mockCoveredMethods: 47, realTotalMethods: 50, ratio: 94 },
    perf: { p50Ms: 8, p95Ms: 42, p99Ms: 60, sampleCount: 100 },
    mutation: { mutations: 50, killed: 39, survived: 11, killRate: 78 },
  };
}

function buildAiReport(provider: string): QualityReport {
  return {
    ...buildReport(provider),
    cost: { perRequestUsd: 0.02, totalUsd: 2.0, requests: 100 },
    latency: { p50Ms: 400, p95Ms: 800, p99Ms: 1200, sampleCount: 100 },
    token: { promptTokens: 800, completionTokens: 2200, totalTokens: 3000, sampleCount: 100 },
    accuracy: { score: 0.88, sampleCount: 100, method: 'cosine' },
  };
}

describe(MODULE, () => {
  it(
    '3-layer perf: evaluateReleaseGate + diffReports on 7-axis + 11-axis reports',
    async () => {
      const nonAi = buildReport('kiwa-plugin');
      const ai = buildAiReport('@kiwa-test/ai-anthropic/messages');
      // diffReports requires same provider — use the same provider name
      // with different version fields so the diff has real work to do.
      const previousNonAi = { ...buildReport('kiwa-plugin'), version: 'v0.9.0' };
      const currentNonAi = { ...buildReport('kiwa-plugin'), version: 'v1.0.0' };

      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'evaluateReleaseGate_7axis',
            serialP95CapMs: 5,
            fn: () => {
              evaluateReleaseGate(nonAi);
            },
          },
          {
            name: 'evaluateReleaseGate_11axis',
            serialP95CapMs: 5,
            fn: () => {
              evaluateReleaseGate(ai);
            },
          },
          {
            name: 'diffReports',
            serialP95CapMs: 5,
            fn: () => {
              diffReports(previousNonAi, currentNonAi);
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
});
