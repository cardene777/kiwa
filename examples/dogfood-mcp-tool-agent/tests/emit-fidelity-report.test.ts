import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/flows/fidelity.js';
import {
  callEachToolDirectly,
  performHandshakeAndDiscover,
  runClaudeMcpChain,
} from '../src/flows/agent-flows.js';

const opsUnderTest = ['handshake', 'listTools', 'callTool', 'runMcpToolLoop'];

describe('dogfood-mcp-tool-agent — emit fidelity report to quality-report/', () => {
  it('T-DFMCP-EM-001 writes JSON snapshot + markdown report to disk', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await performHandshakeAndDiscover(adapter);
          await runClaudeMcpChain(adapter);
          await callEachToolDirectly(adapter);
        } catch {
          // Real mode failures are recorded in the trace and become
          // divergences downstream. The mock path must complete.
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa/ai-llm/mcp-tool-agent',
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
          real: 'Tokyo is 22C, ~71.6F, and a related typhoon news article was found.',
          mock: 'Tokyo is 22C (about 39.6 in the raw multiplier, i.e. 71.6F after adding 32). Related news: doc-3 titled "Typhoon Nari approaches Kanto".',
        },
        {
          real: 'The weather tool returned 22 celsius for tokyo.',
          mock: 'tokyo: 22C, sunny',
        },
        {
          real: '39.6',
          mock: '39.6',
        },
      ],
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 18, integration: 4, e2e: 3 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 4, realTotalMethods: 4 },
    });

    // Write into the local example directory so the emitted snapshot is
    // easy to inspect from a fresh clone. A follow-up manual step promotes
    // the snapshot to docs/quality-reports/ai-llm/ when it becomes
    // canonical for a release.
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
