/**
 * v1.22-5 (CAR-446 / GH #891) — Federation JWKS rotation real e2e.
 *
 * The v1.21-4d harness (`tests/jwks-rotation-e2e.spec.ts`) proves axes 4a-4d
 * against the mock (`@kiwa-lab/auth` `setupOidcEnv`) — sign → rotate →
 * verify inside window / past retention / multi-rotation / fresh key after
 * rotation. v1.22-1 landed the Keycloak testcontainers real driver so
 * axes 1 + 3 (discovery + JWKS shape) gained live coverage, but axes 4 /
 * 4a-4d stayed on the mock-as-reference matrix because rotation lives on
 * Keycloak's admin REST API (`/admin/realms/{realm}/components`) — outside
 * the fidelity adapter's sync interface.
 *
 * This spec closes that gap. Every axis is exercised against a real
 * Keycloak container:
 *
 *   4a. sign → rotate → verify inside window
 *       - mint an id_token under kid k1 (Keycloak signs with the active
 *         `rsa-generated` provider)
 *       - create a fresh `rsa-generated` provider with higher priority
 *         (Keycloak rotates: k2 becomes active, k1 stays in `/certs`)
 *       - refresh JWKS + verify the id_token minted under k1 through jose
 *         (uses real RS256 crypto — RSA signature over the public JWK)
 *
 *   4b. verify past retention window
 *       - mint under k1 → rotate → DELETE the old provider (past-retention
 *         simulation: Keycloak drops k1 from `/certs`)
 *       - refresh JWKS + verify → jose refuses because kid is unknown
 *
 *   4c. multi-rotation retention
 *       - mint under k1 → rotate → mint under k2 → rotate → mint under k3
 *       - refresh JWKS (three sig keys visible) + verify all three
 *         id_tokens through jose
 *
 *   4d. fresh active key issues verifiable id_tokens after rotation
 *       - rotate → mint under the new active key → verify through jose
 *       - assert the new kid matches the id_token header
 *
 * Container lifecycle: one Keycloak container per file, provisioned once
 * in `beforeAll`. Every axis reuses the same handle. The rotation ops are
 * additive (create provider + delete provider) so cross-axis state
 * bleedover is bounded — each axis captures the pre-state and asserts on
 * the post-state.
 *
 * Opt-in: `describe.runIf(process.env['OIDC_BOOTSTRAP'] === '1')` — the
 * default `pnpm test` skips this file (real Keycloak boot is 30-60s on
 * cold pull, container overhead + admin API calls per axis). CI opts in
 * on the release-gate leg with `OIDC_BOOTSTRAP=1 pnpm test`. See
 * `docs/quality-reports/auth/oidc-federation.md` § Real JWKS rotation
 * e2e matrix — v1.22-5.
 *
 * Real vs mock fidelity diff — the mock exposes a synchronous
 * `env.jwks.rotate()` + `env.signIdToken()` because it drives an in-memory
 * key set. Keycloak's rotation is async (admin REST API + realm reload) +
 * signing runs on Keycloak's server. The e2e harness stitches the two
 * async boundaries together so the rotation contract stays comparable
 * across drivers — see § Real vs mock fidelity — rotation semantics for
 * the documented divergences.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createRemoteJWKSet,
  decodeJwt,
  decodeProtectedHeader,
  errors as joseErrors,
  jwtVerify,
} from 'jose';
import {
  createKeycloakRealmKeyComponent,
  deleteKeycloakRealmKeyComponent,
  ensureKeycloakConfidentialClient,
  fetchJwksFromKeycloak,
  type KeycloakHandle,
  type KeycloakRealmKeyComponent,
  listKeycloakRealmKeyComponents,
  mintIdTokenFromKeycloak,
  obtainKeycloakAdminToken,
  startKeycloakContainer,
} from '../../src/adapters/real.js';

const LIVE_CONTAINER_ENABLED = process.env['OIDC_BOOTSTRAP'] === '1';

const CLIENT_ID = 'kiwa-e2e-rotation-client';
const CLIENT_SECRET = 'kiwa-e2e-rotation-secret';
const USERNAME = 'kiwa-e2e-user';
const PASSWORD = 'kiwa-e2e-password';

/**
 * Wait for Keycloak's `/certs` endpoint to advertise a given kid. Newly
 * created realm key components sometimes take a few hundred ms to appear
 * (Keycloak reloads the key ring on the next request). A short poll loop
 * keeps the axes deterministic without hard-coding a `setTimeout`.
 */
async function waitForKidInJwks(
  handle: KeycloakHandle,
  predicate: (kids: readonly string[]) => boolean,
  timeoutMs = 10_000,
): Promise<readonly string[]> {
  const start = Date.now();
  let lastKids: readonly string[] = [];
  while (Date.now() - start < timeoutMs) {
    const jwks = await fetchJwksFromKeycloak(handle.issuer);
    lastKids = jwks.keys
      .filter((k) => k.use === 'sig')
      .map((k) => k.kid ?? '')
      .filter(Boolean);
    if (predicate(lastKids)) return lastKids;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(
    `waitForKidInJwks timed out after ${timeoutMs}ms; last kids: ${JSON.stringify(lastKids)}`,
  );
}

/**
 * Build a `createRemoteJWKSet` bound to the handle's `/certs` endpoint. The
 * jose helper caches the JWKS + refetches on `kid` misses — which is
 * exactly the RP-side JWKS refresh contract the v1.22-5 axes exercise.
 */
function makeRemoteJwks(handle: KeycloakHandle) {
  return createRemoteJWKSet(
    new URL(`${handle.issuer}/protocol/openid-connect/certs`),
    {
      // Force jose to always re-fetch on cache miss so the rotation window
      // tests behave deterministically. Default cache TTL is 5 minutes which
      // would swallow the axis 4b past-retention step.
      cacheMaxAge: 100,
      cooldownDuration: 100,
    },
  );
}

describe.runIf(LIVE_CONTAINER_ENABLED)(
  'v1.22-5 Federation JWKS rotation real e2e (OIDC_BOOTSTRAP=1)',
  () => {
    let handle: KeycloakHandle;
    // Track every component id we create so `afterAll` can drop them and
    // leave the container's key ring in the same shape it started in.
    const createdComponentIds: string[] = [];

    beforeAll(async () => {
      handle = await startKeycloakContainer({
        // Cold-pull budget (image tag matches v1.22-1 wiring).
        startupTimeoutMs: 120_000,
      });
      await ensureKeycloakConfidentialClient(handle, {
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        username: USERNAME,
        password: PASSWORD,
      });
    }, 180_000);

    afterAll(async () => {
      if (handle) {
        for (const id of createdComponentIds) {
          try {
            await deleteKeycloakRealmKeyComponent(handle, id);
          } catch {
            // Best-effort cleanup — a stale delete failure should not
            // abort the container teardown.
          }
        }
        await handle.stop();
      }
    }, 60_000);

    describe('axis 4a — sign → rotate → verify inside retention window (real)', () => {
      it('T-E2E-001 id_token minted under the pre-rotation active kid verifies after rotation adds a new kid', async () => {
        // Capture pre-rotation state: the current active kid is the highest-
        // priority provider's kid. Mint an id_token under that kid.
        const preRotationJwks = await fetchJwksFromKeycloak(handle.issuer);
        const preRotationSigKids = preRotationJwks.keys
          .filter((k) => k.use === 'sig')
          .map((k) => k.kid ?? '')
          .filter(Boolean);
        expect(preRotationSigKids.length).toBeGreaterThan(0);

        const { id_token } = await mintIdTokenFromKeycloak(handle, {
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET,
          username: USERNAME,
          password: PASSWORD,
        });
        const preHeader = decodeProtectedHeader(id_token);
        expect(preHeader.kid).toBeTruthy();
        expect(preHeader.alg).toBe('RS256');
        expect(preRotationSigKids).toContain(preHeader.kid);

        // Rotate: create a fresh `rsa-generated` provider with a higher
        // priority. Keycloak swaps the active signer to the new provider.
        const created = await createKeycloakRealmKeyComponent(handle);
        createdComponentIds.push(created.id);

        // Wait for the new sig kid to surface in `/certs`. The pre-rotation
        // kid stays in the document (retention window).
        const postRotationSigKids = await waitForKidInJwks(
          handle,
          (kids) =>
            kids.length > preRotationSigKids.length &&
            preRotationSigKids.every((kid) => kids.includes(kid)),
        );
        expect(postRotationSigKids).toContain(preHeader.kid);
        expect(postRotationSigKids.length).toBeGreaterThan(
          preRotationSigKids.length,
        );

        // Verify the id_token against the refreshed JWKS through jose. This
        // is the real e2e verification — RS256 signature check + `iss` +
        // `aud` claim guards. The successful verify proves the retention
        // window is behaviourally usable by an RP.
        const jwks = makeRemoteJwks(handle);
        const { payload, protectedHeader } = await jwtVerify(id_token, jwks, {
          issuer: handle.issuer,
          audience: CLIENT_ID,
        });
        expect(payload.sub).toBeTruthy();
        expect(protectedHeader.kid).toBe(preHeader.kid);
      }, 60_000);
    });

    describe('axis 4b — verify past retention window (real)', () => {
      it('T-E2E-002 id_token minted under a provider that is deleted after rotation fails signature verify with an unknown-kid error', async () => {
        // Mint an id_token, capture the kid it was signed under.
        const { id_token } = await mintIdTokenFromKeycloak(handle, {
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET,
          username: USERNAME,
          password: PASSWORD,
        });
        const preHeader = decodeProtectedHeader(id_token);
        const preKid = String(preHeader.kid);
        expect(preKid).toBeTruthy();

        // Find the provider that owns preKid via `/admin/realms/{realm}/keys`
        // (correlates each kid to its owning `providerId`).
        const components = await listKeycloakRealmKeyComponents(handle);
        const ownerComponent = await findOwnerComponent(handle, preKid, components);

        // Capture the current sig-kid set — the post-rotation count check
        // is against sig kids (`/certs` filter), not components (which
        // also includes `hmac-generated` / `aes-generated` non-sig
        // providers that never surface in `/certs`).
        const preRotationJwks = await fetchJwksFromKeycloak(handle.issuer);
        const preRotationSigKids = preRotationJwks.keys
          .filter((k) => k.use === 'sig')
          .map((k) => k.kid ?? '')
          .filter(Boolean);

        // Rotate first so we have a fresh active signer, THEN delete the
        // provider whose kid we already used. Deleting the pre-existing
        // provider without a rotation would leave the realm without a
        // signer and break subsequent axes.
        const created = await createKeycloakRealmKeyComponent(handle);
        createdComponentIds.push(created.id);
        // Wait until `/certs` reflects the new sig kid (its count grows by
        // exactly one because the new provider is `rsa-generated`).
        await waitForKidInJwks(
          handle,
          (kids) => kids.length > preRotationSigKids.length,
        );
        await deleteKeycloakRealmKeyComponent(handle, ownerComponent.id);
        // Drop the id from the cleanup list so `afterAll` does not retry
        // the delete (Keycloak returns 404 which is safe, but a clean
        // cleanup log helps future debugging).
        const idx = createdComponentIds.indexOf(ownerComponent.id);
        if (idx >= 0) createdComponentIds.splice(idx, 1);

        // Wait for `/certs` to drop preKid. Keycloak reloads the realm
        // key registry on the next request but a small propagation delay
        // is possible; give the poll enough headroom to distinguish
        // "delete succeeded and JWKS refreshed" from "delete failed
        // silently". Timeout raised to 30s to absorb JVM GC pauses under
        // container load.
        await waitForKidInJwks(
          handle,
          (kids) => !kids.includes(preKid),
          30_000,
        );

        // Verify: jose refuses because kid is not in the refreshed JWKS.
        // The refused promise carries `JWKSNoMatchingKey`, which is jose's
        // documented refusal shape for a token whose header kid does not
        // appear in the fetched JWKS document.
        const jwks = makeRemoteJwks(handle);
        await expect(
          jwtVerify(id_token, jwks, {
            issuer: handle.issuer,
            audience: CLIENT_ID,
          }),
        ).rejects.toBeInstanceOf(joseErrors.JWKSNoMatchingKey);
      }, 90_000);
    });

    describe('axis 4c — multi-rotation retention (real)', () => {
      it('T-E2E-003 three consecutive rotations retain every previous kid in /certs + every id_token verifies through jose', async () => {
        // Baseline: how many sig kids are in `/certs` right now.
        const baseline = await fetchJwksFromKeycloak(handle.issuer);
        const baselineSigCount = baseline.keys.filter((k) => k.use === 'sig').length;

        // Mint an id_token under the current active kid, rotate, mint
        // again, rotate, mint again. Three id_tokens across three active
        // kids — every one should still verify because the previous
        // providers stay in `/certs`.
        const tokens: string[] = [];
        const kids: string[] = [];
        for (let i = 0; i < 3; i++) {
          const { id_token } = await mintIdTokenFromKeycloak(handle, {
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            username: USERNAME,
            password: PASSWORD,
          });
          tokens.push(id_token);
          const header = decodeProtectedHeader(id_token);
          kids.push(String(header.kid));
          // Rotate for the next iteration. Skip the final rotation so the
          // last id_token was minted under the latest active kid — its
          // verification does not depend on retention.
          if (i < 2) {
            const created = await createKeycloakRealmKeyComponent(handle);
            createdComponentIds.push(created.id);
            // Wait for the new kid to surface before the next mint.
            await waitForKidInJwks(
              handle,
              (surface) => surface.length >= baselineSigCount + i + 1,
            );
          }
        }

        // Every previous kid stays in `/certs` (retention window is open
        // for all of them since we did not delete any provider).
        const postRotationJwks = await fetchJwksFromKeycloak(handle.issuer);
        const postRotationSigKids = postRotationJwks.keys
          .filter((k) => k.use === 'sig')
          .map((k) => k.kid ?? '')
          .filter(Boolean);
        for (const kid of kids) {
          expect(postRotationSigKids).toContain(kid);
        }

        // Every id_token verifies through jose against the refreshed JWKS.
        const jwks = makeRemoteJwks(handle);
        for (const token of tokens) {
          const { protectedHeader } = await jwtVerify(token, jwks, {
            issuer: handle.issuer,
            audience: CLIENT_ID,
          });
          expect(kids).toContain(String(protectedHeader.kid));
        }
      }, 90_000);
    });

    describe('axis 4d — fresh active key issues verifiable id_tokens after rotation (real)', () => {
      it('T-E2E-004 id_token minted after rotation is signed under the new active kid + verifies immediately', async () => {
        // Snapshot pre-rotation active kid — it is the highest-priority
        // enabled component's kid (Keycloak selects the highest-priority
        // enabled provider as the active signer).
        const preComponents = await listKeycloakRealmKeyComponents(handle);
        const preActiveComponentId = preComponents[0]?.id;
        expect(preActiveComponentId).toBeTruthy();

        const preJwks = await fetchJwksFromKeycloak(handle.issuer);
        const preSigKids = preJwks.keys
          .filter((k) => k.use === 'sig')
          .map((k) => k.kid ?? '')
          .filter(Boolean);

        // Rotate.
        const created = await createKeycloakRealmKeyComponent(handle);
        createdComponentIds.push(created.id);
        await waitForKidInJwks(
          handle,
          (kids) => kids.length > preSigKids.length,
        );

        // Post-rotation active kid is the one that was not in the pre-
        // rotation set.
        const postJwks = await fetchJwksFromKeycloak(handle.issuer);
        const postSigKids = postJwks.keys
          .filter((k) => k.use === 'sig')
          .map((k) => k.kid ?? '')
          .filter(Boolean);
        const freshKids = postSigKids.filter((kid) => !preSigKids.includes(kid));
        expect(freshKids.length).toBe(1);
        const freshKid = freshKids[0]!;

        // Mint an id_token. The header MUST show the new active kid.
        const { id_token } = await mintIdTokenFromKeycloak(handle, {
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET,
          username: USERNAME,
          password: PASSWORD,
        });
        const header = decodeProtectedHeader(id_token);
        expect(header.kid).toBe(freshKid);
        expect(header.alg).toBe('RS256');

        // Verify through jose — real RS256 signature check against the
        // fresh public key. Immediate verification proves there is no
        // bootstrap delay on a freshly-rotated key.
        const jwks = makeRemoteJwks(handle);
        const { payload } = await jwtVerify(id_token, jwks, {
          issuer: handle.issuer,
          audience: CLIENT_ID,
        });
        // Sanity check the payload — the exact `sub` value depends on
        // Keycloak's UUID assignment but it must be present and non-empty.
        expect(payload.sub).toBeTruthy();
        expect(payload.iss).toBe(handle.issuer);

        // Cross-check: decoded (unverified) claims match the verified
        // claims — pins that the JWT was well-formed.
        const decoded = decodeJwt(id_token);
        expect(decoded.sub).toBe(payload.sub);
      }, 60_000);
    });
  },
);

/**
 * Locate the realm key component whose signing kid matches `targetKid`. We
 * cannot read `kid` directly from the component config on freshly-created
 * providers (Keycloak generates the kid server-side + only surfaces it
 * through the derived JWKS document). Correlating component → kid runs
 * through `/admin/realms/{realm}/keys` which returns each active kid
 * paired with the owning `providerId` value.
 */
async function findOwnerComponent(
  handle: KeycloakHandle,
  targetKid: string,
  components: readonly KeycloakRealmKeyComponent[],
): Promise<KeycloakRealmKeyComponent> {
  const url = `${handle.baseUrl}/admin/realms/${handle.realm}/keys`;
  const token = await obtainKeycloakAdminToken(handle);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `keycloak keys metadata fetch failed ${response.status}: ${text}`,
    );
  }
  const body = (await response.json()) as {
    keys?: readonly { kid?: string; providerId?: string }[];
  };
  const match = body.keys?.find((entry) => entry.kid === targetKid);
  if (!match?.providerId) {
    throw new Error(
      `keycloak keys metadata missing entry for kid ${targetKid}`,
    );
  }
  const owner = components.find((component) => component.id === match.providerId);
  if (!owner) {
    throw new Error(
      `component ${match.providerId} owning kid ${targetKid} not found among ${components.length} components`,
    );
  }
  return owner;
}
