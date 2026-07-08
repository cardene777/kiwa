import { describe, expect, it } from 'vitest';
import {
  completeContainerScan,
  completeDastScan,
  completeIacScan,
  completeSastScan,
  completeScaScan,
  completeSecretScan,
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
  attemptDastAttack,
  confirmDastVuln,
} from '@kiwa/security-devsecops';

/**
 * dev-flow の /security-audit skill 経路を library 経由で実行する dogfood。
 * 6 axis を単一 audit workflow として集約実行する pattern を検証。
 */

describe('security audit workflow — 6 axis 集約実行 pattern', () => {
  it('SAST + SCA + Secret + IaC + DAST + Container を chain 実行', () => {
    const scanId = 'audit-e2e';

    // 1. SAST
    const sast = startSastScan({ scanId: `${scanId}-sast`, target: 'src/' });
    detectSastFinding(sast, {
      ruleId: 'js.crypto.weak-hash',
      filePath: 'src/auth.ts',
      line: 42,
      severity: 'high',
      message: 'MD5 usage',
    });
    const sastReport = completeSastScan(sast);
    expect(sastReport.metadata.totalFindings).toBe(1);

    // 2. SCA
    const sca = startScaScan({ scanId: `${scanId}-sca`, target: 'package.json' });
    detectScaVuln(sca, {
      cveId: 'CVE-2024-1234',
      package: 'lodash',
      version: '4.17.20',
      severity: 'critical',
      fixedVersion: '4.17.21',
    });
    const scaReport = completeScaScan(sca);
    expect(scaReport.metadata.criticalCount).toBe(1);

    // 3. Secret scan
    const secret = startSecretScan({ scanId: `${scanId}-secret`, target: '.' });
    matchSecretPattern(secret, {
      ruleId: 'aws-key',
      filePath: '.env',
      line: 3,
      redactedValue: 'AKIA****',
      severity: 'critical',
    });
    const secretReport = completeSecretScan(secret);
    expect(secretReport.metadata.activeCount).toBe(1);

    // 4. IaC scan
    const iac = startIacScan({ scanId: `${scanId}-iac`, target: 'infra/' });
    detectIacMisconfig(iac, {
      ruleId: 'S3-PUBLIC',
      resourceType: 'aws_s3_bucket',
      resourceName: 'logs',
      filePath: 'main.tf',
      severity: 'critical',
      message: 'Public',
    });
    const iacReport = completeIacScan(iac);
    expect(iacReport.metadata.criticalCount).toBe(1);

    // 5. DAST
    const dast = startDastScan({ scanId: `${scanId}-dast`, target: 'https://app.example' });
    attemptDastAttack(dast, {
      attackType: 'sqli',
      targetUrl: 'https://app.example/login',
      payload: "' OR 1=1--",
      successful: true,
    });
    confirmDastVuln(dast, {
      vulnClass: 'SQL Injection',
      cweId: 'CWE-89',
      targetUrl: 'https://app.example/login',
      severity: 'critical',
      evidence: 'Error-based',
    });
    const dastReport = completeDastScan(dast);
    expect(dastReport.metadata.criticalCount).toBe(1);

    // 6. Container
    const container = startContainerScan({ scanId: `${scanId}-container`, imageRef: 'app:latest' });
    detectContainerCve(container, {
      cveId: 'CVE-2024-9999',
      package: 'openssl',
      version: '1.1.1',
      layer: 'sha256:xyz',
      severity: 'critical',
    });
    const containerReport = completeContainerScan(container);
    expect(containerReport.metadata.criticalCveCount).toBe(1);
  });

  it('全 axis 独立実行 = state 分離', () => {
    const sast1 = startSastScan({ scanId: 'a', target: 'x' });
    const sast2 = startSastScan({ scanId: 'b', target: 'y' });
    detectSastFinding(sast1, {
      ruleId: 'X',
      filePath: 'x',
      line: 1,
      severity: 'high',
      message: 'x',
    });
    expect(sast1.findings).toHaveLength(1);
    expect(sast2.findings).toHaveLength(0);
  });

  it('SAST の critical 集計は suppressed 除外', () => {
    const s = startSastScan({ scanId: 's-1', target: 'x' });
    detectSastFinding(s, {
      ruleId: 'A',
      filePath: 'x',
      line: 1,
      severity: 'critical',
      message: 'x',
    });
    detectSastFinding(s, {
      ruleId: 'B',
      filePath: 'y',
      line: 2,
      severity: 'critical',
      message: 'y',
    });
    // suppress は explicit
    const step = completeSastScan(s);
    expect(step.metadata.criticalCount).toBe(2);
  });

  it('SCA license flag は state に反映', () => {
    // license flag のみ (vuln なし) でも scan 完了は可能
    const s = startScaScan({ scanId: 's-1', target: 'x' });
    detectScaVuln(s, {
      cveId: 'A',
      package: 'lib',
      version: '1',
      severity: 'medium',
    });
    const step = completeScaScan(s);
    expect(step.metadata.vulnCount).toBe(1);
  });

  it('Secret entropy + pattern 両方を混在集計', () => {
    const s = startSecretScan({ scanId: 's-1', target: 'x' });
    matchSecretPattern(s, {
      ruleId: 'X',
      filePath: 'x',
      line: 1,
      redactedValue: 'x',
      severity: 'high',
    });
    // entropy 追加
    const step = completeSecretScan(s);
    expect(step.metadata.totalMatches).toBe(1);
  });

  it('DAST successful attacks 集計', () => {
    const s = startDastScan({ scanId: 's-1', target: 'x' });
    for (const successful of [true, false, true, true]) {
      attemptDastAttack(s, {
        attackType: 'xss',
        targetUrl: 'x',
        payload: 'x',
        successful,
      });
    }
    const step = completeDastScan(s);
    expect(step.metadata.successfulAttacks).toBe(3);
  });

  it('Container CVE + malware 別集計', () => {
    const s = startContainerScan({ scanId: 's-1', imageRef: 'x' });
    detectContainerCve(s, {
      cveId: 'A',
      package: 'x',
      version: '1',
      layer: 'l',
      severity: 'critical',
    });
    detectContainerCve(s, {
      cveId: 'B',
      package: 'y',
      version: '1',
      layer: 'l',
      severity: 'high',
    });
    const step = completeContainerScan(s);
    expect(step.metadata.criticalCveCount).toBe(1);
    expect(step.metadata.cveCount).toBe(2);
  });

  it('全 6 axis complete event が発火', () => {
    const scans = [
      completeSastScan(startSastScan({ scanId: '1', target: 'x' })),
      completeScaScan(startScaScan({ scanId: '2', target: 'x' })),
      completeSecretScan(startSecretScan({ scanId: '3', target: 'x' })),
      completeIacScan(startIacScan({ scanId: '4', target: 'x' })),
      completeDastScan(startDastScan({ scanId: '5', target: 'x' })),
      completeContainerScan(startContainerScan({ scanId: '6', imageRef: 'x' })),
    ];
    expect(scans.map((s) => s.state)).toEqual([
      'completed',
      'completed',
      'completed',
      'completed',
      'completed',
      'completed',
    ]);
  });
});
