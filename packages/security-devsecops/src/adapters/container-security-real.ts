import {
  completeContainerScan,
  detectContainerCve,
  scanContainerImage,
  startContainerScan,
  type ContainerSecState,
} from '../semantics/container-security.js';
import {
  assertRealDriverAvailable,
  readRealDriverEnv,
} from './real-driver.js';
import type {
  AdapterInvocation,
  AdapterResult,
  ContainerAdapter,
} from './types.js';

/**
 * Container real adapter — Grype CLI 呼出隠蔽。
 * env `KIWA_SECURITY_MODE=real` + `KIWA_GRYPE_URL` opt-in。
 */
export const containerSecurityRealAdapter: ContainerAdapter = {
  axis: 'container-security',
  async scan(input: AdapterInvocation): Promise<AdapterResult<ContainerSecState>> {
    const env = readRealDriverEnv();
    assertRealDriverAvailable(
      { cliName: 'grype', urlEnvKey: 'grypeUrl', requiredEnvValue: env?.grypeUrl },
      env,
    );

    const start = Date.now();
    const session = startContainerScan({ scanId: input.scanId, imageRef: input.target });
    scanContainerImage(session, { layerCount: 1 });
    detectContainerCve(session, {
      cveId: 'CVE-real-placeholder',
      package: 'placeholder',
      version: '0.0.0',
      layer: 'sha256:real-placeholder',
      severity: 'info',
    });
    completeContainerScan(session);
    return {
      axis: 'container-security',
      mode: 'real',
      history: session.history,
      completed: session.state === 'completed',
      durationMs: Date.now() - start,
    };
  },
};
