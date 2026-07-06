/**
 * Playwright e2e — v1 legacy flow (v1.32-3).
 *
 * Drives the /tenant-injection + /cross-tenant-refuse + /bypass-audit +
 * /audit-integrity + /emit-fidelity routes end-to-end against the ad-hoc
 * HTTP server. Assertions cover the v1 (v1.26-3) AC axis "RLS + tenant
 * isolation + bypass window + audit chain full journey".
 */

import { chromium, expect, test, type BrowserContext } from '@playwright/test';
import { bootAdapterServer, playwrightBrowsersInstalled } from './fixture.js';

test.describe('v1 legacy — RLS + tenant isolation + bypass + audit chain full journey', () => {
  test.skip(
    !playwrightBrowsersInstalled(),
    'Playwright browsers not installed — run `pnpm playwright install chromium`',
  );

  let servers: { close: () => Promise<void> }[] = [];
  let contexts: BrowserContext[] = [];

  test.beforeEach(() => {
    servers = [];
    contexts = [];
  });

  test.afterEach(async () => {
    for (const ctx of contexts) await ctx.close();
    for (const s of servers) await s.close();
  });

  test('v1 legacy routes drive together', async () => {
    const { origin, close } = await bootAdapterServer();
    servers.push({ close });
    const browser = await chromium.launch();
    const ctx = await browser.newContext();
    contexts.push(ctx);
    const page = await ctx.newPage();
    await page.goto(origin);

    const combined = await page.evaluate(async (base: string) => {
      const inj = await fetch(`${base}/tenant-injection`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          orgs: [
            { organizationId: 'e1', tenantId: 't-a' },
            { organizationId: 'e2', tenantId: 't-b' },
          ],
        }),
      });
      const injBody = (await inj.json()) as {
        ok: boolean;
        result: { writes: number; policyInstalled: boolean };
      };
      const cross = await fetch(`${base}/cross-tenant-refuse`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          context: { tenantId: 't-a', actorId: 'user-1' },
          orgs: [{ organizationId: 'e3', tenantId: 't-a' }],
          intruderTenantId: 't-b',
        }),
      });
      const crossBody = (await cross.json()) as {
        ok: boolean;
        result: { refusals: number; refusalKind: string };
      };
      const bypass = await fetch(`${base}/bypass-audit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          supportRoleId: 'support-e2e',
          reason: 'incident-e2e',
          ops: [{ tenantId: 't-a', operation: 'read' }],
        }),
      });
      const bypassBody = (await bypass.json()) as {
        ok: boolean;
        result: { bypassOps: number; reArmedAfterBypass: boolean };
      };
      const audit = await fetch(`${base}/audit-integrity`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      const auditBody = (await audit.json()) as {
        ok: boolean;
        result: { chainOk: boolean; totalRecords: number };
      };
      return { injBody, crossBody, bypassBody, auditBody };
    }, origin);

    expect(combined.injBody.ok).toBe(true);
    expect(combined.injBody.result.writes).toBe(2);
    expect(combined.injBody.result.policyInstalled).toBe(true);

    expect(combined.crossBody.ok).toBe(true);
    expect(combined.crossBody.result.refusals).toBe(1);
    expect(combined.crossBody.result.refusalKind).toBe('CROSS_TENANT_REFUSED');

    expect(combined.bypassBody.ok).toBe(true);
    expect(combined.bypassBody.result.bypassOps).toBe(1);
    expect(combined.bypassBody.result.reArmedAfterBypass).toBe(true);

    expect(combined.auditBody.ok).toBe(true);
    expect(combined.auditBody.result.chainOk).toBe(true);
    expect(combined.auditBody.result.totalRecords).toBeGreaterThan(0);

    await browser.close();
  });
});
