import { describe, expect, it } from 'vitest';
import {
  completeContainerScan,
  detectContainerCve,
  flagContainerMalware,
  scanContainerImage,
  startContainerScan,
} from '../../src/index.js';

describe('container-security axis', () => {
  it('startContainerScan initializes with grype', () => {
    const s = startContainerScan({ scanId: 's-1', imageRef: 'nginx:latest' });
    expect(s.provider).toBe('grype');
    expect(s.state).toBe('scanning');
  });

  it('scanContainerImage accumulates layer count', () => {
    const s = startContainerScan({ scanId: 's-1', imageRef: 'x' });
    scanContainerImage(s, { layerCount: 5 });
    scanContainerImage(s, { layerCount: 3 });
    expect(s.layerCount).toBe(8);
  });

  it('detectContainerCve records CVE', () => {
    const s = startContainerScan({ scanId: 's-1', imageRef: 'x' });
    const step = detectContainerCve(s, {
      cveId: 'CVE-2024-9999',
      package: 'openssl',
      version: '1.1.1',
      layer: 'sha256:abc',
      severity: 'critical',
      fixedVersion: '1.1.1w',
    });
    expect(step.state).toBe('threats-found');
    expect(step.metadata.hasFix).toBe(true);
  });

  it('flagContainerMalware records malware', () => {
    const s = startContainerScan({ scanId: 's-1', imageRef: 'x' });
    const step = flagContainerMalware(s, {
      malwareType: 'cryptominer',
      filePath: '/usr/local/bin/miner',
      layer: 'sha256:xyz',
      signature: 'xmrig',
      severity: 'critical',
    });
    expect(step.metadata.malwareType).toBe('cryptominer');
    expect(step.state).toBe('threats-found');
  });

  it('completeContainerScan counts critical CVE + malware separately', () => {
    const s = startContainerScan({ scanId: 's-1', imageRef: 'x' });
    detectContainerCve(s, {
      cveId: 'A',
      package: 'x',
      version: '1',
      layer: 'l1',
      severity: 'critical',
    });
    flagContainerMalware(s, {
      malwareType: 'trojan',
      filePath: 'x',
      layer: 'l1',
      signature: 's',
      severity: 'critical',
    });
    const step = completeContainerScan(s);
    expect(step.metadata.criticalCveCount).toBe(1);
    expect(step.metadata.criticalMalwareCount).toBe(1);
  });

  it('all 5 malware types work', () => {
    const s = startContainerScan({ scanId: 's-1', imageRef: 'x' });
    for (const malwareType of [
      'trojan',
      'backdoor',
      'cryptominer',
      'rootkit',
      'ransomware',
    ] as const) {
      const step = flagContainerMalware(s, {
        malwareType,
        filePath: 'x',
        layer: 'x',
        signature: 'x',
        severity: 'high',
      });
      expect(step.metadata.malwareType).toBe(malwareType);
    }
    expect(s.malwares).toHaveLength(5);
  });

  it('history accumulates events', () => {
    const s = startContainerScan({ scanId: 's-1', imageRef: 'x' });
    scanContainerImage(s, { layerCount: 3 });
    detectContainerCve(s, {
      cveId: 'A',
      package: 'x',
      version: '1',
      layer: 'l',
      severity: 'high',
    });
    flagContainerMalware(s, {
      malwareType: 'trojan',
      filePath: 'x',
      layer: 'l',
      signature: 's',
      severity: 'high',
    });
    completeContainerScan(s);
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'container.image-scanned',
      'container.image-scanned',
      'container.cve-detected',
      'container.malware-flagged',
      'container.scan-completed',
    ]);
  });

  it('CVE without fix has hasFix=false', () => {
    const s = startContainerScan({ scanId: 's-1', imageRef: 'x' });
    const step = detectContainerCve(s, {
      cveId: 'A',
      package: 'x',
      version: '1',
      layer: 'l',
      severity: 'high',
    });
    expect(step.metadata.hasFix).toBe(false);
  });
});
