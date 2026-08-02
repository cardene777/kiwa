import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  makeMockAdapter,
  sampleOrderEvent,
  sampleUserProfile,
} from '../../src/adapters/mock.js';
import {
  driveJetStreamFlow,
  driveKVFlow,
  driveObjectFlow,
  driveRoutingFlow,
} from '../../src/flows/nats-flows.js';

const MODULE = 'dogfood-nats-jetstream';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: driveJetStream / driveKV / driveObject / driveRouting',
    async () => {
      const result = await runPerf3Layer({
        moduleName: MODULE,
        // GC を呼べない測定は解放される一時使用まで拾い、memory 上限との
        // 比較が成立しない。 測れていない実行を pass にしない (#1708)。
        requireGc: true,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'driveJetStream',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveJetStreamFlow(adapter, [sampleOrderEvent({ orderId: 'p1' })]);
              await adapter.reset();
            },
          },
          {
            name: 'driveKV',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveKVFlow(adapter, [sampleUserProfile({ userId: 'p1' })]);
              await adapter.reset();
            },
          },
          {
            name: 'driveObject',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveObjectFlow(adapter);
              await adapter.reset();
            },
            // 本 file の 4 op のうち、 typed array を確保するのはこの op だけ
            // (`new Uint8Array(1024)` を 1 反復 1 個)。 200 反復で 204,800 B の
            // 一時確保になり、 上限 102,400 B の 2 倍を測定区間の中で作って捨てる。
            //
            // 増分は反復数に比例しない。 反復数 100 / 200 / 400 で 3 回ずつ測ると
            // -283,669 から +270,115 B まで振れ、 100 反復の方が 400 反復より
            // 大きく振れることもある (#1765 実測)。 op を単独で 100 / 200 / 400 反復
            // 回すと 3 条件とも増分 0 B で、 反復ごとの保持は無い。
            //
            // つまりこの op の増分は保持量ではなく、 一時確保のどこまでが
            // 測定区間の GC に間に合ったかを見ている。 判定が実装と無関係に決まる。
            memoryGateWaived:
              '一時確保 204,800 B が上限 102,400 B を超え、増分が反復数に比例しない (#1765)',
          },
          {
            name: 'driveRouting',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveRoutingFlow(adapter);
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
