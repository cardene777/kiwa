import type { AxisStep, Severity } from './types.js';

/**
 * Container security axis — Grype-style container image scan + CVE
 * detection + malware detection。
 */
export type ContainerSecState = 'idle' | 'scanning' | 'threats-found' | 'completed';

export interface ContainerCve {
  cveId: string;
  package: string;
  version: string;
  layer: string;
  severity: Severity;
  fixedVersion?: string;
}

export interface ContainerMalware {
  malwareType: 'trojan' | 'backdoor' | 'cryptominer' | 'rootkit' | 'ransomware';
  filePath: string;
  layer: string;
  signature: string;
  severity: Severity;
}

export interface ContainerSecuritySession {
  scanId: string;
  provider: 'grype';
  imageRef: string;
  layerCount: number;
  cves: ContainerCve[];
  malwares: ContainerMalware[];
  state: ContainerSecState;
  history: AxisStep<ContainerSecState>[];
}

export function startContainerScan(input: {
  scanId: string;
  imageRef: string;
}): ContainerSecuritySession {
  const session: ContainerSecuritySession = {
    scanId: input.scanId,
    provider: 'grype',
    imageRef: input.imageRef,
    layerCount: 0,
    cves: [],
    malwares: [],
    state: 'scanning',
    history: [],
  };
  const step: AxisStep<ContainerSecState> = {
    neutralEvent: 'container.image-scanned',
    provider: 'grype',
    state: 'scanning',
    metadata: { scanId: input.scanId, imageRef: input.imageRef },
  };
  session.history.push(step);
  return session;
}

export function scanContainerImage(
  session: ContainerSecuritySession,
  input: { layerCount: number },
): AxisStep<ContainerSecState> {
  session.layerCount += input.layerCount;
  const step: AxisStep<ContainerSecState> = {
    neutralEvent: 'container.image-scanned',
    provider: 'grype',
    state: session.state,
    metadata: {
      scanId: session.scanId,
      layerCount: input.layerCount,
      totalLayers: session.layerCount,
    },
  };
  session.history.push(step);
  return step;
}

export function detectContainerCve(
  session: ContainerSecuritySession,
  cve: ContainerCve,
): AxisStep<ContainerSecState> {
  session.cves.push(cve);
  session.state = 'threats-found';
  const step: AxisStep<ContainerSecState> = {
    neutralEvent: 'container.cve-detected',
    provider: 'grype',
    state: 'threats-found',
    metadata: {
      scanId: session.scanId,
      cveId: cve.cveId,
      package: cve.package,
      layer: cve.layer,
      severity: cve.severity,
      hasFix: cve.fixedVersion !== undefined,
    },
  };
  session.history.push(step);
  return step;
}

export function flagContainerMalware(
  session: ContainerSecuritySession,
  malware: ContainerMalware,
): AxisStep<ContainerSecState> {
  session.malwares.push(malware);
  session.state = 'threats-found';
  const step: AxisStep<ContainerSecState> = {
    neutralEvent: 'container.malware-flagged',
    provider: 'grype',
    state: 'threats-found',
    metadata: {
      scanId: session.scanId,
      malwareType: malware.malwareType,
      layer: malware.layer,
      severity: malware.severity,
    },
  };
  session.history.push(step);
  return step;
}

export function completeContainerScan(
  session: ContainerSecuritySession,
): AxisStep<ContainerSecState> {
  session.state = 'completed';
  const criticalCveCount = session.cves.filter((c) => c.severity === 'critical').length;
  const criticalMalwareCount = session.malwares.filter((m) => m.severity === 'critical').length;
  const step: AxisStep<ContainerSecState> = {
    neutralEvent: 'container.scan-completed',
    provider: 'grype',
    state: 'completed',
    metadata: {
      scanId: session.scanId,
      layerCount: session.layerCount,
      cveCount: session.cves.length,
      malwareCount: session.malwares.length,
      criticalCveCount,
      criticalMalwareCount,
    },
  };
  session.history.push(step);
  return step;
}
