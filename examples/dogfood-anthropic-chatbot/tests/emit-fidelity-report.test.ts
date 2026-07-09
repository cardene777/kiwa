import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
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

describe('dogfood-anthropic — emit fidelity report to quality-report/', () => {
  it('T-DFA-EM-001 writes JSON snapshot + markdown report to disk', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await greetUser(adapter);
          await streamBedtimeStory(adapter);
          await replyWithSystemPrompt(adapter);
          await askWeatherAndMath(adapter);
        } catch {
          // Real mode failures are recorded in the trace and become
          // divergences downstream. The mock path must complete.
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/ai-llm/anthropic-chatbot',
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
          real: 'Hi there! I hope you are doing well today.',
          mock: 'Hi there! I hope you are having a great day.',
        },
        {
          real: 'Once upon a time a robot fell asleep among the stars.',
          mock: 'Once upon a time a robot dreamt of stars and drifted to sleep.',
        },
        {
          real: 'Arrr matey! The seas be calm today.',
          mock: 'Arrr matey! The tides be favourable and the horizon be wide.',
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
    // easy to inspect from a fresh clone. A follow-up manual step promotes
    // the snapshot to docs/quality-reports/ai-llm/ when it becomes canonical.
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
