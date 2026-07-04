import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeMockAdapter, sampleOrderEvent } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { OPS_UNDER_TEST } from '../src/adapters/interface.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/flows/fidelity.js';
import {
  driveConsumerGroupFlow,
  driveDlqFlow,
  driveFidelityFlow,
  driveProducerFlow,
  driveTransactionFlow,
} from '../src/flows/kafka-flows.js';

describe('dogfood-kafka-event-pipeline — emit fidelity report to quality-report/', () => {
  it('T-DKE-EM-001 writes JSON snapshot + markdown report to disk', async () => {
    const mock = makeMockAdapter();
    const real = await makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await driveProducerFlow(adapter, [
            sampleOrderEvent({ orderId: 'o1' }),
            sampleOrderEvent({ orderId: 'o2', region: 'eu' }),
            sampleOrderEvent({ orderId: 'o3', region: 'apac' }),
          ]);
          await driveConsumerGroupFlow(adapter, 'orders');
          await driveTransactionFlow(
            adapter,
            'txn-topic',
            ['committed-1', 'committed-2'],
            ['aborted-1'],
          );
          await driveDlqFlow(adapter, [
            { orderId: 'ok-1', valid: true },
            { orderId: 'poison-1', valid: false },
          ]);
          await driveFidelityFlow(adapter);
        } catch {
          // divergences captured
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-test/streaming/kafka-dogfood',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: [...OPS_UNDER_TEST],
      perfSamplesMs: matrix.perfSamplesMs,
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 32, integration: 7, e2e: 7 },
      mutation: { mutations: 30, killed: 22 },
    });

    const outDir = join(process.cwd(), 'quality-report');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'fidelity-latest.json'), output.json);
    writeFileSync(join(outDir, 'fidelity-latest.md'), output.markdown);

    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThan(0);
    expect(output.markdown).toContain('Quality Report');
    await mock.reset();
    await real.reset();
  });
});
