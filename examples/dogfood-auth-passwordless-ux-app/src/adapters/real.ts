import type {
  AuthPasswordlessAdapter,
  AuthPlatform,
  UxSession,
  UxStep,
} from './interface.js';

const ENV_MISSING = 'KIWA_AUTH_PASSWORDLESS_ENV_MISSING';

function isReady(): boolean {
  return (
    process.env['KIWA_MODE'] === 'real' &&
    process.env['AUTH_PASSWORDLESS_STACK_READY'] === '1' &&
    Boolean(process.env['KIWA_AUTH_PASSWORDLESS_URL'])
  );
}

function envMissingStep(op: string): UxStep {
  return { op, outcome: 'env-missing', metadata: { reason: ENV_MISSING } };
}

export function makeRealAdapter(): AuthPasswordlessAdapter {
  let counter = 0;
  const newSession = (
    prefix: string,
    platform: AuthPlatform,
    userId: string,
  ): UxSession => {
    counter++;
    return { sessionId: `${prefix}-real-${counter}`, platform, userId };
  };
  return {
    startDeviceBound: async ({ platform, userId }) => newSession('dev', platform, userId),
    bindDevice: async () => (isReady() ? { op: 'bindDevice', outcome: 'success', metadata: { real: true } } : envMissingStep('bindDevice')),
    verifyBinding: async () => (isReady() ? { op: 'verifyBinding', outcome: 'success', metadata: { real: true } } : envMissingStep('verifyBinding')),
    closeDeviceBound: async () => {},
    startConditionalUiFlow: async ({ platform, userId }) => newSession('ui', platform, userId),
    showAutofillHint: async () => (isReady() ? { op: 'showAutofillHint', outcome: 'success', metadata: { real: true } } : envMissingStep('showAutofillHint')),
    completeAutofill: async (_s, { credentialId, elapsedMs }) => (isReady() ? { op: 'completeAutofill', outcome: 'success', metadata: { credentialId, elapsedMs, real: true } } : envMissingStep('completeAutofill')),
    closeConditionalUi: async () => {},
    startCrossDeviceFlow: async ({ platform, userId }) => newSession('xdev', platform, userId),
    emitQrForCrossDevice: async (_s, { qrPayload }) => (isReady() ? { op: 'emitQrForCrossDevice', outcome: 'success', metadata: { qrPayload, real: true } } : envMissingStep('emitQrForCrossDevice')),
    completeCrossDevice: async (_s, { assertionSignature }) => (isReady() ? { op: 'completeCrossDevice', outcome: 'success', metadata: { assertionSignature, real: true } } : envMissingStep('completeCrossDevice')),
    closeCrossDevice: async () => {},
  };
}
