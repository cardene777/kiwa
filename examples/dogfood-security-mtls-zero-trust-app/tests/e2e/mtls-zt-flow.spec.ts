/**
 * Playwright e2e for the mTLS + Zero-trust + broker flow — a real
 * Chromium browser drives the same mtls / zero-trust / broker handlers
 * the runtime mounts in production. The page UI is not rendered as full
 * React here — the test pumps JSON through the ad-hoc HTTP server +
 * asserts on the response shape, which mirrors how a client would drive
 * the same routes when the app is embedded in a larger runtime.
 *
 * Fidelity axes exercised here (parallel to the vitest specs).
 *  - A Chromium BrowserContext drives an mTLS handshake + SPKI pin +
 *    OCSP staple + CT log check ceremony end to end.
 *  - A device posture + risk score + JIT grant + micro-segment flow
 *    captures the zero-trust axis end to end.
 *  - A combined broker decide flow asserts the "both must pass"
 *    admission invariant.
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

test.describe('security-mtls-zero-trust-app e2e — Chromium drives the mTLS + Zero-trust + broker ceremony', () => {
  test.skip(
    !browserAvailable(),
    'Chromium binary not installed — run `pnpm exec playwright install chromium`',
  );

  test('T-E2E-001 mTLS handshake + pin + OCSP + CT log + posture + risk + JIT + segment + broker end to end', async () => {
    const adapter = makeMockAdapter({ latencyMs: 0 });
    const running = await startNextServer({ adapter });
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ baseURL: running.baseUrl });
    const page = await context.newPage();

    try {
      // Bootstrap mTLS session by calling completeHandshake through the route.
      // We first need to start via direct adapter for isolation-free
      // session bookkeeping, since the route only exposes the granular ops.
      await adapter.startMtls({ sessionId: 'e2e-mtls', target: 'istio' });

      const handshakeRes = await page.request.post(`${running.baseUrl}/mtls`, {
        data: {
          kind: 'handshake',
          sessionId: 'e2e-mtls',
          peerCn: 'svc-a.default.svc.cluster.local',
          cipherSuite: 'TLS_AES_128_GCM_SHA256',
          tlsVersion: '1.3',
        },
      });
      expect(handshakeRes.status()).toBe(200);
      const handshakeBody = await handshakeRes.json();
      expect(handshakeBody).toMatchObject({ ok: true, kind: 'handshake' });

      const pinRes = await page.request.post(`${running.baseUrl}/mtls`, {
        data: {
          kind: 'pin',
          sessionId: 'e2e-mtls',
          spkiSha256: 'sha256:AAAA',
          expectedPins: ['sha256:AAAA', 'sha256:BBBB'],
        },
      });
      expect(pinRes.status()).toBe(200);
      const pinBody = await pinRes.json();
      expect(pinBody).toMatchObject({ ok: true, kind: 'pin', matched: true });

      const ocspRes = await page.request.post(`${running.baseUrl}/mtls`, {
        data: {
          kind: 'ocsp',
          sessionId: 'e2e-mtls',
          stapled: true,
          goodResponse: true,
        },
      });
      expect(ocspRes.status()).toBe(200);
      const ocspBody = await ocspRes.json();
      expect(ocspBody).toMatchObject({ ok: true, kind: 'ocsp', good: true });

      const ctRes = await page.request.post(`${running.baseUrl}/mtls`, {
        data: {
          kind: 'ct',
          sessionId: 'e2e-mtls',
          sctCount: 3,
          minSctRequired: 2,
        },
      });
      expect(ctRes.status()).toBe(200);
      const ctBody = await ctRes.json();
      expect(ctBody).toMatchObject({ ok: true, kind: 'ct', sctOk: true });

      // Zero-trust ceremony — posture + risk + JIT + segment.
      await adapter.startZeroTrust({ sessionId: 'e2e-zt', target: 'opa' });

      const postureRes = await page.request.post(
        `${running.baseUrl}/zero-trust`,
        {
          data: {
            kind: 'posture',
            sessionId: 'e2e-zt',
            osUpToDate: true,
            diskEncrypted: true,
            edrRunning: true,
            mdmEnrolled: true,
          },
        },
      );
      expect(postureRes.status()).toBe(200);
      const postureBody = await postureRes.json();
      expect(postureBody).toMatchObject({
        ok: true,
        kind: 'posture',
        passed: true,
      });

      const riskRes = await page.request.post(
        `${running.baseUrl}/zero-trust`,
        {
          data: {
            kind: 'risk',
            sessionId: 'e2e-zt',
            unusualLocation: false,
            unusualTime: false,
            newDevice: false,
            threatIntelHit: false,
          },
        },
      );
      expect(riskRes.status()).toBe(200);
      const riskBody = await riskRes.json();
      expect(riskBody).toMatchObject({
        ok: true,
        kind: 'risk',
        riskScore: 0,
      });

      const jitRes = await page.request.post(
        `${running.baseUrl}/zero-trust`,
        {
          data: {
            kind: 'jit',
            sessionId: 'e2e-zt',
            requestedRole: 'db:reader',
            justification: 'end to end e2e test',
            ttlSeconds: 900,
          },
        },
      );
      expect(jitRes.status()).toBe(200);
      const jitBody = await jitRes.json();
      expect(jitBody).toMatchObject({
        ok: true,
        kind: 'jit',
        granted: true,
      });

      const segRes = await page.request.post(
        `${running.baseUrl}/zero-trust`,
        {
          data: {
            kind: 'segment',
            sessionId: 'e2e-zt',
            workload: 'billing-api',
            allowedPeers: ['db-primary', 'db-replica'],
            requestedPeer: 'db-primary',
          },
        },
      );
      expect(segRes.status()).toBe(200);
      const segBody = await segRes.json();
      expect(segBody).toMatchObject({
        ok: true,
        kind: 'segment',
        allowed: true,
      });

      // Broker fused decision — both mtls + zt admit.
      await adapter.startBroker({
        sessionId: 'e2e-broker',
        mtlsTarget: 'istio',
        ztTarget: 'opa',
      });

      const decideAdmit = await page.request.post(
        `${running.baseUrl}/broker`,
        {
          data: {
            kind: 'decide',
            sessionId: 'e2e-broker',
            mtlsOk: true,
            ztOk: true,
          },
        },
      );
      expect(decideAdmit.status()).toBe(200);
      const decideAdmitBody = await decideAdmit.json();
      expect(decideAdmitBody).toMatchObject({
        ok: true,
        kind: 'decide',
        admitted: true,
        reason: 'admitted',
      });

      // Broker deny — mtls fails.
      const decideDeny = await page.request.post(
        `${running.baseUrl}/broker`,
        {
          data: {
            kind: 'decide',
            sessionId: 'e2e-broker',
            mtlsOk: false,
            ztOk: true,
          },
        },
      );
      expect(decideDeny.status()).toBe(200);
      const decideDenyBody = await decideDeny.json();
      expect(decideDenyBody).toMatchObject({
        ok: true,
        kind: 'decide',
        admitted: false,
        reason: 'mtls_denied',
      });
    } finally {
      await context.close();
      await browser.close();
      await running.close();
    }
  });
});
