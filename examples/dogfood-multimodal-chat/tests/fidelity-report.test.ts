import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/flows/fidelity.js';
import {
  chatWithUploadedImage,
  compareTwoImages,
  ocrImageWithHighDetail,
  streamVisionDescription,
} from '../src/flows/chat-flows.js';

const opsUnderTest = ['describeImage', 'streamDescribeImage', 'compareImages'];

describe('dogfood-multimodal — fidelity harness', () => {
  it('T-DFM-FID-001 mock adapter covers all 3 vision ops (describeImage / streamDescribeImage / compareImages)', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (a) => {
        await chatWithUploadedImage(a).catch(() => undefined);
        await streamVisionDescription(a).catch(() => undefined);
        await compareTwoImages(a).catch(() => undefined);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-test/ai-llm/multimodal-chat',
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
          real: 'The image shows a cat.',
          mock: 'The image shows a small orange tabby cat sitting on a green cushion, looking directly at the camera. The lighting is soft and warm.',
        },
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
    expect(output.report.provider).toBe('@kiwa-test/ai-llm/multimodal-chat');
    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThanOrEqual(3);
    expect(output.report.fidelity.behavioralDivergences).toBeGreaterThanOrEqual(0);
    await mock.reset();
    await real.reset();
  });

  it('T-DFM-FID-002 divergence is flagged when real mode is skipped', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (a) => {
        await chatWithUploadedImage(a).catch(() => undefined);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-test/ai-llm/multimodal-chat',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: ['describeImage'],
      mockCostSamplesUsd: matrix.mockCostSamplesUsd,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      mockPromptTokenSamples: matrix.mockPromptTokenSamples,
      mockCompletionTokenSamples: matrix.mockCompletionTokenSamples,
      accuracyPairs: [
        {
          real: 'The image shows a cat.',
          mock: 'The image shows a small orange tabby cat sitting on a green cushion, looking directly at the camera. The lighting is soft and warm.',
        },
      ],
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

  it('T-DFM-FID-003 harness emits markdown + json outputs and evaluates 11 axes for AI-LLM provider', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (a) => {
        await chatWithUploadedImage(a).catch(() => undefined);
        await ocrImageWithHighDetail(a).catch(() => undefined);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-test/ai-llm/multimodal-chat',
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
          real: 'The image shows a cat.',
          mock: 'The image shows a small orange tabby cat sitting on a green cushion, looking directly at the camera. The lighting is soft and warm.',
        },
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
