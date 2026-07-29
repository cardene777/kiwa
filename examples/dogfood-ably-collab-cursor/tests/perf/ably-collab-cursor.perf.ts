import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../../src/adapters/mock.js';

const MODULE = 'dogfood-ably-collab-cursor';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: joinBoard / moveCursor / rewindHistory / getPresence',
    async () => {
      const adapter = makeMockAdapter();
      const sharedBoard = 'board-shared';
      await adapter.joinBoard({ board: sharedBoard, userId: 'u1' });

      let joinCounter = 0;
      const result = await runPerf3Layer({
        moduleName: MODULE,
        // GC を呼べない測定は解放される一時使用まで拾い、memory 上限との
        // 比較が成立しない。 測れていない実行を pass にしない (#1708)。
        requireGc: true,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'joinBoard',
            serialP95CapMs: 50,
            fn: async () => {
              // bounded rotation over 5 boards to exercise the join path
              const boardKey = `board-perf-${(joinCounter += 1) % 5}`;
              await adapter.joinBoard({ board: boardKey, userId: 'u-perf' });
            },
          },
          {
            name: 'moveCursor',
            serialP95CapMs: 100,
            fn: async () => {
              await adapter.moveCursor({
                board: sharedBoard,
                userId: 'u1',
                moveIntervalsMs: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
              });
            },
          },
          {
            name: 'rewindHistory',
            serialP95CapMs: 30,
            fn: async () => {
              await adapter.rewindHistory({ board: sharedBoard, limit: 20 });
            },
          },
          {
            name: 'getPresence',
            serialP95CapMs: 30,
            fn: async () => {
              await adapter.getPresence({ board: sharedBoard });
            },
          },
        ],
        serialIterations: 40,
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
