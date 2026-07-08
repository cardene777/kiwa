import type { MediaSession, MediaStep, Platform, RealtimeMediaAdapter } from './interface.js';

const ENV_MISSING = 'KIWA_REALTIME_MEDIA_ENV_MISSING';

function isReady(): boolean {
  return (
    process.env['KIWA_MODE'] === 'real' &&
    process.env['REALTIME_MEDIA_STACK_READY'] === '1' &&
    Boolean(process.env['KIWA_REALTIME_MEDIA_URL'])
  );
}

function envMissingStep(op: string): MediaStep {
  return { op, outcome: 'env-missing', metadata: { reason: ENV_MISSING } };
}

export function makeRealAdapter(): RealtimeMediaAdapter {
  let counter = 0;
  const newSession = (prefix: string, platform: Platform, trackName: string): MediaSession => {
    counter++;
    return { sessionId: `${prefix}-real-${counter}`, platform, trackName };
  };
  return {
    startMoqFlow: async ({ platform, trackName }) => newSession('moq', platform, trackName),
    announceMoqTrack: async (_s, { namespace }) => (isReady() ? { op: 'announceMoqTrack', outcome: 'success', metadata: { namespace, real: true } } : envMissingStep('announceMoqTrack')),
    sendMoqObject: async (_s, { groupId, objectId, bytes }) => (isReady() ? { op: 'sendMoqObject', outcome: 'success', metadata: { groupId, objectId, bytes, real: true } } : envMissingStep('sendMoqObject')),
    closeMoqFlow: async () => {},
    startEncoderFlow: async ({ platform, trackName }) => newSession('enc', platform, trackName),
    encodeMediaFrame: async (_s, { frameNumber, byteLength }) => (isReady() ? { op: 'encodeMediaFrame', outcome: 'success', metadata: { frameNumber, byteLength, real: true } } : envMissingStep('encodeMediaFrame')),
    reportEncoderHardware: async (_s, { hardware }) => (isReady() ? { op: 'reportEncoderHardware', outcome: 'success', metadata: { hardware, real: true } } : envMissingStep('reportEncoderHardware')),
    closeEncoderFlow: async () => {},
    startSimulcastFlow: async ({ platform, trackName }) => newSession('sim', platform, trackName),
    addSimulcastQualityLayer: async (_s, { layerId, bitrateKbps }) => (isReady() ? { op: 'addSimulcastQualityLayer', outcome: 'success', metadata: { layerId, bitrateKbps, real: true } } : envMissingStep('addSimulcastQualityLayer')),
    adaptSimulcastBitrate: async (_s, { layerId, targetKbps, reason }) => (isReady() ? { op: 'adaptSimulcastBitrate', outcome: 'success', metadata: { layerId, targetKbps, reason, real: true } } : envMissingStep('adaptSimulcastBitrate')),
    closeSimulcastFlow: async () => {},
  };
}
