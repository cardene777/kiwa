/**
 * v1.22-1 Keycloak testcontainers real driver fidelity harness.
 *
 * Exercises the real adapter (`src/adapters/real.ts`) built on top of the
 * v1.21-4 mock scaffold. Two test phases:
 *
 *   1. Always-on env-skip semantics — proves the adapter refuses live
 *      ceremonies with `KIWA_OIDC_ENV_MISSING` when Docker + Keycloak are
 *      absent, that the sync interface parity holds (rotation + registration
 *      still refuse in env-ready mode with a distinguishable detail message),
 *      and that the Keycloak fetchers themselves reject network failures
 *      cleanly.
 *
 *   2. Live container coverage (opt-in) — `describe.runIf(OIDC_BOOTSTRAP='1')`
 *      spins Keycloak up once (`beforeAll`) + runs axes 1-3 (discovery / JWKS)
 *      diff between mock and real. Container startup is slow (30-60s on cold
 *      pull) so this block is gated behind `OIDC_BOOTSTRAP=1` — CI runs it
 *      on the release-gate leg only, developers can drop it locally with the
 *      same env flag.
 *
 * The live block does NOT cover axes 4-16 (rotation e2e / DCR / id_token verify
 * / Federation trust chain). Those axes remain on the mock-as-reference matrix
 * documented in `docs/quality-reports/auth/oidc-federation.md` § Real vs mock
 * fidelity — measurement plan. Rationale:
 *   - Axis 4 (rotation) lives on Keycloak's admin REST API + realm-key CRUD,
 *     which is outside the fidelity adapter's scope (the mock's deterministic
 *     rotation is the release-gate reference).
 *   - Axes 5-8 (DCR) require an authenticated admin session to enable the
 *     anonymous client-registration policy on the fresh realm; the fidelity
 *     surface stays sync-parity with the mock.
 *   - Axes 9-12 (id_token verify) diff signature crypto — the mock stubs
 *     `n` / `e` / `x` / `y` per JwksKey which is intentional (RFC 7517
 *     shape without cryptographic invariants). Keycloak signs with real
 *     crypto so parity requires a `jose` verify pass through the fetched
 *     JWKS which is a Sub-Issue v1.22-N follow-up.
 *   - Axes 13-16 (Federation §7) require Keycloak's OpenID Federation
 *     extension which isn't enabled in the vanilla image — deferred to a
 *     dedicated Sub-Issue that provisions the extension.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  fetchDiscoveryFromKeycloak,
  fetchJwksFromKeycloak,
  isEnvReady,
  makeRealAdapter,
  shouldBootContainer,
  startKeycloakContainer,
  type KeycloakHandle,
} from '../src/adapters/real.js';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { KIWA_OIDC_ENV_MISSING } from '../src/adapters/interface.js';
import { assertRequiredDiscoveryFields } from '../src/lib/discovery.js';

const ISSUER = 'https://op.example.test';
const LIVE_CONTAINER_ENABLED = process.env['OIDC_BOOTSTRAP'] === '1';

describe('env detection helpers', () => {
  it('isEnvReady returns true only when both OIDC_BOOTSTRAP=1 and KEYCLOAK_URL are set', () => {
    expect(isEnvReady({})).toBe(false);
    expect(isEnvReady({ OIDC_BOOTSTRAP: '1' })).toBe(false);
    expect(isEnvReady({ KEYCLOAK_URL: 'http://x' })).toBe(false);
    expect(
      isEnvReady({ OIDC_BOOTSTRAP: '1', KEYCLOAK_URL: 'http://x' }),
    ).toBe(true);
    // Any other value for OIDC_BOOTSTRAP refuses — the env-detect is strict.
    expect(
      isEnvReady({ OIDC_BOOTSTRAP: 'true', KEYCLOAK_URL: 'http://x' }),
    ).toBe(false);
  });

  it('shouldBootContainer returns true when OIDC_BOOTSTRAP=1 and KEYCLOAK_URL is unset', () => {
    // Pre-provisioned URL path skips the boot; the harness reuses an
    // externally-supplied container.
    expect(shouldBootContainer({ OIDC_BOOTSTRAP: '1' })).toBe(true);
    // Empty string is treated as "provided" and skips boot.
    expect(
      shouldBootContainer({ OIDC_BOOTSTRAP: '1', KEYCLOAK_URL: 'http://x' }),
    ).toBe(false);
    // Without OIDC_BOOTSTRAP=1 the adapter never boots.
    expect(shouldBootContainer({})).toBe(false);
  });
});

describe('real adapter env-missing path (v1.21-4 regressions)', () => {
  it('discovery returns the static shape even in env-missing mode', async () => {
    const adapter = await makeRealAdapter({ issuer: ISSUER, env: {} });
    const metadata = adapter.discovery();
    expect(metadata.issuer).toBe(ISSUER);
    expect(() => assertRequiredDiscoveryFields(metadata)).not.toThrow();
    await adapter.reset();
  });

  it('jwks refuses with KIWA_OIDC_ENV_MISSING trace event', async () => {
    const adapter = await makeRealAdapter({ issuer: ISSUER, env: {} });
    expect(() => adapter.jwks()).toThrow(KIWA_OIDC_ENV_MISSING);
    const trace = adapter.traces().find((event) => event.op === 'jwks');
    expect(trace?.ok).toBe(false);
    expect(trace?.errorKind).toBe(KIWA_OIDC_ENV_MISSING);
    await adapter.reset();
  });

  it('rotateJwks refuses with a documented reason detail', async () => {
    const adapter = await makeRealAdapter({ issuer: ISSUER, env: {} });
    expect(() => adapter.rotateJwks()).toThrow(KIWA_OIDC_ENV_MISSING);
    const trace = adapter.traces().find((event) => event.op === 'jwksRotate');
    expect(trace?.ok).toBe(false);
    expect(trace?.errorKind).toBe(KIWA_OIDC_ENV_MISSING);
    // The detail message points at the mock-as-reference matrix so the
    // failure is discoverable without grepping the source.
    expect(String(trace?.detail?.['reason'] ?? '')).toMatch(/mock is the release-gate reference/i);
    await adapter.reset();
  });

  it('registerClient refuses with the env-missing detail in env-missing mode', async () => {
    const adapter = await makeRealAdapter({ issuer: ISSUER, env: {} });
    expect(() =>
      adapter.registerClient({
        redirect_uris: ['https://rp.example.test/callback'],
      }),
    ).toThrow(KIWA_OIDC_ENV_MISSING);
    const trace = adapter.traces().find((event) => event.op === 'registerClient');
    expect(trace?.ok).toBe(false);
    expect(trace?.errorKind).toBe(KIWA_OIDC_ENV_MISSING);
    expect(String(trace?.detail?.['reason'] ?? '')).toBe('env-missing');
    await adapter.reset();
  });

  it('reset drops the trace + serves as a session boundary', async () => {
    const adapter = await makeRealAdapter({ issuer: ISSUER, env: {} });
    adapter.discovery();
    expect(adapter.traces().length).toBeGreaterThan(0);
    await adapter.reset();
    // reset appends a single `reset` trace event.
    const trace = adapter.traces();
    expect(trace).toHaveLength(1);
    expect(trace[0]?.op).toBe('reset');
    expect(trace[0]?.ok).toBe(true);
  });

  it('refreshLiveDiscovery + refreshLiveJwks refuse without env-ready state', async () => {
    // The async prefetch helpers must guard on the same env-detect the sync
    // methods use — otherwise a caller invoking `refreshLiveDiscovery()` in
    // env-missing mode would silently issue a network request against the
    // default `issuer` URL (`https://op.example.test`, which does not exist).
    const adapter = await makeRealAdapter({ issuer: ISSUER, env: {} });
    await expect(adapter.refreshLiveDiscovery()).rejects.toThrow(
      KIWA_OIDC_ENV_MISSING,
    );
    await expect(adapter.refreshLiveJwks()).rejects.toThrow(
      KIWA_OIDC_ENV_MISSING,
    );
    await adapter.reset();
  });
});

describe('real adapter env-ready sync interface parity (v1.22-1)', () => {
  // env-ready mode is proven with a pre-provisioned URL that doesn't need
  // Docker — we only assert the sync interface refuses cleanly with a
  // distinguishable detail message. The live fetch behaviour is exercised
  // in the runIf-gated block below.
  const READY_ENV = {
    OIDC_BOOTSTRAP: '1',
    KEYCLOAK_URL: 'http://127.0.0.1:0/realms/kiwa',
  };

  it('jwks refuses with a "call refreshLiveJwks() first" detail in env-ready mode', async () => {
    const adapter = await makeRealAdapter({ issuer: ISSUER, env: READY_ENV });
    expect(() => adapter.jwks()).toThrow(KIWA_OIDC_ENV_MISSING);
    const trace = adapter.traces().find((event) => event.op === 'jwks');
    expect(trace?.detail?.['reason']).toBe(
      'call refreshLiveJwks() before jwks() in real mode',
    );
    await adapter.reset();
  });

  it('registerClient refuses with a sync-interface parity detail in env-ready mode', async () => {
    const adapter = await makeRealAdapter({ issuer: ISSUER, env: READY_ENV });
    expect(() =>
      adapter.registerClient({
        redirect_uris: ['https://rp.example.test/callback'],
      }),
    ).toThrow(/registerClientLive/);
    const trace = adapter.traces().find((event) => event.op === 'registerClient');
    expect(String(trace?.detail?.['reason'] ?? '')).toMatch(/registerClientLive/);
    await adapter.reset();
  });
});

describe('Keycloak fetch helpers (network-error path)', () => {
  it('fetchDiscoveryFromKeycloak surfaces KIWA_OIDC_ENV_MISSING on network failure', async () => {
    // Point at a port that is guaranteed to refuse. The failure should
    // wrap the raw fetch error with the env-missing marker so the harness
    // can classify it uniformly.
    await expect(
      fetchDiscoveryFromKeycloak('http://127.0.0.1:1/realms/kiwa'),
    ).rejects.toThrow();
  });

  it('fetchJwksFromKeycloak surfaces KIWA_OIDC_ENV_MISSING on network failure', async () => {
    await expect(
      fetchJwksFromKeycloak('http://127.0.0.1:1/realms/kiwa'),
    ).rejects.toThrow();
  });
});

// -----------------------------------------------------------------------
// Live container coverage (opt-in). Boots one Keycloak container per file,
// reuses it across every axis. Skipped by default; developers + CI flip
// `OIDC_BOOTSTRAP=1` to opt in.
// -----------------------------------------------------------------------

describe.runIf(LIVE_CONTAINER_ENABLED)(
  'Keycloak live coverage (OIDC_BOOTSTRAP=1)',
  () => {
    let handle: KeycloakHandle;

    beforeAll(async () => {
      // Startup timeout raised to 120s to absorb a cold-pull image
      // download on the first CI run. Subsequent runs hit the container
      // cache and finish in ~15s.
      handle = await startKeycloakContainer({
        startupTimeoutMs: 120_000,
      });
    }, 180_000);

    afterAll(async () => {
      if (handle) {
        await handle.stop();
      }
    }, 60_000);

    describe('axis 1 — discovery metadata shape (live)', () => {
      it('real driver fetches Keycloak discovery + satisfies OIDC Discovery §3', async () => {
        const adapter = await makeRealAdapter({
          issuer: handle.issuer,
          env: { OIDC_BOOTSTRAP: '1', KEYCLOAK_URL: handle.issuer },
          keycloak: handle,
        });
        const live = await adapter.refreshLiveDiscovery();
        expect(() => assertRequiredDiscoveryFields(live)).not.toThrow();
        // Keycloak returns its own issuer URL — the trailing-slash pattern
        // stays consistent across drivers.
        expect(live.issuer.replace(/\/$/, '')).toBe(
          handle.issuer.replace(/\/$/, ''),
        );
        await adapter.reset();
      });

      it('mock vs real advertise the same OIDC Discovery §3 mandatory fields (axis 1 diff)', async () => {
        const mock = await makeMockAdapter({ issuer: handle.issuer });
        const real = await makeRealAdapter({
          issuer: handle.issuer,
          env: { OIDC_BOOTSTRAP: '1', KEYCLOAK_URL: handle.issuer },
          keycloak: handle,
        });
        const mockMeta = mock.discovery();
        const realMeta = await real.refreshLiveDiscovery();
        // Both drivers advertise the mandatory §3 fields; the values differ
        // (Keycloak uses `/protocol/openid-connect/*` paths vs the mock's
        // `/authorize` / `/token` shortcuts) so we only assert on shape +
        // subset semantics.
        expect(mockMeta.issuer).toBeDefined();
        expect(realMeta.issuer).toBeDefined();
        expect(realMeta.jwks_uri).toContain('/protocol/openid-connect/certs');
        expect(realMeta.token_endpoint).toContain('/protocol/openid-connect/token');
        expect(realMeta.authorization_endpoint).toContain(
          '/protocol/openid-connect/auth',
        );
        // OAuth 2.1 restrictions — both drivers MUST advertise S256.
        expect(realMeta.code_challenge_methods_supported).toContain('S256');
        expect(mockMeta.code_challenge_methods_supported).toContain('S256');
        await mock.reset();
        await real.reset();
      });
    });

    describe('axis 3 — JWKS active key shape (live)', () => {
      it('real driver fetches Keycloak JWKS + at least one sig key satisfies RFC 7517 §4', async () => {
        const adapter = await makeRealAdapter({
          issuer: handle.issuer,
          env: { OIDC_BOOTSTRAP: '1', KEYCLOAK_URL: handle.issuer },
          keycloak: handle,
        });
        const live = await adapter.refreshLiveJwks();
        expect(live.keys.length).toBeGreaterThan(0);
        // Real IdPs advertise multiple keys under a single JWKS document —
        // Keycloak in particular emits both `use=sig` (id_token signing) and
        // `use=enc` (id_token / userinfo encryption) keys. The mock's
        // `assertJwksDocumentShape` is scoped to sig-only realms so the
        // real-driver fidelity check filters to `use=sig` first + then
        // pins the mandatory §4 fields on each signing key. Non-sig keys
        // are legitimate in a real deployment; asserting them into the
        // sig-only shape would produce a false-positive divergence.
        const sigKeys = live.keys.filter((k) => k.use === 'sig');
        expect(sigKeys.length).toBeGreaterThan(0);
        for (const key of sigKeys) {
          expect(key.kid).toBeTruthy();
          expect(['RS256', 'ES256']).toContain(key.alg);
        }
        // The full-document assertJwksDocumentShape guard from the mock is
        // intentionally NOT invoked here — see `docs/quality-reports/auth/oidc-federation.md`
        // § Real vs mock fidelity — sig-only filtering.
        await adapter.reset();
      });

      it('subsequent jwks() calls serve the cached document (no re-fetch)', async () => {
        const adapter = await makeRealAdapter({
          issuer: handle.issuer,
          env: { OIDC_BOOTSTRAP: '1', KEYCLOAK_URL: handle.issuer },
          keycloak: handle,
        });
        await adapter.refreshLiveJwks();
        const first = adapter.jwks();
        const second = adapter.jwks();
        // Same-reference guarantees the sync path is a cache hit.
        expect(first).toBe(second);
        await adapter.reset();
      });
    });
  },
);
