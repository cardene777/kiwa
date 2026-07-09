/**
 * Playwright + Chrome Virtual Authenticator full-flow e2e for Sub-Issue #859
 * (v1.21-2d residentKey + `/manage`).
 *
 * Strategy — the same tiny Node HTTP server + Chrome Virtual Authenticator
 * setup that #857's `passkey-signin.spec.ts` uses, extended to walk the four
 * canonical operations end-to-end:
 *
 *   1. `POST /register` with `residentKey=required` — real Chrome mints a
 *      discoverable credential.
 *   2. `GET  /manage` — surfaces the credential summary (id + discoverable
 *      flag + transports).
 *   3. `POST /signin` with an empty `allowCredentialIds` — discovery-mode
 *      signin, real Chrome finds the credential by resident-key lookup.
 *   4. `DELETE /manage?credentialId=...` — removes the credential.
 *   5. `POST /signin` again — now rejected because the store is empty.
 *
 * The RP mock is the verifier, matching the `passkey-signin.spec.ts` pattern.
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
import {
  createManageDeleteHandler,
  createManageListHandler,
} from '../../src/app/manage/route.js';
import type { WebAuthnRPAdapter } from '../../src/adapters/interface.js';

/**
 * Boot the same Node HTTP server passkey-signin uses, plus `/manage` GET +
 * DELETE. Kept as a local helper (rather than shared between the two e2e
 * specs) so each spec is self-contained + independently readable.
 */
async function bootAdapterServer(adapter: WebAuthnRPAdapter): Promise<{
  origin: string;
  close: () => Promise<void>;
}> {
  const registerHandler = createRegisterHandler(adapter);
  const signinHandler = createSigninHandler(adapter);
  const manageListHandler = createManageListHandler(adapter);
  const manageDeleteHandler = createManageDeleteHandler(adapter);

  const MAX_BODY_BYTES = 64 * 1024;
  const server: Server = createServer(async (nodeReq, nodeRes) => {
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
    } else if (url.pathname === '/manage' && method === 'GET') {
      response = await manageListHandler(request);
    } else if (url.pathname === '/manage' && method === 'DELETE') {
      response = await manageDeleteHandler(request);
    } else if (url.pathname === '/' && method === 'GET') {
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

async function attachVirtualAuthenticator(
  context: BrowserContext,
  page: Page,
): Promise<string> {
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

async function detectBrowserAvailability(): Promise<string | null> {
  try {
    const executable = chromium.executablePath();
    if (!executable) return 'chromium.executablePath() returned empty';
    if (!existsSync(executable)) return `chromium binary missing at ${executable}`;
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

test.describe('Playwright + Chrome Virtual Authenticator — full flow (register → list → signin → delete → signin)', () => {
  test.beforeEach(async ({}, testInfo) => {
    const reason = await detectBrowserAvailability();
    if (reason) testInfo.skip(true, `Chromium unavailable: ${reason}`);
    __resetWebAuthnCounters();
  });

  test('walks register → list → signin → delete → signin against the kiwa mock RP', async () => {
    const adapter = makeMockAdapter();
    const { origin, close } = await bootAdapterServer(adapter);
    const browser = await chromium.launch();
    try {
      const context = await browser.newContext({ baseURL: origin });
      const page = await context.newPage();
      await page.goto('/');
      await attachVirtualAuthenticator(context, page);

      // Step 1 — register with residentKey=required so the credential is
      // discoverable. The Chrome Virtual Authenticator's hasResidentKey flag
      // is set above, so the mock RP happily persists it.
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
          challenge: 'e2e-register-rk-challenge',
          attestation: 'direct',
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'preferred',
            residentKey: 'required',
          },
        }),
      );
      expect(registerBody.status).toBe(200);
      expect(registerBody.body['discoverable']).toBe(true);
      const credentialId = registerBody.body['credentialId'] as string;
      expect(credentialId).toBe('credential-1');

      // Step 2 — list the credential store, expect exactly one summary with
      // discoverable=true.
      const listBody = await page.evaluate(async () => {
        const res = await fetch('/manage');
        return { status: res.status, body: (await res.json()) as Record<string, unknown> };
      });
      expect(listBody.status).toBe(200);
      const credentials = listBody.body['credentials'] as Array<Record<string, unknown>>;
      expect(credentials).toHaveLength(1);
      expect(credentials[0]?.['credentialId']).toBe(credentialId);
      expect(credentials[0]?.['discoverable']).toBe(true);

      // Step 3 — signin with an empty allowCredentialIds (discovery mode).
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
          challenge: 'e2e-signin-rk-challenge-1',
          userVerification: 'preferred',
        }),
      );
      expect(signinBody.status).toBe(200);
      expect(signinBody.body['credentialId']).toBe(credentialId);
      expect(signinBody.body['signCount']).toBe(1);

      // Step 4 — delete the credential.
      const deleteBody = await page.evaluate(
        async (id: string) => {
          const res = await fetch(`/manage?credentialId=${encodeURIComponent(id)}`, {
            method: 'DELETE',
          });
          return { status: res.status, body: (await res.json()) as Record<string, unknown> };
        },
        credentialId,
      );
      expect(deleteBody.status).toBe(200);
      expect(deleteBody.body['deleted']).toBe(true);
      expect(deleteBody.body['remaining']).toBe(0);

      // Step 5 — signin now fails because the store is empty.
      const signinAfterDelete = await page.evaluate(
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
          challenge: 'e2e-signin-rk-challenge-2',
          userVerification: 'preferred',
        }),
      );
      expect(signinAfterDelete.status).toBe(400);
      expect(signinAfterDelete.body['error']).toBe('signin_failed');
      expect(String(signinAfterDelete.body['message'])).toMatch(/no credentials/);

      await context.close();
    } finally {
      await browser.close();
      await close();
    }
  });

  test('DELETE /manage?confirm=true clears every credential in one call', async () => {
    const adapter = makeMockAdapter();
    const { origin, close } = await bootAdapterServer(adapter);
    const browser = await chromium.launch();
    try {
      const context = await browser.newContext({ baseURL: origin });
      const page = await context.newPage();
      await page.goto('/');
      await attachVirtualAuthenticator(context, page);

      // Seed two credentials.
      for (const userId of ['user-1', 'user-2']) {
        const res = await page.evaluate(
          async (payload: string) => {
            const r = await fetch('/register', {
              method: 'POST',
              body: payload,
              headers: { 'content-type': 'application/json' },
            });
            return { status: r.status };
          },
          JSON.stringify({
            rp: { id: '127.0.0.1', name: 'kiwa dogfood' },
            user: { id: userId, name: `${userId}@example.com`, displayName: userId },
            challenge: `e2e-register-${userId}`,
            attestation: 'direct',
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'preferred',
              residentKey: 'required',
            },
          }),
        );
        expect(res.status).toBe(200);
      }

      const beforeList = await page.evaluate(async () => {
        const r = await fetch('/manage');
        return (await r.json()) as { credentials: unknown[] };
      });
      expect(beforeList.credentials).toHaveLength(2);

      const clearAll = await page.evaluate(async () => {
        const r = await fetch('/manage?confirm=true', { method: 'DELETE' });
        return { status: r.status, body: (await r.json()) as Record<string, unknown> };
      });
      expect(clearAll.status).toBe(200);
      expect(clearAll.body['deleted']).toBe(true);
      expect(clearAll.body['remaining']).toBe(0);

      const afterList = await page.evaluate(async () => {
        const r = await fetch('/manage');
        return (await r.json()) as { credentials: unknown[] };
      });
      expect(afterList.credentials).toHaveLength(0);
      await context.close();
    } finally {
      await browser.close();
      await close();
    }
  });
});
