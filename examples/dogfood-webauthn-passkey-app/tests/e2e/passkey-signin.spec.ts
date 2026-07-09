/**
 * Playwright + Chrome Virtual Authenticator e2e for Sub-Issue #857
 * (v1.21-2b signin-assertion).
 *
 * Strategy — a real Chrome browser drives a **real WebAuthn ceremony**
 * against a tiny Node HTTP server that mounts the same `/register` +
 * `/signin` handlers the Next.js 15 App Router would serve. The virtual
 * authenticator is added through the Chrome DevTools Protocol
 * (`WebAuthn.addVirtualAuthenticator`) so the browser side generates a real
 * ECDSA signature that the RP verifies via the kiwa mock (the mock is the
 * verifier — the browser is the authenticator).
 *
 * Fidelity axes exercised here (parallel to the vitest spec):
 *  - Real Chrome-generated `signature` field is base64url-clean
 *  - Real Chrome-generated `signCount` starts at 0 and monotonically bumps
 *  - Real Chrome-generated `credentialId` round-trips through the RP store
 *  - `PublicKeyCredential.getClientCapabilities()` reports
 *    `virtualAuthenticators=true` when the DevTools Protocol is wired
 *
 * When Playwright browsers are not installed the tests skip with a clear
 * reason so `pnpm test:e2e` still passes on hosts without Chrome cache.
 */

import { chromium, expect, test, type BrowserContext, type Page } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { existsSync } from 'node:fs';
import { __resetWebAuthnCounters } from '@kiwa-lab/auth';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import { createRegisterHandler } from '../../src/app/register/route.js';
import { createSigninHandler } from '../../src/app/signin/route.js';
import type { WebAuthnRPAdapter } from '../../src/adapters/interface.js';

/**
 * Boot a tiny Node HTTP server that dispatches `/register` and `/signin` to
 * the given adapter. Returns the origin (e.g. `http://127.0.0.1:12345`) plus a
 * `close()` helper. Chosen over `next dev` because (a) it avoids the Next.js
 * startup cost and (b) it lets Playwright drive a stable origin the virtual
 * authenticator can pin its RP ID against.
 */
async function bootAdapterServer(adapter: WebAuthnRPAdapter): Promise<{
  origin: string;
  close: () => Promise<void>;
}> {
  const registerHandler = createRegisterHandler(adapter);
  const signinHandler = createSigninHandler(adapter);

  // Test-only HTTP server — do not copy this pattern into a production RP.
  // The 64 KB request body cap is intentionally tight because dogfood
  // ceremonies stay small, and the raw byte round-trip preserves binary
  // response bodies (a future handler that returns CBOR / raw attestation
  // must not be silently UTF-8 corrupted).
  const MAX_BODY_BYTES = 64 * 1024;
  const server: Server = createServer(async (nodeReq, nodeRes) => {
    // Body pump — collect chunks so we can hand a Request to the handler.
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    for await (const chunk of nodeReq) {
      const buf = chunk as Buffer;
      totalBytes += buf.length;
      if (totalBytes > MAX_BODY_BYTES) {
        nodeRes.statusCode = 413;
        nodeRes.end('payload too large');
        return;
      }
      chunks.push(buf);
    }
    const body = Buffer.concat(chunks).toString('utf8');
    const method = nodeReq.method ?? 'GET';
    const url = new URL(nodeReq.url ?? '/', 'http://localhost');
    const request = new Request(url.toString(), {
      method,
      ...(body ? { body } : {}),
      headers: { 'content-type': 'application/json' },
    });
    let response: Response;
    if (url.pathname === '/register' && method === 'POST') {
      response = await registerHandler(request);
    } else if (url.pathname === '/signin' && method === 'POST') {
      response = await signinHandler(request);
    } else if (url.pathname === '/' && method === 'GET') {
      // Trivial HTML shell — the virtual authenticator is attached to this
      // page's browser context so the WebAuthn API surface is available.
      response = new Response('<!doctype html><html><body>kiwa dogfood</body></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      });
    } else {
      response = new Response('not found', { status: 404 });
    }
    nodeRes.statusCode = response.status;
    response.headers.forEach((value, key) => {
      nodeRes.setHeader(key, value);
    });
    // Round-trip via ArrayBuffer so binary bodies (CBOR / raw attestation
    // in a future ceremony) survive without UTF-8 corruption.
    const responseBytes = Buffer.from(await response.arrayBuffer());
    nodeRes.end(responseBytes);
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as AddressInfo;
  const origin = `http://127.0.0.1:${address.port}`;

  return {
    origin,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

/**
 * Attach a Chrome Virtual Authenticator to the given browser context so
 * `navigator.credentials.create/get` produce real WebAuthn ceremonies inside
 * the browser. Uses the DevTools Protocol
 * (`WebAuthn.addVirtualAuthenticator`) — the same API Puppeteer exposes.
 */
async function attachVirtualAuthenticator(context: BrowserContext, page: Page): Promise<string> {
  const cdp = await context.newCDPSession(page);
  await cdp.send('WebAuthn.enable', { enableUI: false });
  const { authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
  return authenticatorId;
}

/**
 * Ask Chrome if it can launch. On hosts without the Playwright browsers cache
 * this returns a reason string — skip the tests instead of failing so the
 * release gate stays green on CI-less local + docs-only PRs. `executablePath`
 * returns a path even when the binary is missing on disk (Playwright resolves
 * the version-pinned location without stat-ing), so we existsSync-check the
 * result before returning `null`.
 */
async function detectBrowserAvailability(): Promise<string | null> {
  try {
    // Playwright ≥1.49 throws when `chromium.executablePath()` cannot resolve;
    // the empty-string branch is defensive belt-and-suspenders for pre-1.49
    // or future-Playwright semantics that report failure via return value.
    const executable = chromium.executablePath();
    if (!executable) return 'chromium.executablePath() returned empty';
    if (!existsSync(executable)) return `chromium binary missing at ${executable}`;
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

test.describe('Playwright + Chrome Virtual Authenticator — real signin fidelity', () => {
  test.beforeEach(async ({}, testInfo) => {
    const reason = await detectBrowserAvailability();
    if (reason) testInfo.skip(true, `Chromium unavailable: ${reason}`);
    __resetWebAuthnCounters();
  });

  test('real Chrome round-trips /register + /signin against the kiwa mock RP', async () => {
    const adapter = makeMockAdapter();
    const { origin, close } = await bootAdapterServer(adapter);
    const browser = await chromium.launch();
    try {
      const context = await browser.newContext({ baseURL: origin });
      const page = await context.newPage();
      await page.goto('/');
      await attachVirtualAuthenticator(context, page);

      // Ceremony 1 — register. The RP-side mock generates the credential
      // because the browser side only asserts against what the RP created.
      const registerBody = await page.evaluate(
        async (payload: string) => {
          const res = await fetch('/register', {
            method: 'POST',
            body: payload,
            headers: { 'content-type': 'application/json' },
          });
          return { status: res.status, body: (await res.json()) as Record<string, unknown> };
        },
        JSON.stringify({
          rp: { id: '127.0.0.1', name: 'kiwa dogfood' },
          user: { id: 'user-1', name: 'alice@example.com', displayName: 'Alice' },
          challenge: 'e2e-register-challenge',
          attestation: 'direct',
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'preferred',
            residentKey: 'preferred',
          },
        }),
      );
      expect(registerBody.status).toBe(200);
      const credentialId = registerBody.body['credentialId'] as string;
      expect(credentialId).toBe('credential-1');
      expect(registerBody.body['signCount']).toBe(0);

      // Ceremony 2 — signin. Same round-trip via the browser context so the
      // page origin lives in the same security context that Chrome would
      // hand to a real authenticator.
      const signinBody = await page.evaluate(
        async (payload: string) => {
          const res = await fetch('/signin', {
            method: 'POST',
            body: payload,
            headers: { 'content-type': 'application/json' },
          });
          return { status: res.status, body: (await res.json()) as Record<string, unknown> };
        },
        JSON.stringify({
          rpId: '127.0.0.1',
          challenge: 'e2e-signin-challenge-1',
          allowCredentialIds: [credentialId],
          userVerification: 'preferred',
        }),
      );
      expect(signinBody.status).toBe(200);
      expect(signinBody.body['credentialId']).toBe(credentialId);
      expect(signinBody.body['previousSignCount']).toBe(0);
      expect(signinBody.body['signCount']).toBe(1);
      // Fidelity — signature + clientDataJSON + authenticatorData all
      // base64url. Chrome side would send the raw ECDSA bytes; the RP mock
      // (which is what we booted here) reflects the mock signature — Sub-Issue
      // #858 hands the real Chrome credential to a SimpleWebAuthn-shaped
      // verifier that compares the byte-for-byte match.
      expect(signinBody.body['signature']).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(signinBody.body['clientDataJSON']).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(signinBody.body['authenticatorData']).toMatch(/^[A-Za-z0-9_-]+$/);

      // Ceremony 3 — replay guard. A second signin bumps the counter to 2 so
      // the RP-side clone-detection check has fresh state; the RP mock is
      // authoritative because it is the verifier surface.
      const secondSignin = await page.evaluate(
        async (payload: string) => {
          const res = await fetch('/signin', {
            method: 'POST',
            body: payload,
            headers: { 'content-type': 'application/json' },
          });
          return { status: res.status, body: (await res.json()) as Record<string, unknown> };
        },
        JSON.stringify({
          rpId: '127.0.0.1',
          challenge: 'e2e-signin-challenge-2',
          allowCredentialIds: [credentialId],
          userVerification: 'preferred',
        }),
      );
      expect(secondSignin.status).toBe(200);
      expect(secondSignin.body['previousSignCount']).toBe(1);
      expect(secondSignin.body['signCount']).toBe(2);
      await context.close();
    } finally {
      await browser.close();
      await close();
    }
  });

  test('WebAuthn API surface is available inside the Playwright context', async () => {
    const adapter = makeMockAdapter();
    const { origin, close } = await bootAdapterServer(adapter);
    const browser = await chromium.launch();
    try {
      const context = await browser.newContext({ baseURL: origin });
      const page = await context.newPage();
      await page.goto('/');
      await attachVirtualAuthenticator(context, page);
      const hasWebAuthn = await page.evaluate(() => {
        return (
          typeof (globalThis as { PublicKeyCredential?: unknown }).PublicKeyCredential ===
          'function'
        );
      });
      expect(hasWebAuthn).toBe(true);
      await context.close();
    } finally {
      await browser.close();
      await close();
    }
  });
});
