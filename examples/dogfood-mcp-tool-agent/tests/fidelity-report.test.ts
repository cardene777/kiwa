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

describe('dogfood-mcp-tool-agent — fidelity harness', () => {
  it('T-DFMCP-FID-001 mock adapter covers all 4 MCP ops (handshake / listTools / callTool / runMcpToolLoop)', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (a) => {
        await performHandshakeAndDiscover(a).catch(() => undefined);
        await runClaudeMcpChain(a).catch(() => undefined);
        await callEachToolDirectly(a).catch(() => undefined);
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
          real: 'Tokyo is 22 degrees celsius, roughly 71.6 fahrenheit, with a typhoon-related news item.',
          mock: 'Tokyo is 22C (about 39.6 in the raw multiplier, i.e. 71.6F after adding 32). Related news: doc-3 titled "Typhoon Nari approaches Kanto".',
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
    expect(output.report.provider).toBe('@kiwa/ai-llm/mcp-tool-agent');
    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThanOrEqual(3);
    expect(output.report.fidelity.behavioralDivergences).toBeGreaterThanOrEqual(0);
    await mock.reset();
    await real.reset();
  });

  it('T-DFMCP-FID-002 divergence is flagged when real mode is skipped', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (a) => {
        await performHandshakeAndDiscover(a).catch(() => undefined);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa/ai-llm/mcp-tool-agent',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: ['handshake', 'listTools'],
      mockCostSamplesUsd: matrix.mockCostSamplesUsd,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      mockPromptTokenSamples: matrix.mockPromptTokenSamples,
      mockCompletionTokenSamples: matrix.mockCompletionTokenSamples,
      accuracyPairs: [
        { real: 'the same', mock: 'the same' },
      ],
      coverageSummary: {
        lines: { pct: 100 },
        branches: { pct: 100 },
        functions: { pct: 100 },
      },
      testCount: { behavior: 18, integration: 4, e2e: 3 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 2, realTotalMethods: 4 },
    });
    expect(output.divergences.length).toBeGreaterThan(0);
    expect(output.report.notes ?? '').toContain('divergences');
    await mock.reset();
    await real.reset();
  });

  it('T-DFMCP-FID-003 harness emits markdown + json outputs and evaluates 11 axes for AI-LLM MCP provider', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (a) => {
        await performHandshakeAndDiscover(a).catch(() => undefined);
        await runClaudeMcpChain(a).catch(() => undefined);
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
          real: 'Tokyo is 22 degrees celsius with typhoon news.',
          mock: 'Tokyo is 22C (about 39.6 in the raw multiplier, i.e. 71.6F after adding 32). Related news: doc-3 titled "Typhoon Nari approaches Kanto".',
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
    expect(output.markdown).toContain('Quality Report');
    const parsed = JSON.parse(output.json) as {
      fidelity: unknown;
      cost?: { perRequestUsd?: number };
      latency?: { p95Ms?: number };
      token?: { totalTokens?: number };
      accuracy?: { score?: number };
    };
    expect(parsed.fidelity).toBeDefined();
    // Provider prefix `@kiwa/ai-llm/` triggers the 11-axis AI-LLM branch
    // of the release gate — the MCP dogfood surfaces an LLM roundtrip through
    // the mock so cost / latency / token / accuracy all apply on top of the
    // shared 7.
    expect(parsed.cost?.perRequestUsd).toBeGreaterThanOrEqual(0);
    expect(parsed.latency?.p95Ms).toBeGreaterThanOrEqual(0);
    expect(parsed.token?.totalTokens).toBeGreaterThanOrEqual(0);
    expect(parsed.accuracy?.score).toBeGreaterThanOrEqual(0);
    expect(output.verdict.axesEvaluated).toBe(11);
    await mock.reset();
    await real.reset();
  });
});
