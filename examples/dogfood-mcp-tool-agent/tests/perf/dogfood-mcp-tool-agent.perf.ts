import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import {
  callEachToolDirectly,
  performHandshakeAndDiscover,
  runClaudeMcpChain,
} from '../../src/flows/agent-flows.js';

const MODULE = 'dogfood-mcp-tool-agent';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: handshake+list / callEach / claudeChain',
    async () => {
      const result = await runPerf3Layer({
        moduleName: MODULE,
        // GC を呼べない測定は解放される一時使用まで拾い、memory 上限との
        // 比較が成立しない。 測れていない実行を pass にしない (#1708)。
        requireGc: true,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'handshakeAndDiscover',
            serialP95CapMs: 20,
            fn: async () => {
              const adapter = makeMockAdapter();
              await performHandshakeAndDiscover(adapter);
            },
          },
          {
            name: 'callEachToolDirectly',
            serialP95CapMs: 30,
            fn: async () => {
              const adapter = makeMockAdapter();
              await callEachToolDirectly(adapter);
            },
          },
          {
            name: 'runClaudeMcpChain',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await runClaudeMcpChain(adapter);
            },
          },
        ],
        serialIterations: 60,
      });

      for (const outcome of result.outcomes) {
        expect.soft(outcome.serialGatePassed, `${outcome.name} serial p95`).toBe(true);
        expect.soft(outcome.concurrentGatePassed, `${outcome.name} concurrent p95`).toBe(true);
        expect.soft(outcome.memoryGatePassed, `${outcome.name} memory arrayBuffers`).toBe(true);
      }
      expect(result.allPassed).toBe(true);
    },
    180_000,
  );
});
