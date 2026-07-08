import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa/perf-harness';
import path from 'node:path';
import { describe, it } from 'vitest';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import { sampleOrgRow } from '../../src/adapters/interface.js';
import {
  driveAuditIntegrityFlow,
  driveBypassAuditFlow,
  driveCrossTenantRefuseFlow,
  driveTenantInjectionFlow,
} from '../../src/flows/mysql-flows.js';

const MODULE = 'dogfood-mysql-rls-tenant-app';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: driveTenantInjection / driveCrossTenantRefuse / driveBypassAudit / driveAuditIntegrity',
    async () => {
      await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'driveTenantInjection',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveTenantInjectionFlow(adapter, [
                sampleOrgRow({ organizationId: 'p1', tenantId: 't-a' }),
              ]);
              await adapter.reset();
            },
          },
          {
            name: 'driveCrossTenantRefuse',
            serialP95CapMs: 100,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveCrossTenantRefuseFlow(adapter, {
                context: { tenantId: 't-a', actorId: 'perf-user' },
                orgs: [sampleOrgRow({ organizationId: 'p2', tenantId: 't-a' })],
                intruderTenantId: 't-b',
              });
              await adapter.reset();
            },
          },
          {
            name: 'driveBypassAudit',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveBypassAuditFlow(adapter, {
                supportRoleId: 'support-perf',
                reason: 'perf',
                ops: [{ tenantId: 't-a', operation: 'read' }],
              });
              await adapter.reset();
            },
          },
          {
            name: 'driveAuditIntegrity',
            serialP95CapMs: 100,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveTenantInjectionFlow(adapter, [
                sampleOrgRow({ organizationId: 'p3', tenantId: 't-a' }),
              ]);
              await driveAuditIntegrityFlow(adapter);
              await adapter.reset();
            },
          },
        ],
      });
    },
    120_000,
  );
});
