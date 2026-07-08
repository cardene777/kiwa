/**
 * Next.js 15 App Router route handler for `/manage` — credential list + delete.
 *
 * Sub-Issue #859 (v1.21-2d) adds the third ceremony surface — credential
 * *management* — that complements #856 `/register` and #857 `/signin`. Where
 * register and signin are user-flow ceremonies, `/manage` is an admin-flow
 * surface a Passkey RP exposes so a signed-in user can audit and revoke the
 * credentials the RP holds on their account.
 *
 * Request shapes —
 *  - `GET /manage` — returns `{ credentials: WebAuthnCredentialSummary[] }`
 *    listing every persisted credential with the fields a management UI
 *    needs (id, discoverable, transports, signCount, attachment, createdAt).
 *  - `GET /manage?discoverable=true` — returns only discoverable
 *    credentials, mirroring what a client would surface as "Passkeys" versus
 *    all credentials.
 *  - `DELETE /manage?credentialId=...` — removes the credential; returns 200
 *    when the credential existed + was removed, 404 when it did not exist.
 *  - `DELETE /manage` — with no query param, clears every credential
 *    (used by `Clear all` in a management UI). Kept behind
 *    `?confirm=true` so a stray browser request cannot wipe the store.
 *
 * Like `/register` and `/signin` the handler is framework-neutral so tests
 * exercise it as pure fetch() without booting Next.js — Playwright e2e
 * boots a real Node HTTP server.
 *
 * SCOPE BOUNDARY — the surface intentionally does not require caller
 * authentication because the dogfood app is single-user. A production RP
 * would gate `/manage` behind a session cookie + fresh `webauthn.get`
 * assertion (step-up). Sub-Issue #859 documents the omission in
 * `docs/quality-reports/auth/webauthn-passkey-app-resident-key.md`.
 */

import type { WebAuthnCredential } from '@kiwa/auth';
import type { WebAuthnRPAdapter } from '../../adapters/interface.js';

/**
 * Fields the management UI reads. Mirrors {@link WebAuthnCredential} minus
 * the `publicKey` blob because a management UI does not need it and leaking
 * it makes credential-blob comparisons easier for an attacker.
 */
export interface WebAuthnCredentialSummary {
  credentialId: string;
  userHandle: string;
  signCount: number;
  transports: string[];
  attachment: WebAuthnCredential['attachment'];
  discoverable: boolean;
  createdAt: number;
}

export interface ManageListResponse {
  credentials: WebAuthnCredentialSummary[];
}

export interface ManageDeleteResponse {
  credentialId: string | null;
  deleted: boolean;
  remaining: number;
}

/**
 * Project a {@link WebAuthnCredential} to the subset the management UI
 * surfaces. Kept as a top-level helper so tests can assert on the shape
 * without re-implementing the projection.
 */
export function toCredentialSummary(
  credential: WebAuthnCredential,
): WebAuthnCredentialSummary {
  return {
    credentialId: credential.credentialId,
    userHandle: credential.userHandle,
    signCount: credential.signCount,
    transports: credential.transports,
    attachment: credential.attachment,
    discoverable: credential.discoverable,
    createdAt: credential.createdAt,
  };
}

/**
 * Parse the `?discoverable=true|false` query param. Returns `null` when the
 * param is unset (list all) and `true|false` when the caller narrowed the
 * list. Any other value is treated as `null` — this is a UI toggle, not a
 * strict-validation route.
 */
function parseDiscoverableFilter(url: URL | null): boolean | null {
  if (!url) return null;
  const raw = url.searchParams.get('discoverable');
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return null;
}

/**
 * Build a `GET` handler bound to a specific {@link WebAuthnRPAdapter}
 * instance. The Next.js 15 App Router entry point wires this up as
 * `export const GET = createManageListHandler(adapter)`.
 */
export function createManageListHandler(
  adapter: WebAuthnRPAdapter,
): (req: Request) => Promise<Response> {
  return async function GET(req: Request): Promise<Response> {
    const url = safeParseUrl(req.url);
    const discoverableFilter = parseDiscoverableFilter(url);
    const credentials = adapter.listCredentials();
    const filtered =
      discoverableFilter === null
        ? credentials
        : credentials.filter((c) => c.discoverable === discoverableFilter);
    const body: ManageListResponse = {
      credentials: filtered.map(toCredentialSummary),
    };
    return jsonResponse(200, body);
  };
}

/**
 * Build a `DELETE` handler bound to a specific {@link WebAuthnRPAdapter}
 * instance. The Next.js 15 App Router entry point wires this up as
 * `export const DELETE = createManageDeleteHandler(adapter)`.
 */
export function createManageDeleteHandler(
  adapter: WebAuthnRPAdapter,
): (req: Request) => Promise<Response> {
  return async function DELETE(req: Request): Promise<Response> {
    const url = safeParseUrl(req.url);
    const credentialId = url?.searchParams.get('credentialId') ?? null;
    const confirmAll = url?.searchParams.get('confirm') === 'true';

    if (!credentialId && !confirmAll) {
      return jsonResponse(400, {
        error: 'missing_credential_id',
        message: 'credentialId query param is required (or ?confirm=true to clear all)',
      });
    }

    if (!credentialId && confirmAll) {
      // Clear-all path — used by the management UI's "Revoke all" button.
      // Iterates so the adapter trace records one delete per credential
      // rather than an opaque "reset" event, which lets the fidelity harness
      // count deletes against register events.
      const before = adapter.listCredentials();
      for (const cred of before) {
        adapter.deleteCredential(cred.credentialId);
      }
      const body: ManageDeleteResponse = {
        credentialId: null,
        deleted: before.length > 0,
        remaining: adapter.listCredentials().length,
      };
      return jsonResponse(200, body);
    }

    // Single-credential delete. `credentialId` is non-null because the
    // guard above returned when both credentialId and confirmAll were unset.
    const targetId = credentialId as string;
    const existed = adapter.listCredentials().some((c) => c.credentialId === targetId);
    if (!existed) {
      return jsonResponse(404, {
        error: 'credential_not_found',
        message: `credential "${targetId}" not found`,
      });
    }
    const deleted = adapter.deleteCredential(targetId);
    const body: ManageDeleteResponse = {
      credentialId: targetId,
      deleted,
      remaining: adapter.listCredentials().length,
    };
    return jsonResponse(200, body);
  };
}

function safeParseUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
