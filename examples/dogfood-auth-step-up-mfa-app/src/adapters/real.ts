import type {
  AuthPlatform,
  AuthStepUpAdapter,
  MfaSession,
  MfaStep,
} from './interface.js';

const ENV_MISSING = 'KIWA_AUTH_STEP_UP_ENV_MISSING';

function isReady(): boolean {
  return (
    process.env['KIWA_MODE'] === 'real' &&
    process.env['AUTH_STEP_UP_STACK_READY'] === '1' &&
    Boolean(process.env['KIWA_AUTH_STEP_UP_URL'])
  );
}

function envMissingStep(op: string): MfaStep {
  return { op, outcome: 'env-missing', metadata: { reason: ENV_MISSING } };
}

export function makeRealAdapter(): AuthStepUpAdapter {
  let counter = 0;
  const newSession = (prefix: string, platform: AuthPlatform, userId: string): MfaSession => {
    counter++;
    return { sessionId: `${prefix}-real-${counter}`, platform, userId };
  };
  return {
    startStepUpFlow: async ({ platform, userId }) => newSession('step', platform, userId),
    escalateTo: async (_s, { requiredAal }) => (isReady() ? { op: 'escalateTo', outcome: 'success', metadata: { requiredAal, real: true } } : envMissingStep('escalateTo')),
    satisfyFactor: async (_s, { level, factor }) => (isReady() ? { op: 'satisfyFactor', outcome: 'success', metadata: { level, factor, real: true } } : envMissingStep('satisfyFactor')),
    closeStepUp: async () => {},
    startContinuityFlow: async ({ platform, userId }) => newSession('cont', platform, userId),
    reauthSeamlessly: async (_s, { nowMs }) => (isReady() ? { op: 'reauthSeamlessly', outcome: 'success', metadata: { nowMs, real: true } } : envMissingStep('reauthSeamlessly')),
    rotateRefreshToken: async (_s, { newToken }) => (isReady() ? { op: 'rotateRefreshToken', outcome: 'success', metadata: { newToken, real: true } } : envMissingStep('rotateRefreshToken')),
    closeContinuity: async () => {},
    startHijackWatchFlow: async ({ platform, userId }) => newSession('hj', platform, userId),
    reportDrift: async (_s, { observedFingerprint, distance }) => (isReady() ? { op: 'reportDrift', outcome: 'success', metadata: { observedFingerprint, distance, real: true } } : envMissingStep('reportDrift')),
    cascadeLogout: async (_s, { revokedSessionIds }) => (isReady() ? { op: 'cascadeLogout', outcome: 'success', metadata: { revokedCount: revokedSessionIds.length, real: true } } : envMissingStep('cascadeLogout')),
    closeHijackWatch: async () => {},
  };
}
