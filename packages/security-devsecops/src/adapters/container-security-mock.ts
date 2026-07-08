import {
  completeContainerScan,
  detectContainerCve,
  flagContainerMalware,
  scanContainerImage,
  startContainerScan,
  type ContainerSecState,
} from '../semantics/container-security.js';
import type {
  AdapterInvocation,
  AdapterResult,
  ContainerAdapter,
} from './types.js';

/**
 * Container mock adapter — Grype-style deterministic replay。
 */
export const containerSecurityMockAdapter: ContainerAdapter = {
  axis: 'container-security',
  async scan(input: AdapterInvocation): Promise<AdapterResult<ContainerSecState>> {
    const session = startContainerScan({ scanId: input.scanId, imageRef: input.target });
    scanContainerImage(session, { layerCount: 8 });
    detectContainerCve(session, {
      cveId: 'CVE-2024-77777',
      package: 'openssl',
      version: '3.0.7',
      layer: 'sha256:mock-layer-2',
      severity: 'critical',
      fixedVersion: '3.0.13',
    });
    flagContainerMalware(session, {
      malwareType: 'cryptominer',
      filePath: '/tmp/xmrig',
      layer: 'sha256:mock-layer-5',
      signature: 'mock-crypto-sig',
      severity: 'high',
    });
    completeContainerScan(session);
    return {
      axis: 'container-security',
      mode: 'mock',
      history: session.history,
      completed: session.state === 'completed',
      durationMs: 1,
    };
  },
};
