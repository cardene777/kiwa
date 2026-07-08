// v1.47-1 adapter fidelity harness — 6 axis × mock adapter が semantics 経路と
// 一致することを検証。 real adapter (v1.47-2) が加わっても同じ harness で
// mock/real 一致を検証する土台を作る。
import { describe, expect, it } from 'vitest';
import type { AdapterInvocation } from '../../src/adapters/index.js';
import {
  containerSecurityMockAdapter,
  dastMockAdapter,
  iacScanMockAdapter,
  sastMockAdapter,
  scaMockAdapter,
  secretScanMockAdapter,
} from '../../src/adapters/index.js';

const inv = (scanId: string, target: string): AdapterInvocation => ({
  scanId,
  target,
  mode: 'mock',
});

describe('DevSecOps adapter fidelity harness', () => {
  it('SAST mock adapter emits sast neutral events + completes', async () => {
    const result = await sastMockAdapter.scan(inv('sast-1', '/repo'));
    expect(result.axis).toBe('sast');
    expect(result.mode).toBe('mock');
    expect(result.completed).toBe(true);
    const events = result.history.map((h) => h.neutralEvent);
    expect(events).toContain('sast.scan-started');
    expect(events).toContain('sast.finding-detected');
    expect(events).toContain('sast.scan-completed');
  });

  it('SCA mock adapter emits sca neutral events + completes with vulns', async () => {
    const result = await scaMockAdapter.scan(inv('sca-1', '/repo'));
    expect(result.axis).toBe('sca');
    expect(result.completed).toBe(true);
    const events = result.history.map((h) => h.neutralEvent);
    expect(events).toContain('sca.dependency-analyzed');
    expect(events).toContain('sca.vuln-detected');
    expect(events).toContain('sca.license-flagged');
    expect(events).toContain('sca.scan-completed');
  });

  it('Secret mock adapter emits secret neutral events + completes', async () => {
    const result = await secretScanMockAdapter.scan(inv('secret-1', '/repo'));
    expect(result.axis).toBe('secret-scan');
    expect(result.completed).toBe(true);
    const events = result.history.map((h) => h.neutralEvent);
    expect(events).toContain('secret.pattern-matched');
    expect(events).toContain('secret.entropy-flagged');
    expect(events).toContain('secret.scan-completed');
  });

  it('IaC mock adapter emits iac neutral events + completes', async () => {
    const result = await iacScanMockAdapter.scan(inv('iac-1', '/tf'));
    expect(result.axis).toBe('iac-scan');
    expect(result.completed).toBe(true);
    const events = result.history.map((h) => h.neutralEvent);
    expect(events).toContain('iac.resource-analyzed');
    expect(events).toContain('iac.misconfig-detected');
    expect(events).toContain('iac.compliance-checked');
    expect(events).toContain('iac.scan-completed');
  });

  it('DAST mock adapter emits dast neutral events + completes with vulns', async () => {
    const result = await dastMockAdapter.scan(inv('dast-1', 'https://mock.local'));
    expect(result.axis).toBe('dast');
    expect(result.completed).toBe(true);
    const events = result.history.map((h) => h.neutralEvent);
    expect(events).toContain('dast.crawl-started');
    expect(events).toContain('dast.attack-attempted');
    expect(events).toContain('dast.vulnerability-confirmed');
    expect(events).toContain('dast.scan-completed');
  });

  it('Container mock adapter emits container neutral events + completes with CVE + malware', async () => {
    const result = await containerSecurityMockAdapter.scan(inv('container-1', 'nginx:latest'));
    expect(result.axis).toBe('container-security');
    expect(result.completed).toBe(true);
    const events = result.history.map((h) => h.neutralEvent);
    expect(events).toContain('container.image-scanned');
    expect(events).toContain('container.cve-detected');
    expect(events).toContain('container.malware-flagged');
    expect(events).toContain('container.scan-completed');
  });

  it('all 6 adapters expose consistent AdapterResult shape', async () => {
    const results = await Promise.all([
      sastMockAdapter.scan(inv('a', '/x')),
      scaMockAdapter.scan(inv('b', '/x')),
      secretScanMockAdapter.scan(inv('c', '/x')),
      iacScanMockAdapter.scan(inv('d', '/x')),
      dastMockAdapter.scan(inv('e', 'https://x')),
      containerSecurityMockAdapter.scan(inv('f', 'x:latest')),
    ]);
    for (const r of results) {
      expect(r.mode).toBe('mock');
      expect(r.completed).toBe(true);
      expect(r.history.length).toBeGreaterThan(0);
      expect(typeof r.durationMs).toBe('number');
    }
  });
});
