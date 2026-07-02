import {
  createAnthropicMock,
  createLangchainMock,
  createOpenAIMock,
  createVercelAiMock,
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

const MODULE = 'ai-llm';
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
    'measures mock SDK call latency and emits a perf report',
    async () => {
      const anthropic = createAnthropicMock({
        artificialLatencyMs: 8,
        responses: {
          ping: { content: 'pong', usage: { promptTokens: 4, completionTokens: 4 } },
        },
      });
      const openai = createOpenAIMock({
        artificialLatencyMs: 8,
        responses: {
          ping: { content: 'pong', usage: { promptTokens: 4, completionTokens: 4 } },
        },
      });
      const vercel = createVercelAiMock({
        artificialLatencyMs: 8,
        responses: {
          ping: { content: 'pong', usage: { promptTokens: 4, completionTokens: 4 } },
        },
      });
      const langchain = createLangchainMock({
        artificialLatencyMs: 8,
        responses: {
          ping: { content: 'pong', usage: { promptTokens: 4, completionTokens: 4 } },
        },
      });

      const anthropicMessagesCreate = await measure({
        name: 'anthropic.messages.create',
        iterations: 100,
        warmup: 5,
        fn: async () => {
          await anthropic.messages.create({
            messages: [{ role: 'user', content: 'ping' }],
          });
        },
      });
      const openAiChatCompletionsCreate = await measure({
        name: 'openai.chat.completions.create',
        iterations: 100,
        warmup: 5,
        fn: async () => {
          await openai.chat.completions.create({
            messages: [{ role: 'user', content: 'ping' }],
          });
        },
      });
      const vercelGenerateText = await measure({
        name: 'vercel.generateText',
        iterations: 100,
        warmup: 5,
        fn: async () => {
          await vercel.generateText({
            messages: [{ role: 'user', content: 'ping' }],
          });
        },
      });
      const langchainInvoke = await measure({
        name: 'langchain.invoke',
        iterations: 100,
        warmup: 5,
        fn: async () => {
          await langchain.invoke([{ role: 'human', content: 'ping' }]);
        },
      });

      const results: BaselineMap = {
        anthropicMessagesCreate,
        openAiChatCompletionsCreate,
        vercelGenerateText,
        langchainInvoke,
      };
      const baseline = loadBaselineMap(BASELINE_PATH);
      if (COMPARE_BASELINE && baseline === null) {
        throw new Error(`Missing perf baseline for ${MODULE}: ${BASELINE_PATH}`);
      }

      const gates = {
        anthropicMessagesCreate: evaluatePerfGate({ result: anthropicMessagesCreate, thresholds: { p95Ms: 40 } }),
        openAiChatCompletionsCreate: evaluatePerfGate({ result: openAiChatCompletionsCreate, thresholds: { p95Ms: 40 } }),
        vercelGenerateText: evaluatePerfGate({ result: vercelGenerateText, thresholds: { p95Ms: 40 } }),
        langchainInvoke: evaluatePerfGate({ result: langchainInvoke, thresholds: { p95Ms: 40 } }),
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
      lines.push('## anthropic.messages.create');
      lines.push('');
      lines.push(emitPerfReport(anthropicMessagesCreate, { baseline: baseline?.anthropicMessagesCreate, includeSamples: true }));
      lines.push('## openai.chat.completions.create');
      lines.push('');
      lines.push(emitPerfReport(openAiChatCompletionsCreate, { baseline: baseline?.openAiChatCompletionsCreate, includeSamples: true }));
      lines.push('## vercel.generateText');
      lines.push('');
      lines.push(emitPerfReport(vercelGenerateText, { baseline: baseline?.vercelGenerateText, includeSamples: true }));
      lines.push('## langchain.invoke');
      lines.push('');
      lines.push(emitPerfReport(langchainInvoke, { baseline: baseline?.langchainInvoke, includeSamples: true }));

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
