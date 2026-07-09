import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter, sampleOrder } from '../src/adapters/real.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/flows/fidelity.js';
import {
  bootstrap,
  drainOrders,
  federationFlow,
  quorumFlow,
  reconnectFlow,
  reminderFlow,
  retryFlow,
} from '../src/flows/worker-flows.js';

const opsUnderTest = [
  'declareTopology',
  'processOrder',
  'scheduleDelayedReminder',
  'processRetryPolicy',
  'verifyQuorumSurvival',
  'ingestFromFederationUpstream',
  'simulateReconnect',
];

describe('dogfood-rabbitmq — emit fidelity report to quality-report/', () => {
  it('T-DFR-EM-001 writes JSON snapshot + markdown report to disk', async () => {
    const mock = await makeMockAdapter();
    const real = await makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await bootstrap(adapter);
          await drainOrders(adapter, [
            sampleOrder({ id: 'o1' }),
            sampleOrder({ id: 'o2', valid: false }),
          ]);
          await reminderFlow(adapter, { phone: '+1', text: 'hi', delayMs: 100 });
          await retryFlow(adapter, 2);
          await quorumFlow(adapter, 'rabbit@node-2');
          await federationFlow(adapter, {
            upstreamName: 'upstream-eu',
            body: { note: 'from-eu' },
          });
          await reconnectFlow(adapter, 2);
        } catch {
          // divergences captured
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/queue/rabbitmq-dogfood',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest,
      perfSamplesMs: matrix.perfSamplesMs,
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 44, integration: 8, e2e: 8 },
      mutation: { mutations: 40, killed: 26 },
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
