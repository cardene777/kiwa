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
import {
  runOrderedThreeToolFlow,
  runParallelWeatherFlow,
  validateAllToolSchemas,
} from '../../src/flows/agent-flows.js';
import { makeMockAdapter } from '../../src/adapters/mock.js';

const MODULE = 'dogfood-openai-tool-agent';
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
    'measures validateToolSchemas / runToolLoop / runParallelToolCall and emits a perf report',
    async () => {
      const validateToolSchemas = await measure({
        name: 'validateToolSchemas',
        iterations: 100,
        warmup: 5,
        fn: async () => {
          const adapter = makeMockAdapter();
          await validateAllToolSchemas(adapter);
        },
      });
      const runToolLoop = await measure({
        name: 'runToolLoop',
        iterations: 30,
        warmup: 5,
        fn: async () => {
          const adapter = makeMockAdapter();
          await runOrderedThreeToolFlow(adapter);
        },
      });
      const runParallelToolCall = await measure({
        name: 'runParallelToolCall',
        iterations: 30,
        warmup: 5,
        fn: async () => {
          const adapter = makeMockAdapter();
          await runParallelWeatherFlow(adapter);
        },
      });

      const results: BaselineMap = {
        validateToolSchemas,
        runToolLoop,
        runParallelToolCall,
      };
      const baseline = loadBaselineMap(BASELINE_PATH);
      if (COMPARE_BASELINE && baseline === null) {
        throw new Error(`Missing perf baseline for ${MODULE}: ${BASELINE_PATH}`);
      }

      const gates = {
        validateToolSchemas: evaluatePerfGate({ result: validateToolSchemas, thresholds: { p95Ms: 35 } }),
        runToolLoop: evaluatePerfGate({ result: runToolLoop, thresholds: { p95Ms: 120 } }),
        runParallelToolCall: evaluatePerfGate({ result: runParallelToolCall, thresholds: { p95Ms: 80 } }),
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
      lines.push('## validateToolSchemas');
      lines.push('');
      lines.push(emitPerfReport(validateToolSchemas, { baseline: baseline?.validateToolSchemas, includeSamples: true }));
      lines.push('## runToolLoop');
      lines.push('');
      lines.push(emitPerfReport(runToolLoop, { baseline: baseline?.runToolLoop, includeSamples: true }));
      lines.push('## runParallelToolCall');
      lines.push('');
      lines.push(emitPerfReport(runParallelToolCall, { baseline: baseline?.runParallelToolCall, includeSamples: true }));

      writeReport(REPORT_PATH, lines.join('\n'));
      if (WRITE_BASELINE || baseline === null) {
        saveBaselineMap(BASELINE_PATH, results);
      }

      expect(existsSync(REPORT_PATH)).toBe(true);
    },
    120_000,
  );
});

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
