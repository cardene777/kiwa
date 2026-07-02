import {
  diffReports,
  evaluateReleaseGate,
  type QualityReport,
} from '../../src/index.js';
import {
  defaultBaselinePath,
  detectRegression,
  emitPerfReport,
  evaluatePerfGate,
  measure,
  type MeasureResult,
} from '@kiwa-test/perf-harness';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MODULE = 'quality-metrics';
const BASELINE_PATH = defaultBaselinePath(MODULE);
const REPORT_PATH = path.join(
  resolveRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);
const WRITE_BASELINE = process.argv.includes('--baseline');
const COMPARE_BASELINE = process.argv.includes('--compare');

type BaselineMap = Record<string, MeasureResult>;

describe(MODULE, () => {
  it(
    'measures evaluateReleaseGate / diffReports and emits a perf report',
    async () => {
      const previous = baseReport();
      const current = baseReport({
        version: '0.2.0',
        coverage: { line: 95, branch: 90, function: 98 },
        testCount: { behavior: 30, integration: 8, e2e: 3, total: 41 },
        fidelity: { mockCoveredMethods: 9, realTotalMethods: 10, ratio: 90 },
        perf: { p50Ms: 3, p95Ms: 30, p99Ms: 60, samples: 100 },
        mutation: { mutations: 50, killed: 45, survived: 5, killRate: 90 },
      });

      const evaluateReleaseGatePerf = await measure({
        name: 'evaluateReleaseGate',
        iterations: 100,
        warmup: 5,
        fn: async () => {
          evaluateReleaseGate(current);
        },
      });
      const diffReportsPerf = await measure({
        name: 'diffReports',
        iterations: 100,
        warmup: 5,
        fn: async () => {
          diffReports(previous, current);
        },
      });

      const results: BaselineMap = {
        evaluateReleaseGate: evaluateReleaseGatePerf,
        diffReports: diffReportsPerf,
      };
      const baseline = loadBaselineMap(BASELINE_PATH);
      if (COMPARE_BASELINE && baseline === null) {
        throw new Error(`Missing perf baseline for ${MODULE}: ${BASELINE_PATH}`);
      }

      const gates = {
        evaluateReleaseGate: evaluatePerfGate({ result: evaluateReleaseGatePerf, thresholds: { p95Ms: 10 } }),
        diffReports: evaluatePerfGate({ result: diffReportsPerf, thresholds: { p95Ms: 10 } }),
      };

      const lines: string[] = [
        `# Perf Suite — ${MODULE}`,
        '',
        '| op | p95 | gate | regression | blockers |',
        '|---|---|---|---|---|',
      ];

      for (const [name, result] of Object.entries(results)) {
        const prior = baseline?.[name];
        const regression = prior
          ? detectRegression({ current: result, baseline: prior, threshold: 0.2 })
          : null;
        if (COMPARE_BASELINE && regression?.regressed) {
          throw new Error(`${MODULE}/${name} regressed by ${(regression.deltaPct * 100).toFixed(2)}%`);
        }

        const gate = gates[name as keyof typeof gates];
        lines.push(
          `| ${name} | ${result.p95.toFixed(2)}ms | ${gate.verdict.passed ? 'PASS' : 'FAIL'} | ${regression?.verdict ?? 'n/a'} | ${formatBlockers(gate.verdict.blockers)} |`,
        );
      }

      lines.push('');
      lines.push('## evaluateReleaseGate');
      lines.push('');
      lines.push(emitPerfReport(evaluateReleaseGatePerf, { baseline: baseline?.evaluateReleaseGate, includeSamples: true }));
      lines.push('## diffReports');
      lines.push('');
      lines.push(emitPerfReport(diffReportsPerf, { baseline: baseline?.diffReports, includeSamples: true }));

      writeReport(REPORT_PATH, lines.join('\n'));
      if (WRITE_BASELINE || baseline === null) {
        saveBaselineMap(BASELINE_PATH, results);
      }

      expect(existsSync(REPORT_PATH)).toBe(true);
    },
    120_000,
  );
});

function baseReport(overrides?: Partial<QualityReport>): QualityReport {
  return {
    provider: '@kiwa-test/example',
    version: '0.1.0',
    reportedAt: '2026-07-02T00:00:00Z',
    coverage: { line: 90, branch: 82, function: 95 },
    testCount: { behavior: 20, integration: 5, e2e: 2, total: 27 },
    fidelity: { mockCoveredMethods: 8, realTotalMethods: 10, ratio: 80 },
    perf: { p50Ms: 5, p95Ms: 50, p99Ms: 80, samples: 100 },
    mutation: { mutations: 40, killed: 28, survived: 12, killRate: 70 },
    ...overrides,
  };
}

function loadBaselineMap(filePath: string): BaselineMap | null {
  if (!existsSync(filePath)) {
    return null;
  }
  return JSON.parse(readFileSync(filePath, 'utf8')) as BaselineMap;
}

function saveBaselineMap(filePath: string, value: BaselineMap): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeReport(filePath: string, markdown: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${markdown}\n`, 'utf8');
}

function formatBlockers(blockers: Array<{ axis: string }>): string {
  return blockers.length === 0 ? 'none' : blockers.map((blocker) => blocker.axis).join(', ');
}

function resolveRepoRoot(start: string): string {
  let current = start;
  while (true) {
    const packageJsonPath = path.join(current, 'package.json');
    if (existsSync(packageJsonPath)) {
      const manifest = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { name?: string };
      if (manifest.name === 'kiwa-monorepo') {
        return current;
      }
    }
    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error(`Could not resolve repo root from ${start}`);
    }
    current = parent;
  }
}
