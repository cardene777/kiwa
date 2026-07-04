/**
 * v1.22-2 oauth2-mock-server testcontainers real driver fidelity harness.
 *
 * Exercises the real adapter (`src/adapters/real.ts`) built on top of the
 * v1.21-3 mock scaffold. Two test phases:
 *
 *   1. Always-on env-skip semantics — proves the adapter refuses live
 *      ceremonies with `KIWA_OAUTH21_ENV_MISSING` when Docker + the
 *      pre-provisioned URL are absent, that the sync interface parity
 *      holds (ceremonial methods refuse in env-ready mode too because the
 *      real driver cannot express the HTTP round-trip through a sync
 *      call), and that the discovery fetcher rejects network failures
 *      cleanly.
 *
 *   2. Live container coverage (opt-in) — `describe.runIf(OAUTH21_BOOTSTRAP='1')`
 *      spins the Navikt oauth2-mock-server up once (`beforeAll`) + runs
 *      the discovery axis diff between mock and real. Container startup
 *      is slow (20-40s on cold pull) so this block is gated behind
 *      `OAUTH21_BOOTSTRAP=1` — CI runs it on the release-gate leg only,
 *      developers can drop it locally with the same env flag.
 *
 * The live block covers axis 1 (discovery metadata shape) — the only
 * endpoint the sync interface can serve live because discovery is a
 * one-shot fetch. `/authorize` + `/token` + `/revoke` + `/introspect`
 * remain on the mock-as-reference matrix documented in
 * `docs/quality-reports/auth/oauth21-provider.md` § Real vs mock fidelity.
 * Wiring those live would require the OAuth21ASAdapter interface to grow
 * async counterparts, which is a Sub-Issue v1.22-N follow-up.
 */

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  fetchDiscoveryFromMock,
  isEnvReady,
  makeRealAdapter,
  startOAuth2MockServerContainer,
  detectRealEnvMissing,
  KIWA_OAUTH21_ENV_MISSING,
  type OAuth2MockServerHandle,
} from '../src/adapters/real.js';
import { makeMockAdapter } from '../src/adapters/mock.js';

const ISSUER = 'https://as.example.test';
const LIVE_CONTAINER_ENABLED = process.env['OAUTH21_BOOTSTRAP'] === '1';

function clearBootstrapEnv(): void {
  delete process.env['OAUTH21_BOOTSTRAP'];
  delete process.env['KIWA_MODE'];
  delete process.env['OAUTH21_MOCK_SERVER_URL'];
}

describe('env detection helpers', () => {
  afterEach(clearBootstrapEnv);

  it('isEnvReady returns true only when both OAUTH21_BOOTSTRAP=1 and OAUTH21_MOCK_SERVER_URL are set', () => {
    expect(isEnvReady({})).toBe(false);
    expect(isEnvReady({ OAUTH21_BOOTSTRAP: '1' })).toBe(false);
    expect(isEnvReady({ OAUTH21_MOCK_SERVER_URL: 'http://x' })).toBe(false);
    expect(
      isEnvReady({ OAUTH21_BOOTSTRAP: '1', OAUTH21_MOCK_SERVER_URL: 'http://x' }),
    ).toBe(true);
    // Any other value for OAUTH21_BOOTSTRAP refuses — the env-detect is strict.
    expect(
      isEnvReady({ OAUTH21_BOOTSTRAP: 'true', OAUTH21_MOCK_SERVER_URL: 'http://x' }),
    ).toBe(false);
  });

  it('detectRealEnvMissing reports KIWA_MODE=mock as an explicit opt-out', () => {
    expect(detectRealEnvMissing({ KIWA_MODE: 'mock' })).toBe('KIWA_MODE=mock');
  });

  it('detectRealEnvMissing reports the env gate when OAUTH21_BOOTSTRAP is unset', () => {
    expect(detectRealEnvMissing({})).toBe(KIWA_OAUTH21_ENV_MISSING);
  });

  it('detectRealEnvMissing returns null when OAUTH21_BOOTSTRAP=1', () => {
    expect(detectRealEnvMissing({ OAUTH21_BOOTSTRAP: '1' })).toBeNull();
  });
});

describe('real adapter env-missing path (v1.21-3 regressions)', () => {
  afterEach(clearBootstrapEnv);

  it('discovery returns the static shape even in env-missing mode', () => {
    const adapter = makeRealAdapter({ issuer: ISSUER, env: {} });
    const metadata = adapter.discovery();
    expect(metadata.issuer).toBe(ISSUER);
    expect(metadata.authorization_endpoint).toBe(`${ISSUER}/authorize`);
    expect(metadata.code_challenge_methods_supported).toEqual(['S256']);
  });

  it('authorize refuses with KIWA_OAUTH21_ENV_MISSING + trace event', () => {
    const adapter = makeRealAdapter({ issuer: ISSUER, env: {} });
    expect(() =>
      adapter.authorize(
        {
          responseType: 'code',
          clientId: 'c',
          redirectUri: 'https://client.example.test/callback',
          state: 's',
          codeChallenge: 'x'.repeat(43),
          codeChallengeMethod: 'S256',
        },
        'user-1',
      ),
    ).toThrow(KIWA_OAUTH21_ENV_MISSING);
    const trace = adapter.traces().find((event) => event.op === 'authorize');
    expect(trace?.ok).toBe(false);
    expect(trace?.errorKind).toBe(KIWA_OAUTH21_ENV_MISSING);
  });

  it('token refuses with KIWA_OAUTH21_ENV_MISSING + trace event', () => {
    const adapter = makeRealAdapter({ issuer: ISSUER, env: {} });
    expect(() =>
      adapter.token({
        grantType: 'authorization_code',
        code: 'c',
        redirectUri: 'https://client.example.test/callback',
        clientId: 'c',
        codeVerifier: 'v'.repeat(43),
      }),
    ).toThrow(KIWA_OAUTH21_ENV_MISSING);
    const trace = adapter.traces().find((event) => event.op === 'token');
    expect(trace?.ok).toBe(false);
    expect(trace?.errorKind).toBe(KIWA_OAUTH21_ENV_MISSING);
  });

  it('revoke refuses with KIWA_OAUTH21_ENV_MISSING + trace event', () => {
    const adapter = makeRealAdapter({ issuer: ISSUER, env: {} });
    expect(() => adapter.revoke('at-x', 'c')).toThrow(KIWA_OAUTH21_ENV_MISSING);
    const trace = adapter.traces().find((event) => event.op === 'revoke');
    expect(trace?.ok).toBe(false);
    expect(trace?.errorKind).toBe(KIWA_OAUTH21_ENV_MISSING);
  });

  it('introspect refuses with KIWA_OAUTH21_ENV_MISSING + trace event', () => {
    const adapter = makeRealAdapter({ issuer: ISSUER, env: {} });
    expect(() => adapter.introspect('at-x')).toThrow(KIWA_OAUTH21_ENV_MISSING);
    const trace = adapter.traces().find((event) => event.op === 'introspect');
    expect(trace?.ok).toBe(false);
    expect(trace?.errorKind).toBe(KIWA_OAUTH21_ENV_MISSING);
  });

  it('reset drops the trace + serves as a session boundary', async () => {
    const adapter = makeRealAdapter({ issuer: ISSUER, env: {} });
    adapter.discovery();
    expect(adapter.traces().length).toBeGreaterThan(0);
    await adapter.reset();
    expect(adapter.traces()).toHaveLength(0);
  });

  it('refreshLiveDiscovery refuses without env-ready state', async () => {
    // The async prefetch helper must guard on the same env-detect the sync
    // methods use — otherwise a caller invoking `refreshLiveDiscovery()` in
    // env-missing mode would silently issue a network request against the
    // default `issuer` URL (`https://as.example.test`, which does not exist).
    const adapter = makeRealAdapter({ issuer: ISSUER, env: {} });
    await expect(adapter.refreshLiveDiscovery()).rejects.toThrow(
      KIWA_OAUTH21_ENV_MISSING,
    );
  });
});

describe('real adapter env-ready sync interface parity (v1.22-2)', () => {
  // env-ready mode is proven with a pre-provisioned URL that doesn't need
  // Docker — we only assert the sync interface refuses cleanly with a
  // distinguishable detail message. The live fetch behaviour is exercised
  // in the runIf-gated block below.
  const READY_ENV = {
    OAUTH21_BOOTSTRAP: '1',
    OAUTH21_MOCK_SERVER_URL: 'http://127.0.0.1:0/kiwa',
  };

  it('authorize refuses with a "sync interface parity" detail in env-ready mode', () => {
    const adapter = makeRealAdapter({ issuer: ISSUER, env: READY_ENV });
    expect(() =>
      adapter.authorize(
        {
          responseType: 'code',
          clientId: 'c',
          redirectUri: 'https://client.example.test/callback',
          state: 's',
          codeChallenge: 'x'.repeat(43),
          codeChallengeMethod: 'S256',
        },
        'user-1',
      ),
    ).toThrow(/sync interface/);
    const trace = adapter.traces().find((event) => event.op === 'authorize');
    expect(String(trace?.detail?.['reason'] ?? '')).toMatch(/sync interface/);
  });

  it('token refuses with a "sync interface parity" detail in env-ready mode', () => {
    const adapter = makeRealAdapter({ issuer: ISSUER, env: READY_ENV });
    expect(() =>
      adapter.token({
        grantType: 'authorization_code',
        code: 'c',
        redirectUri: 'https://client.example.test/callback',
        clientId: 'c',
        codeVerifier: 'v'.repeat(43),
      }),
    ).toThrow(/sync interface/);
    const trace = adapter.traces().find((event) => event.op === 'token');
    expect(String(trace?.detail?.['reason'] ?? '')).toMatch(/sync interface/);
  });

  it('effectiveIssuer reflects OAUTH21_MOCK_SERVER_URL when env-ready', () => {
    const adapter = makeRealAdapter({ issuer: ISSUER, env: READY_ENV });
    expect(adapter.effectiveIssuer).toBe('http://127.0.0.1:0/kiwa');
  });
});

describe('fetchDiscoveryFromMock (network-error path)', () => {
  it('surfaces error on network failure', async () => {
    // Point at a port that is guaranteed to refuse. The failure should
    // wrap the raw fetch error with the env-missing marker so the harness
    // can classify it uniformly.
    await expect(
      fetchDiscoveryFromMock('http://127.0.0.1:1/kiwa'),
    ).rejects.toThrow();
  });
});

// -----------------------------------------------------------------------
// Live container coverage (opt-in). Boots one oauth2-mock-server container
// per file, reuses it across every axis. Skipped by default; developers +
// CI flip `OAUTH21_BOOTSTRAP=1` to opt in.
// -----------------------------------------------------------------------

describe.runIf(LIVE_CONTAINER_ENABLED)(
  'oauth2-mock-server live coverage (OAUTH21_BOOTSTRAP=1)',
  () => {
    let handle: OAuth2MockServerHandle;

    beforeAll(async () => {
      // Startup timeout raised to 120s to absorb a cold-pull image
      // download on the first CI run. Subsequent runs hit the container
      // cache and finish in ~10s.
      handle = await startOAuth2MockServerContainer({
        startupTimeoutMs: 120_000,
      });
    }, 180_000);

    afterAll(async () => {
      if (handle) {
        await handle.stop();
      }
    }, 60_000);

    describe('axis 1 — discovery metadata shape (live)', () => {
      it('real driver fetches oauth2-mock-server discovery + satisfies RFC 8414 §2', async () => {
        const adapter = makeRealAdapter({
          issuer: handle.issuer,
          env: {
            OAUTH21_BOOTSTRAP: '1',
            OAUTH21_MOCK_SERVER_URL: handle.issuer,
          },
          container: handle,
        });
        const live = await adapter.refreshLiveDiscovery();
        // Navikt's mock returns its own issuer URL — trailing-slash pattern
        // stays consistent across drivers.
        expect(live.issuer.replace(/\/$/, '')).toBe(
          handle.issuer.replace(/\/$/, ''),
        );
        // Every mandatory RFC 8414 field is present.
        expect(live.authorization_endpoint).toBeTruthy();
        expect(live.token_endpoint).toBeTruthy();
        expect(live.jwks_uri).toBeTruthy();
      });

      it('mock vs real advertise the same OAuth 2.1 hardened fields (axis 1 diff)', async () => {
        const mock = await makeMockAdapter({ issuer: handle.issuer });
        const real = makeRealAdapter({
          issuer: handle.issuer,
          env: {
            OAUTH21_BOOTSTRAP: '1',
            OAUTH21_MOCK_SERVER_URL: handle.issuer,
          },
          container: handle,
        });
        const mockMeta = mock.discovery();
        const realMeta = await real.refreshLiveDiscovery();
        // Both drivers must advertise the OAuth 2.1 hardened subset. The
        // real driver's actual values differ (Navikt hosts the mock at
        // `/{issuer}/authorization` vs the kiwa mock's `/authorize`) so the
        // fidelity is on `response_types_supported`, `grant_types_supported`
        // and `code_challenge_methods_supported` — the invariants that
        // OAuth 2.1 refuses to compromise on.
        expect(mockMeta.response_types_supported).toEqual(['code']);
        expect(realMeta.response_types_supported).toEqual(['code']);
        expect(mockMeta.code_challenge_methods_supported).toEqual(['S256']);
        expect(realMeta.code_challenge_methods_supported).toEqual(['S256']);
      });

      it('subsequent discovery() calls serve the cached live document (no re-fetch)', async () => {
        const adapter = makeRealAdapter({
          issuer: handle.issuer,
          env: {
            OAUTH21_BOOTSTRAP: '1',
            OAUTH21_MOCK_SERVER_URL: handle.issuer,
          },
          container: handle,
        });
        const live = await adapter.refreshLiveDiscovery();
        // sync `discovery()` after prefetch returns the cached document,
        // not the static fallback.
        const cached = adapter.discovery();
        expect(cached).toEqual(live);
        // The trace event's `liveCached` detail flag flips to `true`.
        const trace = adapter
          .traces()
          .find((event) => event.op === 'discovery');
        expect(trace?.detail?.['liveCached']).toBe(true);
      });
    });
  },
);
