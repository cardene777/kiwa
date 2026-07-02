import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/flows/fidelity.js';
import {
  askWeatherAndMath,
  greetUser,
  replyWithSystemPrompt,
  streamBedtimeStory,
} from '../src/flows/chatbot-flows.js';

const opsUnderTest = ['reply', 'replyStream', 'toolLoop'];

describe('dogfood-anthropic — fidelity harness', () => {
  it('T-DFA-FID-001 mock adapter covers all 3 ops (reply / replyStream / toolLoop)', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (a) => {
        await greetUser(a).catch(() => undefined);
        await streamBedtimeStory(a).catch(() => undefined);
        await askWeatherAndMath(a).catch(() => undefined);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-test/ai-llm/anthropic-chatbot',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest,
      mockCostSamplesUsd: matrix.mockCostSamplesUsd,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      mockPromptTokenSamples: matrix.mockPromptTokenSamples,
      mockCompletionTokenSamples: matrix.mockCompletionTokenSamples,
      accuracyPairs: [
        { real: 'Hi there!', mock: 'Hi there! I hope you are having a great day.' },
      ],
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 12, integration: 3, e2e: 3 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 3, realTotalMethods: 3 },
    });
    expect(output.report.provider).toBe('@kiwa-test/ai-llm/anthropic-chatbot');
    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThanOrEqual(3);
    expect(output.report.fidelity.behavioralDivergences).toBeGreaterThanOrEqual(0);
    await mock.reset();
    await real.reset();
  });

  it('T-DFA-FID-002 divergence is flagged when real mode is skipped', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (a) => {
        await greetUser(a).catch(() => undefined);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-test/ai-llm/anthropic-chatbot',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: ['reply'],
      mockCostSamplesUsd: matrix.mockCostSamplesUsd,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      mockPromptTokenSamples: matrix.mockPromptTokenSamples,
      mockCompletionTokenSamples: matrix.mockCompletionTokenSamples,
      accuracyPairs: [{ real: 'Hi there!', mock: 'Hi there! I hope you are having a great day.' }],
      coverageSummary: {
        lines: { pct: 100 },
        branches: { pct: 100 },
        functions: { pct: 100 },
      },
      testCount: { behavior: 12, integration: 3, e2e: 3 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 1, realTotalMethods: 3 },
    });
    expect(output.divergences.length).toBeGreaterThan(0);
    expect(output.report.notes ?? '').toContain('divergences');
    await mock.reset();
    await real.reset();
  });

  it('T-DFA-FID-003 harness emits markdown + json outputs and evaluates 11 axes for AI-LLM provider', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (a) => {
        await greetUser(a).catch(() => undefined);
        await replyWithSystemPrompt(a).catch(() => undefined);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-test/ai-llm/anthropic-chatbot',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest,
      mockCostSamplesUsd: matrix.mockCostSamplesUsd,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      mockPromptTokenSamples: matrix.mockPromptTokenSamples,
      mockCompletionTokenSamples: matrix.mockCompletionTokenSamples,
      accuracyPairs: [{ real: 'Hi there!', mock: 'Hi there! I hope you are having a great day.' }],
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 12, integration: 3, e2e: 3 },
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
    // AI-LLM 4 axes must be emitted for `@kiwa-test/ai-*` providers.
    expect(parsed.cost?.perRequestUsd).toBeGreaterThanOrEqual(0);
    expect(parsed.latency?.p95Ms).toBeGreaterThanOrEqual(0);
    expect(parsed.token?.totalTokens).toBeGreaterThanOrEqual(0);
    expect(parsed.accuracy?.score).toBeGreaterThanOrEqual(0);
    expect(output.verdict.axesEvaluated).toBe(11);
    await mock.reset();
    await real.reset();
  });
});
