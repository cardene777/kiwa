import {
  analyzeScaDependency,
  completeScaScan,
  detectScaVuln,
  flagScaLicense,
  startScaScan,
  type ScaState,
} from '../semantics/sca.js';
import type {
  AdapterInvocation,
  AdapterResult,
  ScaAdapter,
} from './types.js';

/**
 * SCA mock adapter — Trivy-style deterministic replay。 2 CVE + 1 license flag。
 */
export const scaMockAdapter: ScaAdapter = {
  axis: 'sca',
  async scan(input: AdapterInvocation): Promise<AdapterResult<ScaState>> {
    const session = startScaScan({ scanId: input.scanId, target: input.target });
    analyzeScaDependency(session, { count: 42 });
    detectScaVuln(session, {
      cveId: 'CVE-2024-99999',
      package: 'lodash',
      version: '4.17.20',
      severity: 'high',
      fixedVersion: '4.17.21',
    });
    detectScaVuln(session, {
      cveId: 'CVE-2024-88888',
      package: 'axios',
      version: '0.21.0',
      severity: 'critical',
      fixedVersion: '1.6.0',
    });
    flagScaLicense(session, { package: 'gpl-pkg', license: 'GPL-3.0', reason: 'copyleft' });
    completeScaScan(session);
    return {
      axis: 'sca',
      mode: 'mock',
      history: session.history,
      completed: session.state === 'completed',
      durationMs: 1,
    };
  },
};
