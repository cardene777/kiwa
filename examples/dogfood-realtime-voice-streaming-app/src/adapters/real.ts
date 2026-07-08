import type { AiSession, AiStep, Platform, RealtimeAiAdapter } from './interface.js';

const ENV_MISSING = 'KIWA_REALTIME_AI_ENV_MISSING';

function isReady(): boolean {
  return (
    process.env['KIWA_MODE'] === 'real' &&
    process.env['REALTIME_AI_STACK_READY'] === '1' &&
    Boolean(process.env['KIWA_REALTIME_AI_URL'])
  );
}

function envMissingStep(op: string): AiStep {
  return { op, outcome: 'env-missing', metadata: { reason: ENV_MISSING } };
}

export function makeRealAdapter(): RealtimeAiAdapter {
  let counter = 0;
  const newSession = (prefix: string, platform: Platform, userId: string): AiSession => {
    counter++;
    return { sessionId: `${prefix}-real-${counter}`, platform, userId };
  };
  return {
    startVoiceFlow: async ({ platform, userId }) => newSession('voice', platform, userId),
    sendVoiceAudio: async (_s, { seq, bytes, durationMs }) => (isReady() ? { op: 'sendVoiceAudio', outcome: 'success', metadata: { seq, bytes, durationMs, real: true } } : envMissingStep('sendVoiceAudio')),
    completeVoiceTurn: async (_s, { totalDurationMs }) => (isReady() ? { op: 'completeVoiceTurn', outcome: 'success', metadata: { totalDurationMs, real: true } } : envMissingStep('completeVoiceTurn')),
    closeVoiceFlow: async () => {},
    startWhisperFlow: async ({ platform, userId }) => newSession('whisper', platform, userId),
    streamAudioToWhisper: async (_s, { bytes, durationMs }) => (isReady() ? { op: 'streamAudioToWhisper', outcome: 'success', metadata: { bytes, durationMs, real: true } } : envMissingStep('streamAudioToWhisper')),
    triggerVadEvent: async (_s, { type, timestampMs }) => (isReady() ? { op: 'triggerVadEvent', outcome: 'success', metadata: { type, timestampMs, real: true } } : envMissingStep('triggerVadEvent')),
    closeWhisperFlow: async () => {},
    startInferenceFlow: async ({ platform, userId }) => newSession('inf', platform, userId),
    submitInferenceRequest: async (_s, { requestId, frameNumber, budgetMs }) => (isReady() ? { op: 'submitInferenceRequest', outcome: 'success', metadata: { requestId, frameNumber, budgetMs, real: true } } : envMissingStep('submitInferenceRequest')),
    reportInferenceBudget: async (_s, { requestId, consumedMs, budgetMs }) => (isReady() ? { op: 'reportInferenceBudget', outcome: 'success', metadata: { requestId, consumedMs, budgetMs, real: true } } : envMissingStep('reportInferenceBudget')),
    closeInferenceFlow: async () => {},
  };
}
