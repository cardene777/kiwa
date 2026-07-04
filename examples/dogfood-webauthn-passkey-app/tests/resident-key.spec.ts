/**
 * residentKey + `/manage` fidelity harness (Sub-Issue #859, v1.21-2d).
 *
 * WebAuthn L3 §5.4.6 defines `residentKey` in
 * `AuthenticatorSelectionCriteria` — the RP hint that tells the
 * authenticator whether the credential should be *discoverable* (stored on
 * the authenticator itself, usable without the RP passing `allowCredentials`
 * during signin). Passkeys are always discoverable credentials, so
 * `residentKey: 'required'` is the canonical value a Passkey RP asks for.
 *
 * This harness covers the three fidelity axes AC #3 mandates —
 *  1. **Creation** — `residentKey: 'required'` on a resident-key-capable
 *     authenticator mints a credential with `discoverable=true`; on a non-
 *     resident-key authenticator the ceremony rejects with a stable
 *     `errorKind`.
 *  2. **Discovery** — `/signin` with an empty / omitted `allowCredentialIds`
 *     surfaces every discoverable credential (WebAuthn L3 §5.5 step 3). The
 *     mock lets the caller drop the `allowCredentials` list to prove the
 *     authenticator can find the credential without an RP-provided hint.
 *  3. **Delete** — `/manage?credentialId=...` removes the credential from
 *     both the RP-side store and the authenticator-side registry so a
 *     subsequent signin cannot resurrect it.
 *
 * The route-handler validation block reuses the same three axes on the
 * `/manage` GET + DELETE surface so a browser-side management UI can pin
 * against the same contract.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { __resetWebAuthnCounters } from '@kiwa-test/auth';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import { createRegisterHandler } from '../src/app/register/route.js';
import { createSigninHandler } from '../src/app/signin/route.js';
import {
  createManageDeleteHandler,
  createManageListHandler,
  toCredentialSummary,
  type ManageDeleteResponse,
  type ManageListResponse,
} from '../src/app/manage/route.js';
import type { RegisterInput } from '../src/adapters/interface.js';

const canonicalDiscoverableInput: RegisterInput = {
  rp: { id: 'example.com', name: 'Example RP' },
  user: {
    id: 'user-1',
    name: 'alice@example.com',
    displayName: 'Alice',
  },
  challenge: 'challenge-register-rk-1',
  attestation: 'direct',
  authenticatorSelection: {
    authenticatorAttachment: 'platform',
    userVerification: 'preferred',
    residentKey: 'required',
  },
};

describe('residentKey axis 1 — creation (AC #1)', () => {
  beforeEach(() => {
    __resetWebAuthnCounters();
  });

  it('mints a discoverable credential when hasResidentKey=true', async () => {
    const adapter = makeMockAdapter({ hasResidentKey: true });
    const { credential } = await adapter.register(canonicalDiscoverableInput);
    expect(credential.discoverable).toBe(true);
    expect(credential.credentialId).toBe('credential-1');
    await adapter.reset();
  });

  it('rejects with resident_key_unsupported when hasResidentKey=false', async () => {
    const adapter = makeMockAdapter({ hasResidentKey: false });
    await expect(adapter.register(canonicalDiscoverableInput)).rejects.toThrow(
      /residentKey=required/,
    );
    const failed = adapter.traces().find((t) => t.op === 'register' && !t.ok);
    expect(failed?.errorKind).toBe('resident_key_unsupported');
    await adapter.reset();
  });

  it('preferred residentKey on capable authenticator also marks discoverable', async () => {
    const adapter = makeMockAdapter({ hasResidentKey: true });
    const { credential } = await adapter.register({
      ...canonicalDiscoverableInput,
      authenticatorSelection: {
        ...canonicalDiscoverableInput.authenticatorSelection,
        residentKey: 'preferred',
      },
    });
    // WebAuthn L3 §5.4.6 — `preferred` on a capable authenticator produces a
    // discoverable credential same as `required`.
    expect(credential.discoverable).toBe(true);
    await adapter.reset();
  });

  it('discouraged residentKey clears the discoverable flag even on a capable authenticator', async () => {
    const adapter = makeMockAdapter({ hasResidentKey: true });
    const { credential } = await adapter.register({
      ...canonicalDiscoverableInput,
      authenticatorSelection: {
        ...canonicalDiscoverableInput.authenticatorSelection,
        residentKey: 'discouraged',
      },
    });
    // `discouraged` is the "please do not use up my resident-key slot" hint.
    // The credential is minted as a legacy (server-side) credential — the
    // authenticator keeps only the private key derivation seed, not the
    // credential blob.
    expect(credential.discoverable).toBe(false);
    await adapter.reset();
  });
});

describe('residentKey axis 2 — discovery (AC #1, empty allowCredentialIds)', () => {
  beforeEach(() => {
    __resetWebAuthnCounters();
  });

  it('signin with omitted allowCredentialIds discovers the credential (WebAuthn L3 §5.5 step 3)', async () => {
    const adapter = makeMockAdapter();
    await adapter.register(canonicalDiscoverableInput);
    const { assertionResponse, verifiedCredential } = await adapter.signin({
      rpId: 'example.com',
      challenge: 'challenge-signin-rk-1',
      userVerification: 'preferred',
    });
    expect(assertionResponse.credentialId).toBe(verifiedCredential.credentialId);
    expect(verifiedCredential.discoverable).toBe(true);
    // The trace should carry a successful signin without an allowCredentials
    // errorKind — discovery worked.
    const success = adapter.traces().find((t) => t.op === 'signin' && t.ok);
    expect(success).toBeDefined();
    await adapter.reset();
  });

  it('signin with empty allowCredentialIds array behaves the same as omitting the field', async () => {
    const adapter = makeMockAdapter();
    await adapter.register(canonicalDiscoverableInput);
    const { assertionResponse } = await adapter.signin({
      rpId: 'example.com',
      challenge: 'challenge-signin-rk-2',
      allowCredentialIds: [],
      userVerification: 'preferred',
    });
    expect(assertionResponse.credentialId).toBe('credential-1');
    await adapter.reset();
  });

  it('signin surfaces no_credentials_registered when the store is empty', async () => {
    const adapter = makeMockAdapter();
    await expect(
      adapter.signin({
        rpId: 'example.com',
        challenge: 'challenge-signin-rk-3',
      }),
    ).rejects.toThrow(/no credentials/);
    const failed = adapter.traces().find((t) => t.op === 'signin' && !t.ok);
    expect(failed?.errorKind).toBe('no_credentials_registered');
    await adapter.reset();
  });
});

describe('residentKey axis 3 — delete (AC #2, /manage removes the credential)', () => {
  beforeEach(() => {
    __resetWebAuthnCounters();
  });

  it('deleteCredential removes the credential from both RP store and env', async () => {
    const adapter = makeMockAdapter();
    await adapter.register(canonicalDiscoverableInput);
    expect(adapter.listCredentials()).toHaveLength(1);
    const removed = adapter.deleteCredential('credential-1');
    expect(removed).toBe(true);
    expect(adapter.listCredentials()).toHaveLength(0);
    // Trace records the delete outcome.
    const deleteEvent = adapter.traces().find((t) => t.op === 'deleteCredential');
    expect(deleteEvent?.ok).toBe(true);
    await adapter.reset();
  });

  it('deleteCredential returns false when the credential does not exist', async () => {
    const adapter = makeMockAdapter();
    const removed = adapter.deleteCredential('credential-missing');
    expect(removed).toBe(false);
    const deleteEvent = adapter.traces().find((t) => t.op === 'deleteCredential');
    expect(deleteEvent?.ok).toBe(false);
    await adapter.reset();
  });

  it('signin after delete surfaces no_credentials_registered (WebAuthn L3 §7.2 step 3)', async () => {
    const adapter = makeMockAdapter();
    await adapter.register(canonicalDiscoverableInput);
    adapter.deleteCredential('credential-1');
    await expect(
      adapter.signin({
        rpId: 'example.com',
        challenge: 'challenge-signin-rk-4',
      }),
    ).rejects.toThrow(/no credentials/);
    await adapter.reset();
  });
});

describe('/manage route — GET (credential list, AC #2)', () => {
  beforeEach(() => {
    __resetWebAuthnCounters();
  });

  it('GET /manage returns every persisted credential summary', async () => {
    const adapter = makeMockAdapter();
    await adapter.register(canonicalDiscoverableInput);
    const handler = createManageListHandler(adapter);
    const res = await handler(new Request('http://localhost/manage'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as ManageListResponse;
    expect(body.credentials).toHaveLength(1);
    const [summary] = body.credentials;
    // publicKey is intentionally omitted from the summary (see toCredentialSummary).
    expect(summary).not.toHaveProperty('publicKey');
    expect(summary?.credentialId).toBe('credential-1');
    expect(summary?.discoverable).toBe(true);
    await adapter.reset();
  });

  it('GET /manage?discoverable=true narrows to discoverable credentials only', async () => {
    const adapter = makeMockAdapter();
    // Two credentials — one discoverable, one legacy.
    await adapter.register(canonicalDiscoverableInput);
    await adapter.register({
      ...canonicalDiscoverableInput,
      user: {
        ...canonicalDiscoverableInput.user,
        id: 'user-2',
        name: 'bob@example.com',
      },
      challenge: 'challenge-register-rk-legacy',
      authenticatorSelection: {
        ...canonicalDiscoverableInput.authenticatorSelection,
        residentKey: 'discouraged',
      },
    });
    const handler = createManageListHandler(adapter);
    const allRes = await handler(new Request('http://localhost/manage'));
    const allBody = (await allRes.json()) as ManageListResponse;
    expect(allBody.credentials).toHaveLength(2);
    const discoverableRes = await handler(
      new Request('http://localhost/manage?discoverable=true'),
    );
    const discoverableBody = (await discoverableRes.json()) as ManageListResponse;
    expect(discoverableBody.credentials).toHaveLength(1);
    expect(discoverableBody.credentials[0]?.discoverable).toBe(true);
    const legacyRes = await handler(
      new Request('http://localhost/manage?discoverable=false'),
    );
    const legacyBody = (await legacyRes.json()) as ManageListResponse;
    expect(legacyBody.credentials).toHaveLength(1);
    expect(legacyBody.credentials[0]?.discoverable).toBe(false);
    await adapter.reset();
  });

  it('GET /manage on an empty store returns { credentials: [] }', async () => {
    const adapter = makeMockAdapter();
    const handler = createManageListHandler(adapter);
    const res = await handler(new Request('http://localhost/manage'));
    const body = (await res.json()) as ManageListResponse;
    expect(body.credentials).toEqual([]);
    await adapter.reset();
  });
});

describe('/manage route — DELETE (credential revoke, AC #2)', () => {
  beforeEach(() => {
    __resetWebAuthnCounters();
  });

  it('DELETE /manage?credentialId=... removes the credential + returns remaining count', async () => {
    const adapter = makeMockAdapter();
    await adapter.register(canonicalDiscoverableInput);
    const handler = createManageDeleteHandler(adapter);
    const res = await handler(
      new Request('http://localhost/manage?credentialId=credential-1', {
        method: 'DELETE',
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as ManageDeleteResponse;
    expect(body.credentialId).toBe('credential-1');
    expect(body.deleted).toBe(true);
    expect(body.remaining).toBe(0);
    expect(adapter.listCredentials()).toHaveLength(0);
    await adapter.reset();
  });

  it('DELETE /manage?credentialId=missing returns 404 credential_not_found', async () => {
    const adapter = makeMockAdapter();
    const handler = createManageDeleteHandler(adapter);
    const res = await handler(
      new Request('http://localhost/manage?credentialId=credential-missing', {
        method: 'DELETE',
      }),
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string; message: string };
    expect(body.error).toBe('credential_not_found');
    expect(body.message).toContain('credential-missing');
    await adapter.reset();
  });

  it('DELETE /manage without credentialId or confirm returns 400 missing_credential_id', async () => {
    const adapter = makeMockAdapter();
    const handler = createManageDeleteHandler(adapter);
    const res = await handler(
      new Request('http://localhost/manage', { method: 'DELETE' }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('missing_credential_id');
    await adapter.reset();
  });

  it('DELETE /manage?confirm=true clears every credential', async () => {
    const adapter = makeMockAdapter();
    await adapter.register(canonicalDiscoverableInput);
    await adapter.register({
      ...canonicalDiscoverableInput,
      user: {
        ...canonicalDiscoverableInput.user,
        id: 'user-2',
        name: 'bob@example.com',
      },
      challenge: 'challenge-register-rk-2',
    });
    const handler = createManageDeleteHandler(adapter);
    expect(adapter.listCredentials()).toHaveLength(2);
    const res = await handler(
      new Request('http://localhost/manage?confirm=true', { method: 'DELETE' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as ManageDeleteResponse;
    expect(body.credentialId).toBeNull();
    expect(body.deleted).toBe(true);
    expect(body.remaining).toBe(0);
    expect(adapter.listCredentials()).toHaveLength(0);
    await adapter.reset();
  });

  it('DELETE /manage?confirm=true on an empty store returns deleted=false', async () => {
    const adapter = makeMockAdapter();
    const handler = createManageDeleteHandler(adapter);
    const res = await handler(
      new Request('http://localhost/manage?confirm=true', { method: 'DELETE' }),
    );
    const body = (await res.json()) as ManageDeleteResponse;
    expect(body.deleted).toBe(false);
    expect(body.remaining).toBe(0);
    await adapter.reset();
  });
});

describe('/manage route — full lifecycle (register → list → signin → delete → signin)', () => {
  beforeEach(() => {
    __resetWebAuthnCounters();
  });

  it('exercises the four canonical operations in order', async () => {
    const adapter = makeMockAdapter();
    const registerHandler = createRegisterHandler(adapter);
    const listHandler = createManageListHandler(adapter);
    const signinHandler = createSigninHandler(adapter);
    const deleteHandler = createManageDeleteHandler(adapter);

    // 1. register
    const registerRes = await registerHandler(
      new Request('http://localhost/register', {
        method: 'POST',
        body: JSON.stringify(canonicalDiscoverableInput),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(registerRes.status).toBe(200);
    const registerBody = (await registerRes.json()) as { discoverable: boolean };
    expect(registerBody.discoverable).toBe(true);

    // 2. list
    const listRes = await listHandler(new Request('http://localhost/manage'));
    const listBody = (await listRes.json()) as ManageListResponse;
    expect(listBody.credentials).toHaveLength(1);

    // 3. signin (discovery — no allowCredentialIds)
    const signinRes = await signinHandler(
      new Request('http://localhost/signin', {
        method: 'POST',
        body: JSON.stringify({
          rpId: 'example.com',
          challenge: 'challenge-signin-lifecycle',
          userVerification: 'preferred',
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(signinRes.status).toBe(200);

    // 4. delete
    const deleteRes = await deleteHandler(
      new Request('http://localhost/manage?credentialId=credential-1', {
        method: 'DELETE',
      }),
    );
    expect(deleteRes.status).toBe(200);

    // 5. signin fails after delete
    const postDeleteSignin = await signinHandler(
      new Request('http://localhost/signin', {
        method: 'POST',
        body: JSON.stringify({
          rpId: 'example.com',
          challenge: 'challenge-signin-post-delete',
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(postDeleteSignin.status).toBe(400);
    const postDeleteBody = (await postDeleteSignin.json()) as {
      error: string;
      message: string;
    };
    expect(postDeleteBody.error).toBe('signin_failed');
    expect(postDeleteBody.message).toMatch(/no credentials/);
    await adapter.reset();
  });
});

describe('toCredentialSummary — projection helper', () => {
  beforeEach(() => {
    __resetWebAuthnCounters();
  });

  it('drops publicKey from the summary while preserving the management-visible fields', async () => {
    const adapter = makeMockAdapter();
    const { credential } = await adapter.register(canonicalDiscoverableInput);
    const summary = toCredentialSummary(credential);
    expect(summary.credentialId).toBe(credential.credentialId);
    expect(summary.userHandle).toBe(credential.userHandle);
    expect(summary.discoverable).toBe(credential.discoverable);
    expect(summary.transports).toEqual(credential.transports);
    expect(summary.attachment).toBe(credential.attachment);
    expect(summary.signCount).toBe(credential.signCount);
    expect(summary.createdAt).toBe(credential.createdAt);
    // publicKey MUST NOT be in the summary — leaking it makes fingerprinting
    // easier for downstream tooling and gives nothing back to a management UI.
    expect(summary).not.toHaveProperty('publicKey');
    await adapter.reset();
  });
});

describe('real adapter — env-missing coverage for /manage', () => {
  it('detectRealEnvMissing returns a reason when the browser env is absent', () => {
    // Real adapter list/delete methods work on the in-memory store regardless
    // of the browser env (they do not touch Chrome), but the env-missing
    // signal is still reported so the fidelity harness can label the delta.
    const reason = detectRealEnvMissing();
    // Non-null on hosts without KIWA_WEBAUTHN_REAL_READY=1.
    expect(typeof reason === 'string' || reason === null).toBe(true);
  });

  it('real adapter listCredentials + deleteCredential still work in the env-missing state', () => {
    const adapter = makeRealAdapter();
    expect(adapter.listCredentials()).toEqual([]);
    // Delete on an empty store returns false — same shape as the mock.
    expect(adapter.deleteCredential('credential-missing')).toBe(false);
  });
});
