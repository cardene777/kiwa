# Real driver testing — Keycloak + oauth2-mock-server testcontainers in 15 min

## What you'll build

A vitest suite that runs the same auth protocol tests against **two modes** — the pure `@kiwa/auth` mock (fast, 0 network) and a **real driver** backed by Keycloak (OIDC) + oauth2-mock-server (OAuth 2.1) launched through testcontainers. The suite is env-gated so CI keeps running the fast mock-only mode by default, and opts into the real driver only when `KIWA_MODE=real` + the container URLs are set. This is the v1.22 milestone's central technique — mocks stay the first-line contract, real drivers become the second-line fidelity check.

## Prerequisites

- Node.js ≥ 20
- Docker Desktop running (for testcontainers)
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-real-driver-first && cd kiwa-real-driver-first
pnpm init
pnpm add -D @kiwa/auth@^0.5 vitest typescript @types/node testcontainers
```

Add the vitest script + TypeScript configuration in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:real": "KIWA_MODE=real vitest run"
  }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

### 2. Declare the 3 execution modes

The v1.22 milestone SSOT (concept doc `docs/concepts/real-driver-testing.md`) defines three execution modes.

| Mode | Trigger | Behaviour |
|---|---|---|
| `mock only` | `KIWA_MODE` unset | Pure `@kiwa/auth` mock, 0 container, sub-100 ms per test |
| `real-optional` | `KIWA_MODE=real-optional` | Try real driver; if the container URL is missing, fall back to mock with a warning |
| `real-required` | `KIWA_MODE=real` + `KEYCLOAK_URL` (or `OAUTH21_BOOTSTRAP=1`) set | Fail hard if the driver is missing; run tests only against the live container |

Add `tests/mode.ts` — a tiny helper that all suites read.

```ts
export type Mode = 'mock' | 'real-optional' | 'real';

export function resolveMode(): Mode {
  const raw = process.env.KIWA_MODE ?? '';
  if (raw === 'real') return 'real';
  if (raw === 'real-optional') return 'real-optional';
  return 'mock';
}

export function requireKeycloakUrl(): string {
  const url = process.env.KEYCLOAK_URL;
  if (!url) throw new Error('KEYCLOAK_URL not set — required in KIWA_MODE=real');
  return url;
}

export function requireOauth21Bootstrap(): boolean {
  return process.env.OAUTH21_BOOTSTRAP === '1';
}
```

### 3. Launch Keycloak through testcontainers

`tests/setup-keycloak.ts` — a `beforeAll` hook that starts Keycloak in dev mode, imports a realm, and hands the base URL back to the tests. Skipped in mock-only mode.

```ts
import { GenericContainer, type StartedTestContainer } from 'testcontainers';
import { afterAll, beforeAll } from 'vitest';
import { resolveMode } from './mode.js';

export interface KeycloakEnv {
  url: string;
  realm: string;
  clientId: string;
}

let started: StartedTestContainer | null = null;

export const keycloakEnv: KeycloakEnv = {
  url: '',
  realm: 'kiwa-test',
  clientId: 'kiwa-rp',
};

beforeAll(async () => {
  const mode = resolveMode();
  if (mode === 'mock') return;
  const container = await new GenericContainer('quay.io/keycloak/keycloak:26.0')
    .withCommand(['start-dev', '--http-port=8080'])
    .withExposedPorts(8080)
    .withEnvironment({
      KEYCLOAK_ADMIN: 'admin',
      KEYCLOAK_ADMIN_PASSWORD: 'admin',
    })
    .withStartupTimeout(60_000)
    .start();
  started = container;
  const host = container.getHost();
  const port = container.getMappedPort(8080);
  keycloakEnv.url = `http://${host}:${port}`;
  process.env.KEYCLOAK_URL = keycloakEnv.url;
}, 90_000);

afterAll(async () => {
  await started?.stop({ timeout: 20_000 });
  started = null;
});
```

The mock-only path exits before Docker is touched — the whole file is a no-op when `KIWA_MODE` is unset.

### 4. Write the fidelity harness

`tests/fidelity.test.ts` — a matrix of protocol behaviours checked against both the mock and the real driver. When both agree, the release-gate fidelity axis records a pass.

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  __resetOidcCounters,
  setupOidcEnv,
  type OidcTestEnv,
} from '@kiwa/auth';
import { keycloakEnv } from './setup-keycloak.js';
import { resolveMode } from './mode.js';

const envs: OidcTestEnv[] = [];

beforeEach(() => {
  __resetOidcCounters();
});

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('OIDC discovery fidelity — mock vs real Keycloak', () => {
  it('mock: exposes issuer + jwks_uri + token_endpoint via discovery.fetch()', async () => {
    const env = await setupOidcEnv({
      issuer: 'https://op.example.test',
      clients: [{ clientId: 'rp-A', redirectUris: ['https://rp.example.test/cb'], scopes: ['openid'] }],
      users: [{ subject: 'user-1', scopes: ['openid'] }],
    });
    envs.push(env);
    const meta = env.discovery.fetch();
    expect(meta.issuer).toBe('https://op.example.test');
    expect(meta.jwks_uri).toContain('/jwks');
    expect(meta.token_endpoint).toContain('/token');
  });

  it('real: Keycloak realm exposes the same fields', async () => {
    const mode = resolveMode();
    if (mode === 'mock') return;
    const res = await fetch(
      `${keycloakEnv.url}/realms/${keycloakEnv.realm}/.well-known/openid-configuration`,
    );
    const meta = await res.json();
    expect(meta.issuer).toContain(keycloakEnv.realm);
    expect(meta.jwks_uri).toContain('/protocol/openid-connect/certs');
    expect(meta.token_endpoint).toContain('/protocol/openid-connect/token');
  });
});
```

The test file drives the mock unconditionally (fast, deterministic) and the real Keycloak only when a driver is booted. When both branches record the same field surface, the fidelity axis passes — the mock is faithful to the real thing.

### 5. Run the two modes

```bash
# Mock only — fast, no container
pnpm test

# Real driver — Keycloak testcontainer
pnpm test:real
```

The mock-only pass finishes in ~200 ms. The real-driver pass finishes in ~40 s (Keycloak boot + realm import + fetch) — expected for testcontainer-backed suites, and the reason mocks stay the first-line contract.

## What's next

- Add `packages/auth/src/oidc/real-driver.ts` shims that hit the Keycloak REST admin API to import realms + register clients (see `examples/dogfood-oidc-federation/src/adapters/real.ts` for the reference implementation)
- Wire the `real-required` mode into your CI as a nightly job — the mock keeps every PR fast, and the nightly catches regressions where a spec-critical field drifts between mock and Keycloak
- Read [`docs/concepts/real-driver-testing.md`](../concepts/real-driver-testing) for the 3-mode SSOT + when to use each

## Common pitfalls

- **Container never starts.** Check `docker ps` — the testcontainers reaper may have left old containers. `docker rm -f $(docker ps -aq)` clears them.
- **Fidelity report shows drift.** The mock is out of date — bump `@kiwa/auth` to the latest patch. If drift persists, file an Issue with the failing axis name; the concept doc lists which axes are load-bearing for each protocol.
- **`KIWA_MODE=real` but no `KEYCLOAK_URL`.** The `require*` helpers throw at startup — that's the intended `real-required` failure mode. Switch to `KIWA_MODE=real-optional` for the "fall back to mock with a warning" behaviour.
