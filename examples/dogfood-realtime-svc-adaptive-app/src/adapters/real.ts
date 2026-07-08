import type { AdaptiveSession, AdaptiveStep, Platform, RealtimeAdaptiveAdapter } from './interface.js';

const ENV_MISSING = 'KIWA_REALTIME_ADAPTIVE_ENV_MISSING';

function isReady(): boolean {
  return (
    process.env['KIWA_MODE'] === 'real' &&
    process.env['REALTIME_ADAPTIVE_STACK_READY'] === '1' &&
    Boolean(process.env['KIWA_REALTIME_ADAPTIVE_URL'])
  );
}

function envMissingStep(op: string): AdaptiveStep {
  return { op, outcome: 'env-missing', metadata: { reason: ENV_MISSING } };
}

export function makeRealAdapter(): RealtimeAdaptiveAdapter {
  let counter = 0;
  const newSession = (prefix: string, platform: Platform, trackName: string): AdaptiveSession => {
    counter++;
    return { sessionId: `${prefix}-real-${counter}`, platform, trackName };
  };
  return {
    startSvcFlow: async ({ platform, trackName }) => newSession('svc', platform, trackName),
    selectSvcLayer: async (_s, { layerId, temporalId, spatialId }) => (isReady() ? { op: 'selectSvcLayer', outcome: 'success', metadata: { layerId, temporalId, spatialId, real: true } } : envMissingStep('selectSvcLayer')),
    dropSvcLayer: async (_s, { layerId, reason }) => (isReady() ? { op: 'dropSvcLayer', outcome: 'success', metadata: { layerId, reason, real: true } } : envMissingStep('dropSvcLayer')),
    closeSvcFlow: async () => {},
    startDecoderFlow: async ({ platform, trackName }) => newSession('dec', platform, trackName),
    decodeMediaFrame: async (_s, { frameNumber, type }) => (isReady() ? { op: 'decodeMediaFrame', outcome: 'success', metadata: { frameNumber, type, real: true } } : envMissingStep('decodeMediaFrame')),
    dropDecoderFrame: async (_s, { frameNumber, reason }) => (isReady() ? { op: 'dropDecoderFrame', outcome: 'success', metadata: { frameNumber, reason, real: true } } : envMissingStep('dropDecoderFrame')),
    closeDecoderFlow: async () => {},
    startDatagramFlow: async ({ platform, trackName }) => newSession('dg', platform, trackName),
    sendMediaDatagram: async (_s, { sequenceNumber, bytes, priority }) => (isReady() ? { op: 'sendMediaDatagram', outcome: 'success', metadata: { sequenceNumber, bytes, priority, real: true } } : envMissingStep('sendMediaDatagram')),
    recoverDatagramFec: async (_s, { recoveredCount }) => (isReady() ? { op: 'recoverDatagramFec', outcome: 'success', metadata: { recoveredCount, real: true } } : envMissingStep('recoverDatagramFec')),
    closeDatagramFlow: async () => {},
  };
}
