# SBOM + license scanning + secrets — CycloneDX + SPDX + OSV advisory lookup + Gitleaks style scan in 15 min

## What you'll build

A vitest suite wired to `@kiwa/security` v0.1 that models the 6 pieces of a real supply-chain security pipeline that every non-trivial deployable eventually needs — a CycloneDX 1.5 SBOM builder that emits the industry-standard component list, a SPDX 2.3 SBOM builder that emits the Linux Foundation format side by side, a SBOM validator that catches missing `name` / `version` / malformed `purl` before they hit downstream tooling, an advisory feed lookup that joins your components against an in-memory OSV / NVD feed and returns the affected rows, a license policy evaluator that maps SPDX license identifiers to allow / warn / deny verdicts, and a secrets scanner with TruffleHog-style pattern rules plus Gitleaks-style entropy validation for the base64 / hex secrets that regex alone would false-positive on. `toCycloneDx()` + `toSpdx()` + `validateSbom()` + `lookupAdvisories()` + `evaluateLicense()` + `scanSecrets()` + `isRotationOverdue()` give you every one of those pieces without booting Trivy or Gitleaks. This is the pattern kiwa's `examples/dogfood-security-sbom-scanning-app` exercises against real Trivy + Gitleaks + OSV-Scanner under `KIWA_MODE=real`; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "the SBOM said 0 vulnerable components but the OSV feed had a critical for `left-pad@1.3.0` because the version-range parser only handled exact matches" gap a reviewer sees in the supply-chain post-mortem.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-sbom && cd kiwa-sbom
pnpm init
pnpm add -D @kiwa/security@^0.1 vitest typescript @types/node
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

The v0.1 surface exports the SBOM axis (`toCycloneDx` / `toSpdx` / `validateSbom` / `lookupAdvisories` / `versionInRange` / `evaluateLicense` / `DEFAULT_LICENSE_POLICY` / `toSbomEvent`) and the secrets-scan axis (`scanSecrets` / `DEFAULT_SIGNATURES` / `shannonEntropy` / `isRotationOverdue` / `markRotated` / `toSecretsEvent`) directly from the package root. This tutorial focuses on those 2 axes end-to-end; tutorials 76-77 cover CSP and authorization.

### 2. `toCycloneDx` + `toSpdx` — dual-format SBOM emit

`tests/sbom/format.test.ts` — a SBOM is a component list plus metadata. `toCycloneDx()` emits the CycloneDX 1.5 shape (`bomFormat = 'CycloneDX'`, `specVersion = '1.5'`); `toSpdx()` emits the SPDX 2.3 shape (`spdxVersion = 'SPDX-2.3'`). Both take the same `SbomComponent[]` input so a single ingest step feeds both formats — the SBOM consumers (CI dashboards, license scanners, supplier-side ingest) pick the one they understand.

```ts
import { describe, expect, it } from 'vitest';
import type { SbomComponent } from '@kiwa/security';
import { toCycloneDx, toSpdx } from '@kiwa/security';

const components: SbomComponent[] = [
  { name: 'react', version: '18.2.0', purl: 'pkg:npm/react@18.2.0', license: 'MIT' },
  { name: 'left-pad', version: '1.3.0', purl: 'pkg:npm/left-pad@1.3.0', license: 'MIT' },
];

describe('sbom — dual format', () => {
  it('emits CycloneDX 1.5 with the components list intact', () => {
    const doc = toCycloneDx(components, '2026-07-07T00:00:00.000Z');
    expect(doc.format).toBe('cyclonedx');
    expect(doc.formatVersion).toBe('1.5');
    expect(doc.components).toHaveLength(2);
    expect(doc.generatedAtIso).toBe('2026-07-07T00:00:00.000Z');
  });

  it('emits SPDX 2.3 with the components list intact', () => {
    const doc = toSpdx(components, '2026-07-07T00:00:00.000Z');
    expect(doc.format).toBe('spdx');
    expect(doc.formatVersion).toBe('2.3');
    expect(doc.components).toHaveLength(2);
  });
});
```

### 3. `validateSbom` — the syntactic gate

`tests/sbom/validate.test.ts` — a SBOM produced by a wrong ingest step (missing `name`, missing `version`, malformed `purl`) is worse than no SBOM — downstream scanners assume the components are complete. `validateSbom()` returns `{ ok, errors }` so the operator can fail-fast before shipping the SBOM to the release gate.

```ts
import { describe, expect, it } from 'vitest';
import { toCycloneDx, validateSbom } from '@kiwa/security';

describe('sbom — validate', () => {
  it('accepts a well-formed SBOM', () => {
    const doc = toCycloneDx([
      { name: 'react', version: '18.2.0', purl: 'pkg:npm/react@18.2.0' },
    ]);
    const result = validateSbom(doc);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects a component missing name', () => {
    const doc = toCycloneDx([
      { name: '', version: '1.0.0', purl: 'pkg:npm/foo@1.0.0' },
    ]);
    const result = validateSbom(doc);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('name'))).toBe(true);
  });

  it('rejects a malformed purl (missing pkg: prefix)', () => {
    const doc = toCycloneDx([
      { name: 'react', version: '18.2.0', purl: 'npm/react@18.2.0' },
    ]);
    const result = validateSbom(doc);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('purl'))).toBe(true);
  });
});
```

### 4. `versionInRange` + `lookupAdvisories` — the OSV / NVD join

`tests/sbom/advisory.test.ts` — an advisory feed is a list of `{ id, affects: [{ purl, versionRange }], severity, summary, source }` records. `lookupAdvisories()` walks the SBOM components, strips the `@version` suffix from each `purl`, matches against the advisory `affects` entries, and returns only the rows where the component version falls inside the advisory `versionRange`. The `versionInRange()` helper handles `>= a.b.c`, `< a.b.c`, and OR-clause ranges (`< a.b.c || >= x.y.z`).

```ts
import { describe, expect, it } from 'vitest';
import type { AdvisoryFeed } from '@kiwa/security';
import { lookupAdvisories, toCycloneDx, versionInRange } from '@kiwa/security';

describe('sbom — versionInRange', () => {
  it('matches an exact version', () => {
    expect(versionInRange('1.2.3', '= 1.2.3')).toBe(true);
    expect(versionInRange('1.2.4', '= 1.2.3')).toBe(false);
  });

  it('matches a >= range', () => {
    expect(versionInRange('1.5.0', '>= 1.2.3')).toBe(true);
    expect(versionInRange('1.2.2', '>= 1.2.3')).toBe(false);
  });

  it('supports OR-clause ranges', () => {
    expect(versionInRange('0.9.0', '< 1.0.0 || >= 2.0.0')).toBe(true);
    expect(versionInRange('2.5.0', '< 1.0.0 || >= 2.0.0')).toBe(true);
    expect(versionInRange('1.5.0', '< 1.0.0 || >= 2.0.0')).toBe(false);
  });
});

describe('sbom — lookupAdvisories', () => {
  const feed: AdvisoryFeed = {
    advisories: [
      {
        id: 'GHSA-XXXX',
        affects: [{ purl: 'pkg:npm/left-pad', versionRange: '< 2.0.0' }],
        severity: 'high',
        summary: 'left-pad prototype pollution',
        source: 'osv',
      },
    ],
  };

  it('returns matched advisories for vulnerable components', () => {
    const doc = toCycloneDx([
      { name: 'left-pad', version: '1.3.0', purl: 'pkg:npm/left-pad@1.3.0' },
      { name: 'react', version: '18.2.0', purl: 'pkg:npm/react@18.2.0' },
    ]);
    const results = lookupAdvisories(doc, feed);
    expect(results).toHaveLength(1);
    expect(results[0]?.component.name).toBe('left-pad');
    expect(results[0]?.advisories[0]?.id).toBe('GHSA-XXXX');
  });

  it('returns no advisories when no component matches', () => {
    const doc = toCycloneDx([
      { name: 'react', version: '18.2.0', purl: 'pkg:npm/react@18.2.0' },
    ]);
    const results = lookupAdvisories(doc, feed);
    expect(results).toHaveLength(0);
  });
});
```

The `< 2.0.0` range on `left-pad@1.3.0` is exactly the class of gap the introduction points at — a range parser that only handled exact matches would miss the join and report zero vulnerable components while OSV reported one.

### 5. `evaluateLicense` — SPDX license policy

`tests/sbom/license.test.ts` — a license policy maps SPDX license identifiers to `allow` / `warn` / `deny` verdicts. `DEFAULT_LICENSE_POLICY` covers the everyday permissive set (`MIT`, `Apache-2.0`, `BSD-*`, `ISC`, `Unlicense`) as `allow`, the weak copyleft set (`MPL-2.0`, `LGPL-*`) as `warn`, and the strong copyleft set (`GPL-*`, `AGPL-3.0`, `SSPL-1.0`) as `deny`. `evaluateLicense()` also handles SPDX `OR`-clause expressions by returning the most permissive of the alternatives — a `MIT OR GPL-3.0` component evaluates as `allow`.

```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_LICENSE_POLICY, evaluateLicense } from '@kiwa/security';

describe('sbom — evaluateLicense (default policy)', () => {
  it('allows MIT and Apache-2.0', () => {
    expect(evaluateLicense('MIT')).toBe('allow');
    expect(evaluateLicense('Apache-2.0')).toBe('allow');
  });

  it('warns on MPL-2.0 and LGPL-3.0', () => {
    expect(evaluateLicense('MPL-2.0')).toBe('warn');
    expect(evaluateLicense('LGPL-3.0')).toBe('warn');
  });

  it('denies GPL-3.0 and AGPL-3.0', () => {
    expect(evaluateLicense('GPL-3.0')).toBe('deny');
    expect(evaluateLicense('AGPL-3.0')).toBe('deny');
  });

  it('picks the most permissive alternative in an OR expression', () => {
    expect(evaluateLicense('MIT OR GPL-3.0')).toBe('allow');
    expect(evaluateLicense('MPL-2.0 OR GPL-3.0')).toBe('warn');
  });

  it('warns on an undefined license (unknown SPDX id)', () => {
    expect(evaluateLicense(undefined)).toBe('warn');
    expect(evaluateLicense('Custom-Unknown-1.0')).toBe('warn');
  });

  it('honors a custom policy override', () => {
    const custom = {
      allow: [...DEFAULT_LICENSE_POLICY.allow, 'MPL-2.0'],
      warn: DEFAULT_LICENSE_POLICY.warn.filter((l) => l !== 'MPL-2.0'),
      deny: DEFAULT_LICENSE_POLICY.deny,
    };
    expect(evaluateLicense('MPL-2.0', custom)).toBe('allow');
  });
});
```

### 6. `scanSecrets` — TruffleHog signature + Gitleaks entropy gate

`tests/sbom/secrets.test.ts` — the secrets scanner walks each line of the input source, applies each signature regex, and (when a `minEntropy` is set) drops matches whose Shannon entropy falls below the threshold. `DEFAULT_SIGNATURES` covers 8 kinds (AWS access key, AWS secret key, GitHub token, Slack token, OpenAI key, Stripe key, generic JWT, generic PEM private key); the AWS-secret-key regex is broad (`40 chars base64 alphabet`) but the `minEntropy: 3.5` gate cuts the false positives that would otherwise catch every 40-char English sentence.

```ts
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SIGNATURES,
  scanSecrets,
  shannonEntropy,
} from '@kiwa/security';

describe('secrets-scan — signatures', () => {
  it('flags an AWS access key by prefix', () => {
    const findings = scanSecrets(
      'const key = "AKIAIOSFODNN7EXAMPLE";',
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]?.kind).toBe('aws-access-key');
    expect(findings[0]?.line).toBe(1);
  });

  it('flags a GitHub personal access token', () => {
    const findings = scanSecrets(
      'const t = "ghp_EXAMPLEexampleEXAMPLEexampleEXAMPLE1";',
    );
    expect(findings.some((f) => f.kind === 'github-token')).toBe(true);
  });

  it('flags a Stripe secret key (sk_live / sk_test)', () => {
    const findings = scanSecrets(
      'const s = "sk_live_EXAMPLEexampleEXAMPL";',
    );
    expect(findings.some((f) => f.kind === 'stripe-key')).toBe(true);
  });

  it('does not flag a low-entropy string that matches an aws-secret-key regex shape', () => {
    // 40 chars of a repeated pattern — passes regex, fails entropy gate.
    const lowEntropy = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    expect(shannonEntropy(lowEntropy)).toBeLessThan(3.5);
    const findings = scanSecrets(
      `const s = "${lowEntropy}";`,
      DEFAULT_SIGNATURES.filter((s) => s.kind === 'aws-secret-key'),
    );
    expect(findings).toEqual([]);
  });

  it('reports 1-indexed line and column for each finding', () => {
    const src = ['// header', 'const k = "AKIAIOSFODNN7EXAMPLE";'].join('\n');
    const findings = scanSecrets(src);
    expect(findings[0]?.line).toBe(2);
    expect(findings[0]?.column).toBeGreaterThan(1);
  });
});
```

The `shannonEntropy` helper is exported so downstream code can reuse the threshold gate for custom signature sets — the same 3.5 floor separates random secrets from natural-language sentences on base64 / hex alphabets.

### 7. `isRotationOverdue` — the rotation SLA tracker

`tests/sbom/rotation.test.ts` — finding a secret is step one; step two is making sure the operator actually rotated it. `RotationTracker` wraps the finding with `discoveredAtMs`, an optional `rotatedAtMs`, and a `RotationPolicy` that pins `rotateWithinDays`. `isRotationOverdue()` returns `true` when the deadline has passed and no rotation has been recorded yet.

```ts
import { describe, expect, it } from 'vitest';
import type { RotationTracker } from '@kiwa/security';
import { isRotationOverdue, markRotated } from '@kiwa/security';

const dayMs = 24 * 60 * 60 * 1000;
const finding = {
  kind: 'github-token' as const,
  matched: 'ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  line: 10,
  column: 5,
  entropy: 4.2,
  ruleDescription: 'github token',
};
const tracker: RotationTracker = {
  finding,
  discoveredAtMs: 1_000_000,
  rotatedAtMs: null,
  policy: { rotateWithinDays: 7 },
};

describe('secrets-scan — rotation', () => {
  it('returns false while the deadline has not yet passed', () => {
    expect(isRotationOverdue(tracker, 1_000_000 + 6 * dayMs)).toBe(false);
  });

  it('returns true once the deadline has passed', () => {
    expect(isRotationOverdue(tracker, 1_000_000 + 8 * dayMs)).toBe(true);
  });

  it('returns false once markRotated is applied, regardless of the wall clock', () => {
    const rotated = markRotated(tracker, 1_000_000 + 5 * dayMs);
    expect(rotated.rotatedAtMs).toBe(1_000_000 + 5 * dayMs);
    expect(isRotationOverdue(rotated, 1_000_000 + 30 * dayMs)).toBe(false);
  });
});
```

## Run the test suite

```bash
pnpm test
```

The v0.1 SBOM axis surface (`toCycloneDx` / `toSpdx` / `validateSbom` / `lookupAdvisories` / `versionInRange` / `evaluateLicense`) and the secrets-scan axis surface (`scanSecrets` / `shannonEntropy` / `isRotationOverdue` / `markRotated`) together cover the everyday supply-chain path that lands in a real CI gate — SBOM emit + advisory lookup + license gate + secret finding + rotation tracker.

## What's next

- Read the `security-real-driver-testing.md` concept doc for the 8-axis / 4-provider / 32-cell grid SSOT and the `KIWA_MODE=real` env-gate contract that ties this tutorial's mock path to the real Trivy + Gitleaks + OSV-Scanner path in `examples/dogfood-security-sbom-scanning-app`.
- The `v1.36-to-v1.37.md` migration guide summarizes the v1.37-1 security package landing (8 axes) plus the v1.37-2/3/4 dogfood apps that consume this API surface end-to-end.
