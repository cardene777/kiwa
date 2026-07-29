import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import {
  driveEdgeEnvFlow,
  driveHeadFlow,
  driveIslandFlow,
  driveRouteFlow,
} from '../../src/flows/fresh-flows.js';

const MODULE = 'dogfood-fresh-islands';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: driveRoute / driveIsland / driveHead / driveEdgeEnv',
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
              await driveRouteFlow(adapter, '/greet/kiwa', 'GET');
              await adapter.reset();
            },
          },
          {
            name: 'driveIsland',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveIslandFlow(
                adapter,
                'Counter',
                { label: 'x', start: 0 },
                [{ event: 'click' }, { event: 'click' }],
              );
              await adapter.reset();
            },
          },
          {
            name: 'driveHead',
            serialP95CapMs: 50,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveHeadFlow(adapter, [
                { title: 'A' },
                { title: 'B' },
              ]);
              await adapter.reset();
            },
          },
          {
            name: 'driveEdgeEnv',
            serialP95CapMs: 100,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveEdgeEnvFlow(adapter, { KIWA_FRESH_MODE: 'x' }, '/e');
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
