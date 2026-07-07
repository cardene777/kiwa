# CSP strict-dynamic — nonce + hash + strict-dynamic + trusted-types in 15 min

## What you'll build

A vitest suite wired to `@kiwa-test/security` v0.1 that models the 5 pieces of a real Content Security Policy pipeline that every non-trivial browser-facing app eventually needs — a nonce-based `script-src` that unblocks the first-party bundle without shipping `'unsafe-inline'`, a `sha256` / `sha384` / `sha512` hash source for the small inline snippets that predate the nonce refactor, a `'strict-dynamic'` policy that lets the nonced loader inject downstream scripts without maintaining a per-CDN allowlist, a `trusted-types` directive that declares the DOM sink policies your app is allowed to write through, and a report-only header variant that ships the same policy behind `Content-Security-Policy-Report-Only` so a real-world rollout can start in observe mode. `buildCspHeader()` + `validateNonce()` + `toCspEvent()` give you every one of those pieces without booting a real helmet middleware. This is the pattern kiwa's `examples/dogfood-security-csp-headers-app` exercises against real Next.js middleware under `KIWA_MODE=real`; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "the `'strict-dynamic'` directive silently disabled the whole policy because no nonce was in `script-src`" gap a reviewer sees in the CSP rollout post-mortem.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-csp && cd kiwa-csp
pnpm init
pnpm add -D @kiwa-test/security@^0.1 vitest typescript @types/node
```

Add the vitest scripts in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

The v0.1 surface exports the CSP axis (`buildCspHeader` / `validateNonce` / `toCspEvent`) directly from the package root. This tutorial focuses on the CSP axis end-to-end; tutorials 77-78 cover the other axes (authorization RBAC + ABAC, SBOM + license scanning).

### 2. `buildCspHeader` — the minimal policy

`tests/csp/build.test.ts` — a CSP policy pins a `directives` map from directive name (`default-src`, `script-src`, `style-src`, ...) to a list of source expressions. `buildCspHeader()` returns the header name (`Content-Security-Policy` by default) plus the serialized header value plus a debug `expandedDirectives` map so you can assert on individual directives without parsing the string.

```ts
import { describe, expect, it } from 'vitest';
import { buildCspHeader } from '@kiwa-test/security';

describe('csp — minimal policy', () => {
  it('emits Content-Security-Policy header by default', () => {
    const out = buildCspHeader({
      directives: { 'default-src': ["'self'"] },
    });
    expect(out.headerName).toBe('Content-Security-Policy');
    expect(out.headerValue).toContain("default-src 'self'");
  });

  it('emits none for an empty source list — the invariant guards against a fallback to default-src *', () => {
    const out = buildCspHeader({
      directives: { 'object-src': [] },
    });
    expect(out.expandedDirectives['object-src']).toEqual(["'none'"]);
    expect(out.headerValue).toContain("object-src 'none'");
  });

  it('dedupes duplicate sources inside the same directive', () => {
    const out = buildCspHeader({
      directives: { 'script-src': ["'self'", "'self'", 'https://cdn.example.com'] },
    });
    const scriptSrc = out.expandedDirectives['script-src'] ?? [];
    expect(scriptSrc.filter((s) => s === "'self'")).toHaveLength(1);
    expect(scriptSrc).toContain('https://cdn.example.com');
  });
});
```

The `expandedDirectives` map is the debug surface — the header string is what browsers see, the map is what your tests read.

### 3. `validateNonce` + nonce attachment — the CSP Level 3 baseline

`tests/csp/nonce.test.ts` — a nonce is a per-request random string that appears inside `script-src` as `'nonce-<base64url>'`. The nonce must be at least 128 bits (22+ base64url characters) — anything shorter is guessable, and the browser will still accept it, so the guard has to run in your code. `validateNonce()` checks both the length and the base64url alphabet.

```ts
import { describe, expect, it } from 'vitest';
import { buildCspHeader, validateNonce } from '@kiwa-test/security';

describe('csp — nonce', () => {
  it('accepts a 22-char base64url nonce (16 bytes of entropy)', () => {
    const check = validateNonce('AAAAAAAAAAAAAAAAAAAAAA');
    expect(check.ok).toBe(true);
  });

  it('rejects a short nonce — no silent fallback to a guessable value', () => {
    const check = validateNonce('short');
    expect(check.ok).toBe(false);
    expect(check.reason).toMatch(/too short/);
  });

  it('rejects a non-base64url nonce — protects against control-char smuggling', () => {
    const check = validateNonce('AAAA/AAAA+AAAAAAAAAAA=');
    expect(check.ok).toBe(false);
    expect(check.reason).toMatch(/base64url/);
  });

  it('attaches nonce to script-src by default', () => {
    const out = buildCspHeader({
      directives: { 'script-src': ["'self'"] },
      nonces: [{ nonce: 'AAAAAAAAAAAAAAAAAAAAAA' }],
    });
    expect(out.headerValue).toMatch(
      /script-src [^;]*'nonce-AAAAAAAAAAAAAAAAAAAAAA'/,
    );
  });

  it('attaches nonce to explicit directives when specified', () => {
    const out = buildCspHeader({
      directives: { 'script-src': ["'self'"], 'style-src': ["'self'"] },
      nonces: [
        { nonce: 'BBBBBBBBBBBBBBBBBBBBBB', directives: ['style-src'] },
      ],
    });
    expect(out.headerValue).toMatch(
      /style-src [^;]*'nonce-BBBBBBBBBBBBBBBBBBBBBB'/,
    );
    expect(out.headerValue).not.toMatch(/script-src [^;]*'nonce-BBB/);
  });
});
```

The middleware side generates a fresh nonce per request (`crypto.randomBytes(16).toString('base64url')`) and threads it into both the header and the `<script nonce="...">` tag on the response — the shared nonce is the browser's proof that the script came from your app.

### 4. `hash` sources — the `unsafe-inline` escape hatch

`tests/csp/hash.test.ts` — some inline scripts and styles legitimately predate the nonce refactor (analytics snippets, third-party embeds). `buildCspHeader()` accepts `hashes: [{ algorithm: 'sha256' | 'sha384' | 'sha512', digest: '<base64>' }]` and emits `'sha256-<digest>'` inside `script-src` (or explicit directives). The digest is computed once by the build step; anything that changes the inline script body invalidates the hash and the browser blocks it.

```ts
import { describe, expect, it } from 'vitest';
import { buildCspHeader } from '@kiwa-test/security';

describe('csp — hash sources', () => {
  it('emits sha256 hash source in script-src by default', () => {
    const out = buildCspHeader({
      directives: { 'script-src': ["'self'"] },
      hashes: [{ algorithm: 'sha256', digest: 'YWJjZA==' }],
    });
    expect(out.headerValue).toMatch(/script-src [^;]*'sha256-YWJjZA=='/);
  });

  it('supports sha384 and sha512 alongside sha256', () => {
    const out = buildCspHeader({
      directives: { 'script-src': ["'self'"] },
      hashes: [
        { algorithm: 'sha384', digest: 'AAA=' },
        { algorithm: 'sha512', digest: 'BBB=' },
      ],
    });
    expect(out.headerValue).toContain("'sha384-AAA='");
    expect(out.headerValue).toContain("'sha512-BBB='");
  });

  it('routes hashes to explicit directives when specified', () => {
    const out = buildCspHeader({
      directives: {
        'script-src': ["'self'"],
        'style-src': ["'self'"],
      },
      hashes: [
        { algorithm: 'sha256', digest: 'STYLE', directives: ['style-src'] },
      ],
    });
    expect(out.headerValue).toMatch(/style-src [^;]*'sha256-STYLE'/);
    expect(out.headerValue).not.toMatch(/script-src [^;]*'sha256-STYLE'/);
  });
});
```

### 5. `strict-dynamic` — the CDN allowlist killer

`tests/csp/strict-dynamic.test.ts` — `'strict-dynamic'` tells the browser "any script loaded by a nonced or hashed script is trusted, even if it comes from a URL not in the allowlist". This is how modern CSP survives loaders like webpack chunk splitting or Google Tag Manager — the entry point is nonced, everything downstream inherits trust. The catch is that `'strict-dynamic'` needs at least one nonce or hash inside `script-src`; without it, the entire policy silently degrades to "no source is allowed". `buildCspHeader()` enforces the invariant at build time — a `strictDynamic: true` without nonces or hashes throws.

```ts
import { describe, expect, it } from 'vitest';
import { buildCspHeader } from '@kiwa-test/security';

describe('csp — strict-dynamic', () => {
  it('emits strict-dynamic + nonce in script-src', () => {
    const out = buildCspHeader({
      directives: { 'script-src': ["'self'"] },
      nonces: [{ nonce: 'AAAAAAAAAAAAAAAAAAAAAA' }],
      strictDynamic: true,
    });
    expect(out.headerValue).toContain("'strict-dynamic'");
    expect(out.headerValue).toMatch(
      /script-src [^;]*'nonce-AAAAAAAAAAAAAAAAAAAAAA'/,
    );
  });

  it('throws when strict-dynamic is set without any nonce or hash (guards the silent-drop failure mode)', () => {
    expect(() =>
      buildCspHeader({
        directives: { 'script-src': ["'self'"] },
        strictDynamic: true,
      }),
    ).toThrow(/strict-dynamic requires at least one nonce or hash/);
  });

  it('accepts strict-dynamic when only a hash is present', () => {
    const out = buildCspHeader({
      directives: { 'script-src': ["'self'"] },
      hashes: [{ algorithm: 'sha256', digest: 'BASE64' }],
      strictDynamic: true,
    });
    expect(out.headerValue).toContain("'strict-dynamic'");
    expect(out.headerValue).toContain("'sha256-BASE64'");
  });
});
```

The `strictDynamic requires at least one nonce or hash` throw is the exact same failure mode the CSP spec calls out — without a nonce or hash source, `'strict-dynamic'` invalidates the whole `script-src` list, which the browser reads as "allow nothing" for scripts. Catching it at build time means the operator sees a Node stack trace instead of a silently broken site.

### 6. `trusted-types` — the DOM XSS baseline

`tests/csp/trusted-types.test.ts` — Trusted Types is a browser-level guard that requires DOM sinks (`innerHTML`, `document.write`, `eval`, ...) to receive an object minted by a named policy, never a raw string. `buildCspHeader()` accepts a `trustedTypes: { policies: string[], requireForScript?: boolean }` shape that emits both the `trusted-types` directive (with the allowed policy names) and the `require-trusted-types-for 'script'` directive (with the enforcement toggle). An empty policy list emits `trusted-types 'none'`, which is the "block all DOM sinks that need trusted types" configuration.

```ts
import { describe, expect, it } from 'vitest';
import { buildCspHeader } from '@kiwa-test/security';

describe('csp — trusted-types', () => {
  it('emits trusted-types directive with named policies', () => {
    const out = buildCspHeader({
      directives: { 'default-src': ["'self'"] },
      trustedTypes: { policies: ['default', 'my-policy'], requireForScript: true },
    });
    expect(out.headerValue).toContain('trusted-types default my-policy');
    expect(out.headerValue).toContain("require-trusted-types-for 'script'");
  });

  it("emits trusted-types 'none' when the policy list is empty", () => {
    const out = buildCspHeader({
      directives: { 'default-src': ["'self'"] },
      trustedTypes: { policies: [], requireForScript: false },
    });
    expect(out.expandedDirectives['trusted-types']).toEqual(["'none'"]);
    expect(out.headerValue).not.toContain('require-trusted-types-for');
  });
});
```

Rolling this out safely means declaring the DOM-sink allowlist explicitly, then requiring trusted-types for `'script'` so unbounded string writes fail loudly during development instead of shipping as XSS in production.

### 7. `Content-Security-Policy-Report-Only` — the observability header

`tests/csp/report-only.test.ts` — `reportOnly: true` flips the header name to `Content-Security-Policy-Report-Only`, which is exactly the same policy body but the browser reports violations to `report-uri` / `report-to` instead of blocking them. This is how you roll out a stricter policy to production without breaking the first day — turn it on in report-only mode, collect the violation stream for a week, fix the offenders, then flip to enforce mode.

```ts
import { describe, expect, it } from 'vitest';
import { buildCspHeader } from '@kiwa-test/security';

describe('csp — report-only', () => {
  it('flips the header name when reportOnly is true', () => {
    const out = buildCspHeader({
      directives: { 'default-src': ["'self'"] },
      reportOnly: true,
    });
    expect(out.headerName).toBe('Content-Security-Policy-Report-Only');
  });

  it('emits report-to and report-uri when reportGroup is set (fallback pattern)', () => {
    const out = buildCspHeader({
      directives: { 'default-src': ["'self'"] },
      reportGroup: 'csp-endpoint',
    });
    expect(out.headerValue).toContain('report-to csp-endpoint');
    expect(out.headerValue).toContain('report-uri /csp-endpoint');
  });
});
```

The `report-to` directive is the modern shape (paired with a `Report-To` response header that names the endpoint); the `report-uri` fallback still works on older browsers that predate the Reporting API.

### 8. `toCspEvent` — the fidelity harness adapter

`tests/csp/adapter.test.ts` — `toCspEvent()` normalizes a CSP violation report (either the real Report-To payload from a browser or a synthetic one from a unit test) into the same `SecurityEvent` shape the fidelity harness reads. The `axis` is fixed at `'csp'`, the `provider` picks either `'helmet'` (Node middleware) or `'coraza'` (WAF frontend), and the `verdict` describes what happened — `allow` / `deny` / `warn`.

```ts
import { describe, expect, it } from 'vitest';
import { toCspEvent } from '@kiwa-test/security';

describe('csp — fidelity adapter', () => {
  it('normalizes a helmet-side deny into the neutral SecurityEvent shape', () => {
    const event = toCspEvent({
      provider: 'helmet',
      verdict: 'deny',
      reason: 'inline script blocked (no nonce)',
      payload: { directive: 'script-src', blocked: 'inline' },
      timestamp: 100,
    });
    expect(event.axis).toBe('csp');
    expect(event.provider).toBe('helmet');
    expect(event.verdict).toBe('deny');
    expect(event.timestamp).toBe(100);
  });
});
```

The harness reads `axis + provider + verdict + reason + payload + timestamp` per event — the two providers (`helmet` middleware, `coraza` WAF) emit events with the same shape, so the fidelity check compares the sequence rather than the wire encoding.

## Run the test suite

```bash
pnpm test
```

Vitest reports every describe block above. The v0.1 CSP axis surface — `buildCspHeader` (5 sub-axes) + `validateNonce` + `toCspEvent` — has 40+ tests in `packages/security/tests/csp.test.ts` + `csp-integration.test.ts`; this tutorial covers the everyday builder + validator + adapter path that lands in a real Next.js middleware.

## What's next

- Tutorial 77 covers authorization (RBAC roles + role hierarchy + ABAC combining algorithms + combined RBAC + ABAC policy).
- Tutorial 78 covers SBOM tooling (CycloneDX + SPDX + advisory feed + license policy + secrets scanning).
- The `security-real-driver-testing.md` concept doc is the SSOT for the 8-axis / 4-provider / 32-cell grid, the `KIWA_MODE=real` env-gate contract, and the per-provider required-env mapping (`KIWA_REDIS_URL` / `KIWA_CASBIN_POLICY_PATH` / `KIWA_CORAZA_RULES_PATH`).
