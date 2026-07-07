import type { AuthPlatform, RiskAdapter, RiskSession, RiskStep } from './interface.js';

const ENV_MISSING = 'KIWA_AUTH_RISK_BASED_ENV_MISSING';

function isReady(): boolean {
  return (
    process.env['KIWA_MODE'] === 'real' &&
    process.env['AUTH_RISK_BASED_STACK_READY'] === '1' &&
    Boolean(process.env['KIWA_AUTH_RISK_BASED_URL'])
  );
}

function envMissingStep(op: string): RiskStep {
  return { op, outcome: 'env-missing', metadata: { reason: ENV_MISSING } };
}

export function makeRealAdapter(): RiskAdapter {
  let counter = 0;
  const newSession = (prefix: string, platform: AuthPlatform, userId: string): RiskSession => {
    counter++;
    return { sessionId: `${prefix}-real-${counter}`, platform, userId };
  };
  return {
    startRiskFlow: async ({ platform, userId }) => newSession('risk', platform, userId),
    evaluateScoreOp: async () => (isReady() ? { op: 'evaluateScoreOp', outcome: 'success', metadata: { real: true } } : envMissingStep('evaluateScoreOp')),
    applyPolicyOp: async () => (isReady() ? { op: 'applyPolicyOp', outcome: 'success', metadata: { real: true } } : envMissingStep('applyPolicyOp')),
    closeRisk: async () => {},
    startTelemetryFlow: async ({ platform, userId }) => newSession('tel', platform, userId),
    recordAttemptOp: async (_s, { success, latencyMs }) => (isReady() ? { op: 'recordAttemptOp', outcome: 'success', metadata: { success, latencyMs, real: true } } : envMissingStep('recordAttemptOp')),
    detectAbuseOp: async () => (isReady() ? { op: 'detectAbuseOp', outcome: 'success', metadata: { real: true } } : envMissingStep('detectAbuseOp')),
    closeTelemetry: async () => {},
    startConcurrentWatch: async ({ platform, userId }) => newSession('conc', platform, userId),
    reportGeoAnomalyOp: async (_s, { observedRegion, km }) => (isReady() ? { op: 'reportGeoAnomalyOp', outcome: 'success', metadata: { observedRegion, km, real: true } } : envMissingStep('reportGeoAnomalyOp')),
    reportConcurrentOp: async (_s, { concurrentSessionCount }) => (isReady() ? { op: 'reportConcurrentOp', outcome: 'success', metadata: { concurrentSessionCount, real: true } } : envMissingStep('reportConcurrentOp')),
    closeConcurrentWatch: async () => {},
  };
}
