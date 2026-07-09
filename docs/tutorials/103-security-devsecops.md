# DevSecOps 6 axis — SAST + SCA + Secret + IaC + DAST + Container in 15 min

## What you'll build

A vitest suite wired to `@kiwa-lab/security-devsecops` v0.1 that models a full DevSecOps audit workflow — 6 axis で SAST (Semgrep-style) + SCA (Trivy-style) + Secret scan (Gitleaks-style) + IaC scan (tfsec-style) + DAST (OWASP ZAP-style) + Container security (Grype-style) を chain 実行する pattern。

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- Empty directory

## Step-by-step build

### 1. Bootstrap

```bash
mkdir kiwa-devsecops && cd kiwa-devsecops
pnpm init
pnpm add -D @kiwa-lab/security-devsecops@^0.1 vitest typescript @types/node
```

### 2. SAST scan

`tests/sast.test.ts` — code scan → finding detection → suppression → complete。

```ts
import { describe, expect, it } from 'vitest';
import {
  completeSastScan,
  detectSastFinding,
  startSastScan,
  suppressSastFinding,
} from '@kiwa-lab/security-devsecops';

describe('SAST scan', () => {
  it('detects finding + suppresses false positive', () => {
    const s = startSastScan({ scanId: 'scan-1', target: 'src/' });
    detectSastFinding(s, {
      ruleId: 'js.crypto.weak-hash',
      filePath: 'src/auth.ts',
      line: 42,
      severity: 'high',
      message: 'MD5 usage',
    });
    suppressSastFinding(s, { ruleId: 'legacy-crypto', reason: 'migration in progress' });
    const report = completeSastScan(s);
    expect(report.metadata.totalFindings).toBe(1);
    expect(report.metadata.suppressedCount).toBe(1);
  });
});
```

### 3. SCA + Secret + IaC scan

`tests/build-time.test.ts` — build-time security 3 axis を統合。

```ts
import { describe, expect, it } from 'vitest';
import {
  completeIacScan,
  completeScaScan,
  completeSecretScan,
  detectIacMisconfig,
  detectScaVuln,
  matchSecretPattern,
  startIacScan,
  startScaScan,
  startSecretScan,
} from '@kiwa-lab/security-devsecops';

describe('build-time security', () => {
  it('SCA detects CVE with fix version', () => {
    const s = startScaScan({ scanId: 's-1', target: 'package.json' });
    detectScaVuln(s, {
      cveId: 'CVE-2024-1234',
      package: 'lodash',
      version: '4.17.20',
      severity: 'critical',
      fixedVersion: '4.17.21',
    });
    const report = completeScaScan(s);
    expect(report.metadata.criticalCount).toBe(1);
  });

  it('Secret scan detects AWS key pattern', () => {
    const s = startSecretScan({ scanId: 's-1', target: '.' });
    matchSecretPattern(s, {
      ruleId: 'aws-access-key',
      filePath: '.env',
      line: 3,
      redactedValue: 'AKIA****',
      severity: 'critical',
    });
    const report = completeSecretScan(s);
    expect(report.metadata.activeCount).toBe(1);
  });

  it('IaC scan detects public S3 bucket', () => {
    const s = startIacScan({ scanId: 's-1', target: 'infra/' });
    detectIacMisconfig(s, {
      ruleId: 'AWS-S3-BUCKET-PUBLIC',
      resourceType: 'aws_s3_bucket',
      resourceName: 'logs',
      filePath: 'main.tf',
      severity: 'critical',
      message: 'Public bucket',
    });
    const report = completeIacScan(s);
    expect(report.metadata.criticalCount).toBe(1);
  });
});
```

### 4. DAST + Container security

`tests/runtime.test.ts` — runtime security 2 axis。

```ts
import { describe, expect, it } from 'vitest';
import {
  attemptDastAttack,
  completeContainerScan,
  completeDastScan,
  confirmDastVuln,
  detectContainerCve,
  startContainerScan,
  startDastScan,
} from '@kiwa-lab/security-devsecops';

describe('runtime security', () => {
  it('DAST detects SQLi + confirms vuln', () => {
    const s = startDastScan({ scanId: 's-1', target: 'https://app.example' });
    attemptDastAttack(s, {
      attackType: 'sqli',
      targetUrl: 'https://app.example/login',
      payload: "' OR 1=1--",
      successful: true,
    });
    confirmDastVuln(s, {
      vulnClass: 'SQL Injection',
      cweId: 'CWE-89',
      targetUrl: 'https://app.example/login',
      severity: 'critical',
      evidence: 'Error-based',
    });
    const report = completeDastScan(s);
    expect(report.metadata.criticalCount).toBe(1);
    expect(report.metadata.successfulAttacks).toBe(1);
  });

  it('Container scan detects openssl CVE', () => {
    const s = startContainerScan({ scanId: 's-1', imageRef: 'app:latest' });
    detectContainerCve(s, {
      cveId: 'CVE-2024-9999',
      package: 'openssl',
      version: '1.1.1',
      layer: 'sha256:xyz',
      severity: 'critical',
      fixedVersion: '1.1.1w',
    });
    const report = completeContainerScan(s);
    expect(report.metadata.criticalCveCount).toBe(1);
  });
});
```

## Run it

```bash
pnpm test
```

3 test files pass. 6 axis を statement 単位で駆動できるので、 dev-flow の /security-audit skill 経路を library ベース test-first に置換可能。 real semgrep / trivy CLI 統合は v0.2 で adapter 追加予定。
