import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import {
  driveD1NotesFlow,
  driveExecutionCtxFlow,
  driveKvCounterFlow,
  driveR2UploadFlow,
  driveRouteVsRpcFlow,
} from '../../src/flows/hono-flows.js';

const MODULE = 'dogfood-hono-workers-rpc';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: driveRoute / driveKv / driveD1 / driveR2 / driveExecutionCtx',
    async () => {
      const result = await runPerf3Layer({
        moduleName: MODULE,
        // GC を呼べない測定は解放される一時使用まで拾い、memory 上限との
        // 比較が成立しない。 測れていない実行を pass にしない (#1708)。
        requireGc: true,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'driveRoute',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveRouteVsRpcFlow(adapter, 'GET', '/health');
              await adapter.reset();
            },
          },
          {
            name: 'driveKv',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveKvCounterFlow(adapter, 2);
              await adapter.reset();
            },
          },
          {
            name: 'driveD1',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveD1NotesFlow(adapter, [{ id: 1, title: 'x' }]);
              await adapter.reset();
            },
          },
          {
            name: 'driveR2',
            serialP95CapMs: 100,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveR2UploadFlow(adapter, [{ key: 'k', contents: 'v' }]);
              await adapter.reset();
            },
          },
          {
            name: 'driveExecutionCtx',
            serialP95CapMs: 50,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveExecutionCtxFlow(adapter, 2);
              await adapter.reset();
            },
          },
        ],
      });
      expect(result.allPassed).toBe(true);
    },
    120_000,
  );
});
