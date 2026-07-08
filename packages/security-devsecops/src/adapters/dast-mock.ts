import {
  attemptDastAttack,
  completeDastScan,
  confirmDastVuln,
  crawlDastUrls,
  startDastScan,
  type DastState,
} from '../semantics/dast.js';
import type {
  AdapterInvocation,
  AdapterResult,
  DastAdapter,
} from './types.js';

/**
 * DAST mock adapter — OWASP ZAP-style deterministic replay。
 */
export const dastMockAdapter: DastAdapter = {
  axis: 'dast',
  async scan(input: AdapterInvocation): Promise<AdapterResult<DastState>> {
    const session = startDastScan({ scanId: input.scanId, target: input.target });
    crawlDastUrls(session, { count: 128 });
    attemptDastAttack(session, {
      attackType: 'xss',
      targetUrl: `${input.target}/search?q=<x>`,
      payload: '<script>mock</script>',
      successful: true,
    });
    attemptDastAttack(session, {
      attackType: 'sqli',
      targetUrl: `${input.target}/api/users?id=1`,
      payload: "' OR 1=1 --",
      successful: false,
    });
    confirmDastVuln(session, {
      vulnClass: 'reflected-xss',
      cweId: 'CWE-79',
      targetUrl: `${input.target}/search`,
      severity: 'high',
      evidence: 'mock reflected XSS payload accepted',
    });
    completeDastScan(session);
    return {
      axis: 'dast',
      mode: 'mock',
      history: session.history,
      completed: session.state === 'completed',
      durationMs: 1,
    };
  },
};
