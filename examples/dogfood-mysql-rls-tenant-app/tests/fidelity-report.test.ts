import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { OPS_UNDER_TEST, sampleOrgRow } from '../src/adapters/interface.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/flows/fidelity.js';
import {
  driveAuditIntegrityFlow,
  driveBypassAuditFlow,
  driveCrossTenantRefuseFlow,
  driveFidelityFlow,
  driveTenantInjectionFlow,
} from '../src/flows/mysql-flows.js';

async function runFull(
  adapter: Parameters<typeof driveTenantInjectionFlow>[0],
): Promise<void> {
  try {
    await driveTenantInjectionFlow(adapter, [
      sampleOrgRow({ organizationId: 'o1', tenantId: 't-a' }),
      sampleOrgRow({ organizationId: 'o2', tenantId: 't-b' }),
    ]);
    await driveCrossTenantRefuseFlow(adapter, {
      context: { tenantId: 't-a', actorId: 'user-1' },
      orgs: [sampleOrgRow({ organizationId: 'o3', tenantId: 't-a' })],
      intruderTenantId: 't-b',
    });
    await driveBypassAuditFlow(adapter, {
      supportRoleId: 'support-1',
      reason: 'fidelity-harness',
      ops: [{ tenantId: 't-a', operation: 'read' }],
    });
    await driveAuditIntegrityFlow(adapter);
    await driveFidelityFlow(adapter);
  } catch {
    // divergences captured in traces
  }
}

describe('dogfood-mysql-rls-tenant-app — fidelity harness', () => {
  it('T-DMF-001 mock adapter covers all 5 ops when driven end-to-end', async () => {
    const mock = makeMockAdapter();
    const real = await makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: runFull,
    });
    const output = runFidelityHarness({
      provider: '@kiwa-test/orm/mysql-rls-dogfood',
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
      testCount: { behavior: 24, integration: 6, e2e: 5 },
      mutation: { mutations: 30, killed: 22 },
    });

    expect(output.report.fidelity.mockCoveredMethods).toBe(5);
    expect(output.report.fidelity.realTotalMethods).toBe(5);
    expect(output.verdict.axesEvaluated).toBe(7);
    await mock.reset();
    await real.reset();
  });

  it('T-DMF-002 divergences drop to 0 when real matches mock trace', async () => {
    const mock = makeMockAdapter();
    // Simulate a "matching" real by driving the mock as if it were real
    // — this proves the fidelity harness collapses divergences when the
    // 2 traces agree per-op.
    const shadow = makeMockAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real: shadow,
      run: runFull,
    });
    const output = runFidelityHarness({
      provider: '@kiwa-test/orm/mysql-rls-dogfood',
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
      testCount: { behavior: 24, integration: 6, e2e: 5 },
      mutation: { mutations: 30, killed: 22 },
    });
    expect(output.divergences).toHaveLength(0);
    expect(output.report.fidelity.behavioralDivergences).toBe(0);
    await mock.reset();
    await shadow.reset();
  });

  it('T-DMF-003 markdown output contains the release gate verdict', async () => {
    const mock = makeMockAdapter();
    const real = await makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: runFull,
    });
    const output = runFidelityHarness({
      provider: '@kiwa-test/orm/mysql-rls-dogfood',
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
      testCount: { behavior: 24, integration: 6, e2e: 5 },
      mutation: { mutations: 30, killed: 22 },
    });
    expect(output.markdown).toMatch(/Quality Report/);
    expect(output.markdown).toMatch(/Release gate/);
    await mock.reset();
    await real.reset();
  });
});
