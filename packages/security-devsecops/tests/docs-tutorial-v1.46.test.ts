/**
 * v1.46-6 docs 補強 — tutorial 103 code snippet 検証。
 * 24 milestone 連続 snippet validation streak = v1.23 → v1.46。
 */
import { describe, expect, it } from 'vitest';
import {
  attemptDastAttack,
  completeContainerScan,
  completeDastScan,
  completeIacScan,
  completeSastScan,
  completeScaScan,
  completeSecretScan,
  confirmDastVuln,
  detectContainerCve,
  detectIacMisconfig,
  detectSastFinding,
  detectScaVuln,
  matchSecretPattern,
  startContainerScan,
  startDastScan,
  startIacScan,
  startSastScan,
  startScaScan,
  startSecretScan,
  suppressSastFinding,
} from '../src/index.js';

describe('tutorial 103 — SAST scan', () => {
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

describe('tutorial 103 — build-time security', () => {
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

describe('tutorial 103 — runtime security', () => {
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
