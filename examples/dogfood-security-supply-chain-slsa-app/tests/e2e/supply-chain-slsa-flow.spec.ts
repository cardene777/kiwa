/**
 * Playwright e2e for the SLSA supply chain + reproducible +
 * attestation + orchestrator flow — a real Chromium browser drives the
 * same supply-chain / reproducible / attestation / sc-orchestrator
 * handlers the runtime mounts in production. The page UI is not
 * rendered as full React here — the test pumps JSON through the ad-hoc
 * HTTP server + asserts on the response shape, which mirrors how a
 * client would drive the same routes when the app is embedded in a
 * larger runtime.
 *
 * Fidelity axes exercised here (parallel to the vitest specs).
 *  - A Chromium BrowserContext drives an SLSA level 4 verify ceremony
 *    end to end.
 *  - A reproducible build twin-hash match flow captures the
 *    reproducible axis end to end.
 *  - A signProvenance + verifyAttestation flow captures the
 *    attestation axis end to end.
 *  - A combined orchestrator decide flow asserts the fused policy
 *    invariant (SLSA level + reproducible + provenance + attestation).
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

test.describe('security-supply-chain-slsa-app e2e — Chromium drives the SLSA supply chain ceremony', () => {
  test.skip(
    !browserAvailable(),
    'Chromium binary not installed — run `pnpm exec playwright install chromium`',
  );

  test('T-E2E-001 SLSA level verify + reproducible match + provenance sign + attestation verify + orchestrator decide end to end', async () => {
    const adapter = makeMockAdapter({ latencyMs: 0 });
    const running = await startNextServer({ adapter });
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ baseURL: running.baseUrl });
    const page = await context.newPage();

    try {
      // SLSA level gate — verify level 4 through the route.
      await adapter.startSlsa({ sessionId: 'e2e-slsa', target: 'opa' });

      const slsaRes = await page.request.post(
        `${running.baseUrl}/supply-chain`,
        {
          data: {
            kind: 'verify-slsa-level',
            sessionId: 'e2e-slsa',
            buildScriptedFromRepo: true,
            buildServiceIsTrustworthy: true,
            buildParameterizable: false,
            buildIsolated: true,
            provenanceExists: true,
            provenanceAuthenticated: true,
            provenanceServiceGenerated: true,
            provenanceNonFalsifiable: true,
          },
        },
      );
      expect(slsaRes.status()).toBe(200);
      const slsaBody = await slsaRes.json();
      expect(slsaBody).toMatchObject({
        ok: true,
        kind: 'verify-slsa-level',
        level: 4,
      });

      // Reproducible build — twin hashes match.
      await adapter.startReproducible({
        sessionId: 'e2e-repro',
        target: 'opa',
      });

      const reproRes = await page.request.post(
        `${running.baseUrl}/reproducible`,
        {
          data: {
            kind: 'match-build',
            sessionId: 'e2e-repro',
            buildA_hash: 'sha256:abcdef',
            buildB_hash: 'sha256:abcdef',
            toolchainVersion: 'rust-1.80.0',
          },
        },
      );
      expect(reproRes.status()).toBe(200);
      const reproBody = await reproRes.json();
      expect(reproBody).toMatchObject({
        ok: true,
        kind: 'match-build',
        matched: true,
        toolchainVersion: 'rust-1.80.0',
      });

      // Provenance + attestation — sign then verify.
      await adapter.startAttestation({
        sessionId: 'e2e-att',
        target: 'vault',
      });

      const signRes = await page.request.post(
        `${running.baseUrl}/attestation`,
        {
          data: {
            kind: 'sign-provenance',
            sessionId: 'e2e-att',
            builderId: 'github-actions://actions/runner@v2.317.0',
            materialsCount: 5,
            signatureAlgorithm: 'sigstore-cosign',
          },
        },
      );
      expect(signRes.status()).toBe(200);
      const signBody = await signRes.json();
      expect(signBody).toMatchObject({
        ok: true,
        kind: 'sign-provenance',
        builderId: 'github-actions://actions/runner@v2.317.0',
      });

      const attRes = await page.request.post(
        `${running.baseUrl}/attestation`,
        {
          data: {
            kind: 'verify-attestation',
            sessionId: 'e2e-att',
            attestationType: 'slsa-provenance',
            trustRootFingerprint: 'sha256:trust-root-abc',
            validSignatures: 2,
          },
        },
      );
      expect(attRes.status()).toBe(200);
      const attBody = await attRes.json();
      expect(attBody).toMatchObject({
        ok: true,
        kind: 'verify-attestation',
        attestationType: 'slsa-provenance',
        validSignatures: 2,
      });

      // Orchestrator fused policy — all 4 gates green.
      await adapter.startOrchestrator({
        sessionId: 'e2e-orch',
        slsaTarget: 'opa',
        reproducibleTarget: 'opa',
        attestationTarget: 'vault',
      });

      const decideGreen = await page.request.post(
        `${running.baseUrl}/sc-orchestrator`,
        {
          data: {
            kind: 'decide',
            sessionId: 'e2e-orch',
            slsaLevel: 4,
            reproducibleMatched: true,
            provenanceSigned: true,
            attestationVerified: true,
            minRequiredLevel: 3,
            requireAttestation: true,
          },
        },
      );
      expect(decideGreen.status()).toBe(200);
      const decideGreenBody = await decideGreen.json();
      expect(decideGreenBody).toMatchObject({
        ok: true,
        kind: 'decide',
        policyPassed: true,
        slsaLevel: 4,
      });

      // Orchestrator low-level path — policy fails.
      const decideLow = await page.request.post(
        `${running.baseUrl}/sc-orchestrator`,
        {
          data: {
            kind: 'decide',
            sessionId: 'e2e-orch',
            slsaLevel: 1,
            reproducibleMatched: true,
            provenanceSigned: true,
            attestationVerified: true,
            minRequiredLevel: 3,
            requireAttestation: true,
          },
        },
      );
      expect(decideLow.status()).toBe(200);
      const decideLowBody = await decideLow.json();
      expect(decideLowBody).toMatchObject({
        ok: true,
        kind: 'decide',
        policyPassed: false,
        slsaLevel: 1,
      });
    } finally {
      await context.close();
      await browser.close();
      await running.close();
    }
  });
});
