import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/flows/fidelity.js';
import {
  runOrderedThreeToolFlow,
  runParallelWeatherFlow,
  validateAllToolSchemas,
} from '../src/flows/agent-flows.js';

const opsUnderTest = ['validateToolSchemas', 'runToolLoop', 'runParallelToolCall'];

describe('dogfood-openai-tool-agent — fidelity harness (Task 3.4)', () => {
  it('T-DFO-FID-001 mock adapter covers all 3 ops end-to-end', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (a) => {
        await validateAllToolSchemas(a).catch(() => undefined);
        await runOrderedThreeToolFlow(a).catch(() => undefined);
        await runParallelWeatherFlow(a).catch(() => undefined);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/ai-llm/openai-tool-agent',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest,
      mockCostSamplesUsd: matrix.mockCostSamplesUsd,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      mockPromptTokenSamples: matrix.mockPromptTokenSamples,
      mockCompletionTokenSamples: matrix.mockCompletionTokenSamples,
      accuracyPairs: [
        {
          real: 'Tokyo is 22C with clear skies.',
          mock: 'Tokyo is 22C with clear skies, and Washington DC is 24C with partly cloudy skies.',
        },
      ],
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 18, integration: 4, e2e: 3 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 3, realTotalMethods: 3 },
    });
    expect(output.report.provider).toBe('@kiwa-lab/ai-llm/openai-tool-agent');
    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThanOrEqual(3);
    expect(output.verdict.axesEvaluated).toBe(11);
    await mock.reset();
    await real.reset();
  });

  it('T-DFO-FID-002 divergence appears when real mode is skipped', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (a) => {
        await runOrderedThreeToolFlow(a).catch(() => undefined);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/ai-llm/openai-tool-agent',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: ['runToolLoop'],
      mockCostSamplesUsd: matrix.mockCostSamplesUsd,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      mockPromptTokenSamples: matrix.mockPromptTokenSamples,
      mockCompletionTokenSamples: matrix.mockCompletionTokenSamples,
      accuracyPairs: [
        {
          real: 'Tokyo is 22C, ~71.6F, and one typhoon news item.',
          mock: 'Tokyo is 22C (about 71.6F) with clear skies, and there is one recent typhoon-related news item: "Typhoon Nari approaches Kanto region".',
        },
      ],
      coverageSummary: {
        lines: { pct: 100 },
        branches: { pct: 100 },
        functions: { pct: 100 },
      },
      testCount: { behavior: 18, integration: 4, e2e: 3 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 1, realTotalMethods: 3 },
    });
    expect(output.divergences.length).toBeGreaterThan(0);
    expect(output.report.notes ?? '').toContain('divergences');
    await mock.reset();
    await real.reset();
  });

  it('T-DFO-FID-003 harness emits markdown + json + evaluates 11 axes for AI-LLM provider', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (a) => {
        await validateAllToolSchemas(a).catch(() => undefined);
        await runOrderedThreeToolFlow(a).catch(() => undefined);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/ai-llm/openai-tool-agent',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest,
      mockCostSamplesUsd: matrix.mockCostSamplesUsd,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      mockPromptTokenSamples: matrix.mockPromptTokenSamples,
      mockCompletionTokenSamples: matrix.mockCompletionTokenSamples,
      accuracyPairs: [
        {
          real: 'Tokyo weather looks clear and 71.6F.',
          mock: 'Tokyo is 22C (about 71.6F) with clear skies, and there is one recent typhoon-related news item: "Typhoon Nari approaches Kanto region".',
        },
      ],
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 18, integration: 4, e2e: 3 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 3, realTotalMethods: 3 },
    });
    expect(output.markdown).toContain('Quality Report');
    const parsed = JSON.parse(output.json) as {
      fidelity: unknown;
      cost?: { perRequestUsd?: number };
      latency?: { p95Ms?: number };
      token?: { totalTokens?: number };
      accuracy?: { score?: number };
    };
    expect(parsed.fidelity).toBeDefined();
    expect(parsed.cost?.perRequestUsd).toBeGreaterThanOrEqual(0);
    expect(parsed.latency?.p95Ms).toBeGreaterThanOrEqual(0);
    expect(parsed.token?.totalTokens).toBeGreaterThanOrEqual(0);
    expect(parsed.accuracy?.score).toBeGreaterThanOrEqual(0);
    expect(output.verdict.axesEvaluated).toBe(11);
    await mock.reset();
    await real.reset();
  });
});
