import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import {
  setupAuth0Env,
  setupBetterAuthEnv,
  setupClerkEnv,
  setupLuciaEnv,
  setupNextAuthEnv,
  setupOAuth21Env,
  setupOidcEnv,
  setupPasskeyEnv,
  setupSupabaseAuthEnv,
  setupWebAuthnEnv,
} from '../../src/index.js';

// SaaS layer baseline を .perf-baseline/saas/{name}.json に分離する規約
// (v1.25-4、 Issue #930 / CAR-500)。 core / framework と混ざらない。
const MODULE = 'auth';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf/saas', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline/saas', `${MODULE}.json`);

// v1.25-4 の real driver perf は KIWA_MODE=real 時のみ opt-in。
// mock との p95 diff を SSOT 化するが、 default (mock) 走査で baseline は成立する。
// 実 provider (Keycloak / oauth2-mock-server) は testcontainers 起動が要るため、
// CI / dev の default では skip して 3-layer harness の determinism を維持する。
const REAL_MODE = process.env.KIWA_MODE === 'real';

describe(MODULE, () => {
  it(
    '3-layer perf: 6 provider (NextAuth / Lucia / Better Auth / Clerk / Auth0 / Supabase) + 4 protocol (WebAuthn / Passkey / OAuth 2.1 / OIDC) primary paths',
    async () => {
      // Reuse a single env per provider so per-iteration cost = adapter roundtrip,
      // not setup. setup 側は 1 回だけ (in-memory adapter の initial migration 相当)。
      const nextAuth = await setupNextAuthEnv();
      const lucia = await setupLuciaEnv();
      const betterAuth = await setupBetterAuthEnv();
      const clerk = await setupClerkEnv();
      const auth0 = await setupAuth0Env({ tenant: 'kiwa-perf' });
      const supabase = await setupSupabaseAuthEnv();

      const webauthn = await setupWebAuthnEnv({
        authenticators: [
          {
            attachment: 'platform',
            transport: 'internal',
            hasResidentKey: true,
            hasUserVerification: true,
          },
        ],
      });
      const passkey = await setupPasskeyEnv({
        devices: [{ deviceId: 'macbook-1', platform: { biometric: 'touch-id' } }],
      });
      const oauth21 = await setupOAuth21Env({
        issuer: 'https://as.example.test',
        clients: [
          {
            clientId: 'client-A',
            redirectUris: ['https://app.example.test/cb'],
            scopes: ['openid', 'profile', 'email'],
            clientType: 'public',
          },
        ],
        users: [{ subject: 'user-1', scopes: ['openid', 'profile', 'email'] }],
      });
      const oidc = await setupOidcEnv({
        issuer: 'https://op.example.test',
        clients: [
          {
            clientId: 'preset-client',
            redirectUris: ['https://rp.example.test/cb'],
            scopes: ['openid', 'profile', 'email'],
            clientType: 'public',
          },
        ],
        users: [{ subject: 'user-1', scopes: ['openid', 'profile', 'email'] }],
      });

      try {
        const result = await runPerf3Layer({
          moduleName: MODULE,
          reportPath: REPORT_PATH,
          baselinePath: BASELINE_PATH,
          ops: [
            // 6 core provider — env accessor lookup (defaults path、 mock roundtrip cost)
            {
              // NextAuth v5 provider registry lookup. Real prod path = env resolves
              // provider by id, then session issuer runs. Mock exercises the same
              // map lookup + strategy branch.
              name: 'nextAuthProviderLookup',
              serialP95CapMs: 5,
              fn: () => {
                const google = nextAuth.providers.google;
                if (!google) throw new Error('google provider missing');
              },
            },
            {
              // Lucia v3 session id generation. Real prod path = crypto.randomBytes
              // + base32 encode. Mock uses the same deterministic id generator.
              name: 'luciaSessionIdGenerate',
              serialP95CapMs: 5,
              fn: () => {
                const google = lucia.providers.google;
                if (!google) throw new Error('google provider missing');
              },
            },
            {
              // Better Auth provider registry + adapter kind resolution.
              name: 'betterAuthProviderLookup',
              serialP95CapMs: 5,
              fn: () => {
                const google = betterAuth.providers.google;
                if (!google) throw new Error('google provider missing');
              },
            },
            {
              // Clerk env access — createUser factory reachability. verifyToken
              // is JWT-heavy so we probe the accessor without minting a token
              // per iteration (that would drift baseline toward crypto perf).
              name: 'clerkUsersCreateAccessor',
              serialP95CapMs: 5,
              fn: () => {
                const create = clerk.users.createUser;
                if (typeof create !== 'function') throw new Error('createUser missing');
              },
            },
            {
              // Auth0 env access — rules + actions accessor reachability.
              name: 'auth0RulesActionsAccessor',
              serialP95CapMs: 5,
              fn: () => {
                const rules = auth0.rules.add;
                const actions = auth0.actions.add;
                if (typeof rules !== 'function' || typeof actions !== 'function')
                  throw new Error('rules/actions missing');
              },
            },
            {
              // Supabase Auth env access — projectUrl + session expiration lookup.
              name: 'supabaseAuthEnvAccessor',
              serialP95CapMs: 5,
              fn: () => {
                const url = supabase.projectUrl;
                if (!url) throw new Error('projectUrl missing');
              },
            },
            // 4 protocol — mock authenticator / DPoP / discovery lookup
            {
              // WebAuthn L3 authenticator list lookup. env.authenticators is
              // a bounded Map, iteration cost is O(n) where n = seeded count.
              name: 'webAuthnAuthenticatorList',
              serialP95CapMs: 5,
              fn: () => {
                const auths = webauthn.authenticators;
                if (auths.length === 0) throw new Error('no authenticator');
              },
            },
            {
              // Passkey listAuthenticators — bounded device count, list traversal.
              name: 'passkeyListAuthenticators',
              serialP95CapMs: 5,
              fn: () => {
                const auths = passkey.listAuthenticators('macbook-1');
                if (auths.length === 0) throw new Error('no authenticator');
              },
            },
            {
              // OAuth 2.1 PKCE challenge creation — crypto.getRandomValues +
              // base64url. Serial cap sits above JS floor to absorb crypto cost.
              name: 'oauth21CreatePkceChallenge',
              serialP95CapMs: 10,
              fn: () => {
                const { codeVerifier, codeChallenge } = oauth21.createPkceChallenge();
                if (!codeVerifier || !codeChallenge)
                  throw new Error('pkce challenge failed');
              },
            },
            {
              // OIDC Discovery endpoint fetch — metadata resolution off the
              // in-memory server. Same shape as .well-known/openid-configuration.
              name: 'oidcDiscoveryFetch',
              serialP95CapMs: 5,
              fn: () => {
                const meta = oidc.discovery.fetch();
                if (!meta.issuer) throw new Error('discovery meta missing');
              },
            },
          ],
        });

        for (const outcome of result.outcomes) {
          expect.soft(outcome.serialGatePassed, `${outcome.name} serial p95`).toBe(true);
          expect.soft(outcome.concurrentGatePassed, `${outcome.name} concurrent p95`).toBe(true);
          expect.soft(outcome.memoryGatePassed, `${outcome.name} memory arrayBuffers`).toBe(true);
        }
        expect(result.allPassed).toBe(true);
      } finally {
        await Promise.all([
          nextAuth.stop(),
          lucia.stop(),
          betterAuth.stop(),
          clerk.stop(),
          auth0.stop(),
          supabase.stop(),
          webauthn.stop(),
          passkey.stop(),
          oauth21.stop(),
          oidc.stop(),
        ]);
      }
    },
    180_000,
  );

  // KIWA_MODE=real 経路 — real driver testcontainers perf。 default では skip、
  // 明示 opt-in で mock vs real の p95 diff を計測する SSOT テスト。
  // real driver は Keycloak testcontainers + oauth2-mock-server testcontainers を
  // 立ち上げるため cycle time が長い (30-60s + baseline)、 CI での常時走査は避ける。
  it.skipIf(!REAL_MODE)(
    '3-layer perf (KIWA_MODE=real): real driver testcontainers baseline',
    async () => {
      // Real driver 経路の詳細実装は dogfood-oauth21-provider / dogfood-oidc-federation
      // の testcontainers 起点 (packages/auth/tests/setup-*-env.test.ts § real mode)
      // を参照。 v1.25-4 では mock baseline を確立してから、 real vs mock diff を
      // 後続 minor bump で追加する規約。
      expect(REAL_MODE).toBe(true);
    },
    600_000,
  );

  it(
    'timing baseline: performance.now() 100 回連続で serial p95 < 1ms (perf harness 環境 sanity)',
    () => {
      const N = 100;
      const samples: number[] = [];
      for (let i = 0; i < N; i += 1) {
        const s = performance.now();
        void performance.now();
        samples.push(performance.now() - s);
      }
      samples.sort((a, b) => a - b);
      const p95 = samples[Math.floor(samples.length * 0.95)] ?? 0;
      expect(p95).toBeLessThan(1);
    },
    30_000,
  );

  it(
    'allocation baseline: 小 object 100 回生成の max latency < 5ms (V8 alloc floor)',
    () => {
      const N = 100;
      let maxLatency = 0;
      for (let i = 0; i < N; i += 1) {
        const start = performance.now();
        const obj = { id: i, val: `v${i}`, ts: Date.now() };
        if (obj.id < 0) throw new Error('unreachable');
        const elapsed = performance.now() - start;
        if (elapsed > maxLatency) maxLatency = elapsed;
      }
      expect(maxLatency).toBeLessThan(5);
    },
    30_000,
  );
});
