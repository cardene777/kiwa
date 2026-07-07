/**
 * Playwright e2e for the SIEM + incident-response + orchestrator flow
 * — a real Chromium browser drives the same siem / incident / ir-
 * orchestrator handlers the runtime mounts in production. The page UI
 * is not rendered as full React here — the test pumps JSON through the
 * ad-hoc HTTP server + asserts on the response shape, which mirrors how
 * a client would drive the same routes when the app is embedded in a
 * larger runtime.
 *
 * Fidelity axes exercised here (parallel to the vitest specs).
 *  - A Chromium BrowserContext drives a structured CIM audit event +
 *    tamper-evident seal + retention + correlation ceremony end to end.
 *  - A playbook + severity + escalate + forensics + post-mortem flow
 *    captures the incident-response axis end to end.
 *  - A combined orchestrator decide flow asserts the fused correlation
 *    → incident invariant + severity ladder.
 *
 * When Playwright browsers are not installed the tests skip with a
 * clear reason so `pnpm test:e2e` still passes on hosts without the
 * browser cache.
 */

import { existsSync } from 'node:fs';
import { chromium, expect, test } from '@playwright/test';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import { startNextServer } from '../../src/lib/next-server.js';

function browserAvailable(): boolean {
  try {
    const path = chromium.executablePath();
    return typeof path === 'string' && existsSync(path);
  } catch {
    return false;
  }
}

test.describe('security-siem-incident-app e2e — Chromium drives the SIEM + incident + orchestrator ceremony', () => {
  test.skip(
    !browserAvailable(),
    'Chromium binary not installed — run `pnpm exec playwright install chromium`',
  );

  test('structured + seal + retention + correlate + playbook + severity + escalate + forensics + post-mortem + orchestrator end to end', async () => {
    const adapter = makeMockAdapter({ latencyMs: 0 });
    const running = await startNextServer({ adapter });
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ baseURL: running.baseUrl });
    const page = await context.newPage();

    try {
      // Bootstrap SIEM session by calling structureEvent through the route.
      // We first need to start via direct adapter for isolation-free
      // session bookkeeping, since the route only exposes the granular ops.
      await adapter.startSiem({ sessionId: 'e2e-siem', target: 'siem-splunk' });

      const structureRes = await page.request.post(`${running.baseUrl}/siem`, {
        data: {
          kind: 'structure',
          sessionId: 'e2e-siem',
          actor: 'user-42',
          action: 'login',
          target: 'billing-api',
          timestamp: 1_700_000_000,
          result: 'failure',
        },
      });
      expect(structureRes.status()).toBe(200);
      const structureBody = await structureRes.json();
      expect(structureBody).toMatchObject({
        ok: true,
        kind: 'structure',
        eventId: 'evt-1',
      });

      const sealRes = await page.request.post(`${running.baseUrl}/siem`, {
        data: {
          kind: 'seal',
          sessionId: 'e2e-siem',
          previousHash: 'sha-0',
        },
      });
      expect(sealRes.status()).toBe(200);
      const sealBody = await sealRes.json();
      expect(sealBody).toMatchObject({ ok: true, kind: 'seal', eventCount: 1 });

      const retentionRes = await page.request.post(
        `${running.baseUrl}/siem`,
        {
          data: {
            kind: 'retention',
            sessionId: 'e2e-siem',
            hotDays: 7,
            warmDays: 30,
            coldDays: 335,
            legalHold: false,
          },
        },
      );
      expect(retentionRes.status()).toBe(200);
      const retentionBody = await retentionRes.json();
      expect(retentionBody).toMatchObject({
        ok: true,
        kind: 'retention',
        totalDays: 372,
      });

      const correlateRes = await page.request.post(
        `${running.baseUrl}/siem`,
        {
          data: {
            kind: 'correlate',
            sessionId: 'e2e-siem',
            ruleId: 'brute-force',
            requiredEventIds: ['evt-1'],
            windowMs: 60_000,
          },
        },
      );
      expect(correlateRes.status()).toBe(200);
      const correlateBody = await correlateRes.json();
      expect(correlateBody).toMatchObject({
        ok: true,
        kind: 'correlate',
        matched: true,
      });

      // Incident-response ceremony — playbook + severity + escalate + forensics + post-mortem.
      await adapter.startIncident({
        sessionId: 'e2e-ir',
        target: 'siem-splunk',
      });

      const playbookRes = await page.request.post(
        `${running.baseUrl}/incident`,
        {
          data: {
            kind: 'playbook',
            sessionId: 'e2e-ir',
            playbookId: 'suspicious-login',
            detectionSource: 'siem-correlation',
            initialAlert: 'brute-force detected',
          },
        },
      );
      expect(playbookRes.status()).toBe(200);
      const playbookBody = await playbookRes.json();
      expect(playbookBody).toMatchObject({
        ok: true,
        kind: 'playbook',
        playbookId: 'suspicious-login',
      });

      const severityRes = await page.request.post(
        `${running.baseUrl}/incident`,
        {
          data: {
            kind: 'severity',
            sessionId: 'e2e-ir',
            affectedUsers: 5_000,
            dataClassification: 'confidential',
            serviceDown: true,
          },
        },
      );
      expect(severityRes.status()).toBe(200);
      const severityBody = await severityRes.json();
      expect(severityBody).toMatchObject({
        ok: true,
        kind: 'severity',
        severity: 'sev1',
      });

      const escalateRes = await page.request.post(
        `${running.baseUrl}/incident`,
        {
          data: {
            kind: 'escalate',
            sessionId: 'e2e-ir',
            channels: ['pagerduty', 'slack:secops'],
            onCallPrimary: 'alice',
            onCallSecondary: 'bob',
          },
        },
      );
      expect(escalateRes.status()).toBe(200);
      const escalateBody = await escalateRes.json();
      expect(escalateBody).toMatchObject({
        ok: true,
        kind: 'escalate',
        channelCount: 2,
        hasSecondary: true,
      });

      const forensicsRes = await page.request.post(
        `${running.baseUrl}/incident`,
        {
          data: {
            kind: 'forensics',
            sessionId: 'e2e-ir',
            memoryDumpMb: 128,
            networkPcapMb: 32,
            diskImageGb: 4,
          },
        },
      );
      expect(forensicsRes.status()).toBe(200);
      const forensicsBody = await forensicsRes.json();
      expect(forensicsBody).toMatchObject({
        ok: true,
        kind: 'forensics',
        artifactCount: 3,
      });

      const postMortemRes = await page.request.post(
        `${running.baseUrl}/incident`,
        {
          data: {
            kind: 'post-mortem',
            sessionId: 'e2e-ir',
            rootCause: 'stale token cache after credential rotation',
            contributingFactors: ['monitor disabled'],
            actionItems: ['automate rotation', 'restore monitor'],
          },
        },
      );
      expect(postMortemRes.status()).toBe(200);
      const postMortemBody = await postMortemRes.json();
      expect(postMortemBody).toMatchObject({
        ok: true,
        kind: 'post-mortem',
        actionItemCount: 2,
      });

      // Orchestrator fused decision — correlation matched + high impact.
      await adapter.startOrchestrator({
        sessionId: 'e2e-orch',
        siemTarget: 'siem-splunk',
        incidentTarget: 'siem-splunk',
      });

      const decideMatch = await page.request.post(
        `${running.baseUrl}/ir-orchestrator`,
        {
          data: {
            kind: 'decide',
            sessionId: 'e2e-orch',
            correlationMatched: true,
            affectedUsers: 5_000,
            dataClassification: 'confidential',
            serviceDown: true,
          },
        },
      );
      expect(decideMatch.status()).toBe(200);
      const decideMatchBody = await decideMatch.json();
      expect(decideMatchBody).toMatchObject({
        ok: true,
        kind: 'decide',
        incidentTriggered: true,
        severity: 'sev1',
      });

      // Orchestrator no-match path — informational only.
      const decideNoMatch = await page.request.post(
        `${running.baseUrl}/ir-orchestrator`,
        {
          data: {
            kind: 'decide',
            sessionId: 'e2e-orch',
            correlationMatched: false,
            affectedUsers: 5_000,
            dataClassification: 'restricted',
            serviceDown: true,
          },
        },
      );
      expect(decideNoMatch.status()).toBe(200);
      const decideNoMatchBody = await decideNoMatch.json();
      expect(decideNoMatchBody).toMatchObject({
        ok: true,
        kind: 'decide',
        incidentTriggered: false,
        severity: 'sev5',
      });
    } finally {
      await context.close();
      await browser.close();
      await running.close();
    }
  });
});
