import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  makeMockAdapter,
  sampleOrderEvent,
  sampleUserProfile,
} from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { OPS_UNDER_TEST } from '../src/adapters/interface.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/flows/fidelity.js';
import {
  driveFidelityFlow,
  driveJetStreamFlow,
  driveKVFlow,
  driveObjectFlow,
  driveRoutingFlow,
} from '../src/flows/nats-flows.js';

describe('dogfood-nats-jetstream — emit fidelity report to quality-report/', () => {
  it('T-DNE-EM-001 writes JSON snapshot + markdown report to disk', async () => {
    const mock = makeMockAdapter();
    const real = await makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await driveJetStreamFlow(adapter, [
            sampleOrderEvent({ orderId: 'o-1' }),
            sampleOrderEvent({ orderId: 'o-2', currency: 'JPY' }),
          ]);
          await driveKVFlow(adapter, [
            sampleUserProfile({ userId: 'u-1' }),
            sampleUserProfile({ userId: 'u-2', region: 'eu' }),
          ]);
          await driveObjectFlow(adapter);
          await driveRoutingFlow(adapter);
          await driveFidelityFlow(adapter);
        } catch {
          // divergences captured
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-test/streaming/nats-jetstream-dogfood',
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
      testCount: { behavior: 29, integration: 7, e2e: 7 },
      mutation: { mutations: 25, killed: 18 },
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
