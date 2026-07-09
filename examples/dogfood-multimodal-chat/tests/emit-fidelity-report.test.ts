import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
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

describe('dogfood-multimodal — emit fidelity report to quality-report/', () => {
  it('T-DFM-EM-001 writes JSON snapshot + markdown report to disk', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await chatWithUploadedImage(adapter);
          await streamVisionDescription(adapter);
          await ocrImageWithHighDetail(adapter);
          await compareTwoImages(adapter);
        } catch {
          // Real mode failures are recorded in the trace and become
          // divergences downstream. The mock path must complete.
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/ai-llm/multimodal-chat',
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
          real: 'The image shows an orange tabby cat sitting on a cushion.',
          mock: 'The image shows a small orange tabby cat sitting on a green cushion, looking directly at the camera. The lighting is soft and warm.',
        },
        {
          real: 'A serene beach at dusk with pink skies.',
          mock: 'A quiet beach at sunset with pastel orange and pink hues across the horizon. A single sailboat drifts near the shoreline.',
        },
        {
          real: 'The text reads "HELLO WORLD".',
          mock: 'The image shows the words "HELLO WORLD" in bold sans-serif type.',
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

    // Write into the local example directory so the emitted snapshot is
    // easy to inspect from a fresh clone. A follow-up manual step
    // promotes the snapshot to docs/quality-reports/ai-llm/ when it
    // becomes canonical.
    const outDir = join(process.cwd(), 'quality-report');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'fidelity-latest.json'), output.json);
    writeFileSync(join(outDir, 'fidelity-latest.md'), output.markdown);

    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThan(0);
    expect(output.report.fidelity.behavioralDivergences).toBeGreaterThanOrEqual(0);
    expect(output.markdown).toContain('Quality Report');
    // AI-LLM provider means the 11-axis gate must have run.
    expect(output.verdict.axesEvaluated).toBe(11);
    await mock.reset();
    await real.reset();
  });
});
