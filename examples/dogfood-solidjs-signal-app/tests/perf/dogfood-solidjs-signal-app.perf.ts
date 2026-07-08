import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa/perf-harness';
import path from 'node:path';
import { describe, it } from 'vitest';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import {
  driveCounterFlow,
  driveTodosFlow,
  driveResourceFlow,
  driveSuspenseFlow,
} from '../../src/flows/signal-flows.js';

const MODULE = 'dogfood-solidjs-signal-app';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: driveCounter / driveTodos / driveResource / driveSuspense',
    async () => {
      await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'driveCounter',
            serialP95CapMs: 50,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveCounterFlow(adapter, 5);
              await adapter.reset();
            },
          },
          {
            name: 'driveTodos',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveTodosFlow(adapter, ['a', 'b', 'c'], [
                { kind: 'markAll', completed: true },
              ]);
              await adapter.reset();
            },
          },
          {
            name: 'driveResource',
            serialP95CapMs: 100,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveResourceFlow(adapter, async () => ({
                id: 'u1',
                displayName: 'Ada',
                email: 'ada@ex.com',
              }));
              await adapter.reset();
            },
          },
          {
            name: 'driveSuspense',
            serialP95CapMs: 150,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveSuspenseFlow(adapter, 1);
              await adapter.reset();
            },
          },
        ],
      });
    },
    120_000,
  );
});
