import {
  assembleReport,
  coverageFromV8Summary,
  emitJson,
  emitMarkdown,
  evaluateReleaseGate,
  fidelityFromMethodCounts,
  mutationFromCounts,
  perfFromSamples,
  testCountFromCategories,
  type QualityReport,
  type ReleaseGateVerdict,
} from '@kiwa/quality-metrics';

/**
 * PoC — a small "quality report builder" that a v1.10 provider (auth /
 * queue / cache / contract-rust) would use to publish a
 * `docs/quality-reports/{package}-{version}.md` file.
 *
 * The builder deliberately keeps every axis as a pure input so tests can
 * drive it with known values.
 */

export interface RawInputs {
  provider: string;
  version: string;
  v8Summary: {
    lines: { pct: number };
    branches: { pct: number };
    functions: { pct: number };
  };
  testCounts: { behavior: number; integration: number; e2e: number };
  fidelity: { mockCoveredMethods: number; realTotalMethods: number; behavioralDivergences?: number };
  perfSamplesMs: number[];
  mutation: { mutations: number; killed: number };
  notes?: string;
}

export interface BuildOutput {
  report: QualityReport;
  verdict: ReleaseGateVerdict;
  markdown: string;
  json: string;
}

export function buildReport(input: RawInputs): BuildOutput {
  const fidelityArgs: Parameters<typeof fidelityFromMethodCounts>[0] = {
    mockCoveredMethods: input.fidelity.mockCoveredMethods,
    realTotalMethods: input.fidelity.realTotalMethods,
  };
  if (input.fidelity.behavioralDivergences !== undefined) {
    fidelityArgs.behavioralDivergences = input.fidelity.behavioralDivergences;
  }
  const assembleArgs: Parameters<typeof assembleReport>[0] = {
    provider: input.provider,
    version: input.version,
    coverage: coverageFromV8Summary(input.v8Summary),
    testCount: testCountFromCategories(input.testCounts),
    fidelity: fidelityFromMethodCounts(fidelityArgs),
    perf: perfFromSamples(input.perfSamplesMs),
    mutation: mutationFromCounts(input.mutation),
  };
  if (input.notes !== undefined) assembleArgs.notes = input.notes;
  const report = assembleReport(assembleArgs);
  const verdict = evaluateReleaseGate(report);
  return {
    report,
    verdict,
    markdown: emitMarkdown({ report, verdict }),
    json: emitJson(report),
  };
}
