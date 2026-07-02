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
import { makeMockAdapter } from '../../src/adapters/mock.js';
import {
  askWeatherAndMath,
  greetUser,
  streamBedtimeStory,
} from '../../src/flows/chatbot-flows.js';

const MODULE = 'dogfood-anthropic-chatbot';
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
    'measures reply / replyStream / toolLoop and emits a perf report',
    async () => {
      const reply = await measure({
        name: 'reply',
        iterations: 100,
        warmup: 5,
        fn: async () => {
          const adapter = makeMockAdapter();
          await greetUser(adapter);
        },
      });
      const replyStream = await measure({
        name: 'replyStream',
        iterations: 30,
        warmup: 5,
        fn: async () => {
          const adapter = makeMockAdapter();
          await streamBedtimeStory(adapter);
        },
      });
      const toolLoop = await measure({
        name: 'toolLoop',
        iterations: 30,
        warmup: 5,
        fn: async () => {
          const adapter = makeMockAdapter();
          await askWeatherAndMath(adapter);
        },
      });

      const results: BaselineMap = {
        reply,
        replyStream,
        toolLoop,
      };
      const baseline = loadBaselineMap(BASELINE_PATH);
      if (COMPARE_BASELINE && baseline === null) {
        throw new Error(`Missing perf baseline for ${MODULE}: ${BASELINE_PATH}`);
      }

      const gates = {
        reply: evaluatePerfGate({ result: reply, thresholds: { p95Ms: 50 } }),
        replyStream: evaluatePerfGate({ result: replyStream, thresholds: { p95Ms: 80 } }),
        toolLoop: evaluatePerfGate({ result: toolLoop, thresholds: { p95Ms: 120 } }),
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
      lines.push('## reply');
      lines.push('');
      lines.push(emitPerfReport(reply, { baseline: baseline?.reply, includeSamples: true }));
      lines.push('## replyStream');
      lines.push('');
      lines.push(emitPerfReport(replyStream, { baseline: baseline?.replyStream, includeSamples: true }));
      lines.push('## toolLoop');
      lines.push('');
      lines.push(emitPerfReport(toolLoop, { baseline: baseline?.toolLoop, includeSamples: true }));

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
