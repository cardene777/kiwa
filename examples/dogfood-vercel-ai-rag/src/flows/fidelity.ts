import {
  accuracyFromSamples,
  assembleReport,
  costFromSamples,
  coverageFromV8Summary,
  emitJson,
  emitMarkdown,
  evaluateReleaseGate,
  fidelityFromMethodCounts,
  latencyFromSamples,
  mutationFromCounts,
  perfFromSamples,
  testCountFromCategories,
  tokenFromSamples,
  type QualityReport,
  type ReleaseGateVerdict,
} from '@kiwa-lab/quality-metrics';
import { jaccardSimilarity } from '@kiwa-lab/ai-llm';
import type { RagAdapter, TraceEvent } from '../adapters/interface.js';
import { cosineSimilarity } from '../rag/embedder.js';

/**
 * Fidelity harness — compares a RAG run under {@link makeMockAdapter}
 * against one under {@link makeRealAdapter}, aggregates cost / token /
 * latency samples, computes embedding cosine similarity, retrieval F1, and
 * a Jaccard-based accuracy score between real and mock final answers, then
 * produces a `@kiwa-lab/quality-metrics` 11-axis report + release gate
 * verdict + markdown / JSON snapshots.
 *
 * The dogfood app is the source of truth for whether the kiwa Vercel AI +
 * LangChain mocks track real RAG behaviour closely enough to trust in
 * downstream unit tests — this harness is where that trust is measured
 * for embedding + retrieval + streaming generation (Issue #698 AC 3.1-3.4).
 */

export interface FidelityRunInput {
  provider: string;
  version: string;
  mockTraces: TraceEvent[];
  realTraces: TraceEvent[];
  mockCostSamplesUsd: number[];
  mockLatencySamplesMs: number[];
  mockPromptTokenSamples: number[];
  mockCompletionTokenSamples: number[];
  /** Ops the app exercises end-to-end — used to measure surface coverage. */
  opsUnderTest: string[];
  /** Real vs mock text pairs — accuracy = mean Jaccard similarity. */
  accuracyPairs: Array<{ real: string; mock: string }>;
  coverageSummary: {
    lines: { pct: number };
    branches: { pct: number };
    functions: { pct: number };
  };
  testCount: { behavior: number; integration: number; e2e: number };
  mutation: { mutations: number; killed: number };
  surfaceCoverage: { mockCoveredMethods: number; realTotalMethods: number };
  /** Optional embedding similarity samples (Task 3.1). */
  embeddingSimilaritySamples?: number[];
  /** Optional retrieval F1 samples (Task 3.2). */
  retrievalF1Samples?: number[];
}

export interface FidelityRunOutput {
  divergences: TraceEvent[];
  report: QualityReport;
  verdict: ReleaseGateVerdict;
  markdown: string;
  json: string;
  extras: {
    embeddingMeanSimilarity: number;
    retrievalMeanF1: number;
    answerMeanJaccard: number;
  };
}

export function runFidelityHarness(input: FidelityRunInput): FidelityRunOutput {
  const divergences = compareTraces(input.mockTraces, input.realTraces);
  const covered = countCoveredOps(input.mockTraces, input.opsUnderTest);
  const accuracySamples = input.accuracyPairs.map((pair) =>
    jaccardSimilarity(pair.real, pair.mock),
  );
  const answerMeanJaccard = mean(accuracySamples);
  const embeddingMeanSimilarity = mean(input.embeddingSimilaritySamples ?? []);
  const retrievalMeanF1 = mean(input.retrievalF1Samples ?? []);

  const report = assembleReport({
    provider: input.provider,
    version: input.version,
    coverage: coverageFromV8Summary(input.coverageSummary),
    testCount: testCountFromCategories(input.testCount),
    fidelity: fidelityFromMethodCounts({
      mockCoveredMethods: Math.max(covered, input.surfaceCoverage.mockCoveredMethods),
      realTotalMethods: input.surfaceCoverage.realTotalMethods,
      behavioralDivergences: divergences.length,
    }),
    perf: perfFromSamples(input.mockLatencySamplesMs),
    mutation: mutationFromCounts(input.mutation),
    cost: costFromSamples(input.mockCostSamplesUsd),
    latency: latencyFromSamples(input.mockLatencySamplesMs),
    token: tokenFromSamples({
      promptTokens: input.mockPromptTokenSamples,
      completionTokens: input.mockCompletionTokenSamples,
    }),
    accuracy: accuracyFromSamples({ samples: accuracySamples, method: 'jaccard' }),
    notes: renderNotes(divergences, input.opsUnderTest, {
      embeddingMeanSimilarity,
      retrievalMeanF1,
      answerMeanJaccard,
    }),
  });

  const verdict = evaluateReleaseGate(report);
  return {
    divergences,
    report,
    verdict,
    markdown: emitMarkdown({ report, verdict }),
    json: emitJson(report),
    extras: { embeddingMeanSimilarity, retrievalMeanF1, answerMeanJaccard },
  };
}

function compareTraces(mock: TraceEvent[], real: TraceEvent[]): TraceEvent[] {
  const divergences: TraceEvent[] = [];
  const mockByOp = groupByOp(mock);
  const realByOp = groupByOp(real);
  for (const [op, mockEntries] of mockByOp) {
    const realEntries = realByOp.get(op) ?? [];
    const mockOk = mockEntries.some((e) => e.ok);
    const realOk = realEntries.some((e) => e.ok);
    if (mockOk !== realOk) {
      divergences.push({
        op,
        ok: false,
        errorKind: 'BEHAVIORAL_DIVERGENCE',
        detail: {
          mockOk,
          realOk,
          realErrorKinds: realEntries.map((e) => e.errorKind).filter(Boolean),
        },
      });
    }
    if (mockOk && realOk) {
      const mockOk1 = mockEntries.find((e) => e.ok);
      const realOk1 = realEntries.find((e) => e.ok);
      const mockHits = extractHitDocIds(mockOk1);
      const realHits = extractHitDocIds(realOk1);
      if (mockHits !== undefined && realHits !== undefined && !arraysEqual(mockHits, realHits)) {
        divergences.push({
          op,
          ok: false,
          errorKind: 'RETRIEVAL_ORDER_DIVERGENCE',
          detail: { mockHits, realHits },
        });
      }
    }
  }
  for (const [op, realEntries] of realByOp) {
    if (!mockByOp.has(op)) {
      divergences.push({
        op,
        ok: false,
        errorKind: 'MOCK_MISSING_OP',
        detail: { realEntries },
      });
    }
  }
  return divergences;
}

function extractHitDocIds(event: TraceEvent | undefined): string[] | undefined {
  const value = event?.detail?.['hitDocIds'];
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
    ? (value as string[])
    : undefined;
}

function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false;
  return true;
}

function groupByOp(events: TraceEvent[]): Map<string, TraceEvent[]> {
  const out = new Map<string, TraceEvent[]>();
  for (const e of events) {
    const list = out.get(e.op) ?? [];
    list.push(e);
    out.set(e.op, list);
  }
  return out;
}

function countCoveredOps(mock: TraceEvent[], opsUnderTest: string[]): number {
  const observed = new Set(mock.filter((e) => e.ok).map((e) => e.op));
  return opsUnderTest.filter((op) => observed.has(op)).length;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function renderNotes(
  divergences: TraceEvent[],
  opsUnderTest: string[],
  extras: {
    embeddingMeanSimilarity: number;
    retrievalMeanF1: number;
    answerMeanJaccard: number;
  },
): string {
  const extraLines = [
    `Embedding cosine similarity (real vs mock, mean): ${extras.embeddingMeanSimilarity.toFixed(3)}.`,
    `Retrieval F1 (top-5, mean): ${extras.retrievalMeanF1.toFixed(3)}.`,
    `Answer Jaccard similarity (real vs mock, mean): ${extras.answerMeanJaccard.toFixed(3)}.`,
  ].join(' ');
  if (divergences.length === 0) {
    return [`No behavioral divergences observed across ${opsUnderTest.length} ops.`, extraLines].join(' ');
  }
  return [
    `Observed ${divergences.length} divergences across ${opsUnderTest.length} ops:`,
    ...divergences.map((d) => `- ${d.op}: ${d.errorKind}`),
    extraLines,
  ].join('\n');
}

/**
 * Drive a set of flows against both adapters, capturing traces + rolled up
 * metric samples. The real adapter may be skipped — divergences are counted
 * from the trace either way.
 */
export async function runAdapterMatrix(input: {
  mock: RagAdapter;
  real: RagAdapter;
  run: (adapter: RagAdapter) => Promise<void>;
}): Promise<{
  mockTraces: TraceEvent[];
  realTraces: TraceEvent[];
  mockCostSamplesUsd: number[];
  mockLatencySamplesMs: number[];
  mockPromptTokenSamples: number[];
  mockCompletionTokenSamples: number[];
}> {
  for (const adapter of [input.mock, input.real]) {
    try {
      await input.run(adapter);
    } catch {
      // Divergences captured in the trace; real-mode failure must not
      // abort the harness so mock coverage stays observable.
    }
  }
  const m = input.mock.metrics();
  const requests = Math.max(1, m.requests);
  const avgPrompt = Math.max(0, Math.round(m.totalPromptTokens / requests));
  const avgCompletion = Math.max(0, Math.round(m.totalCompletionTokens / requests));
  const avgCostUsd = m.totalCostUsd / requests;
  return {
    mockTraces: input.mock.traces(),
    realTraces: input.real.traces(),
    mockCostSamplesUsd: m.latencySamplesMs.map(() => avgCostUsd),
    mockLatencySamplesMs: m.latencySamplesMs.slice(),
    mockPromptTokenSamples: m.latencySamplesMs.map(() => avgPrompt),
    mockCompletionTokenSamples: m.latencySamplesMs.map(() => avgCompletion),
  };
}

/**
 * Compute retrieval F1 between mock and real hits — both are ordered doc-id
 * arrays. F1 is symmetric, so a single number captures precision + recall.
 */
export function retrievalF1(mockHits: string[], realHits: string[]): number {
  if (mockHits.length === 0 && realHits.length === 0) return 1;
  const mockSet = new Set(mockHits);
  const realSet = new Set(realHits);
  let tp = 0;
  for (const id of mockSet) if (realSet.has(id)) tp += 1;
  const precision = mockSet.size === 0 ? 0 : tp / mockSet.size;
  const recall = realSet.size === 0 ? 0 : tp / realSet.size;
  if (precision + recall === 0) return 0;
  return (2 * precision * recall) / (precision + recall);
}

/** Compute mean cosine similarity between two vector lists (paired). */
export function meanCosine(a: number[][], b: number[][]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  const scores: number[] = [];
  for (let i = 0; i < a.length; i += 1) {
    const va = a[i];
    const vb = b[i];
    if (va === undefined || vb === undefined) continue;
    if (va.length !== vb.length) continue;
    scores.push(cosineSimilarity(va, vb));
  }
  return scores.length === 0 ? 0 : scores.reduce((s, v) => s + v, 0) / scores.length;
}
