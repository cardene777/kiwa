import {
  createRealtimeAiInferenceMock,
  createVoiceStreamingMock,
  createWhisperStreamingMock,
  type RealtimeAiInferenceMock,
  type VoiceStreamingMock,
  type WhisperStreamingMock,
} from '@kiwa/realtime';
import type { AiSession, AiStep, Platform, RealtimeAiAdapter } from './interface.js';

interface MockContext {
  voices: Map<string, VoiceStreamingMock>;
  whispers: Map<string, WhisperStreamingMock>;
  inferences: Map<string, RealtimeAiInferenceMock>;
  ops: number;
}

export function makeMockAdapter(): RealtimeAiAdapter {
  const ctx: MockContext = {
    voices: new Map(),
    whispers: new Map(),
    inferences: new Map(),
    ops: 0,
  };
  const newSession = (prefix: string, platform: Platform, userId: string): AiSession => {
    ctx.ops++;
    return { sessionId: `${prefix}-${ctx.ops}`, platform, userId };
  };
  return {
    startVoiceFlow: async ({ platform, userId, model }) => {
      const s = newSession('voice', platform, userId);
      const mock = createVoiceStreamingMock({ artificialLatencyMs: 0 });
      await mock.openSession({ sessionId: s.sessionId, model, voice: 'alloy' });
      ctx.voices.set(s.sessionId, mock);
      return s;
    },
    sendVoiceAudio: async (session, { seq, bytes, durationMs }) => {
      const mock = ctx.voices.get(session.sessionId);
      if (!mock) throw new Error(`sendVoiceAudio: unknown sessionId ${session.sessionId}`);
      await mock.sendAudioChunk({ sessionId: session.sessionId, sequenceNumber: seq, byteLength: bytes, durationMs });
      return { op: 'sendVoiceAudio', outcome: 'success', metadata: { seq, bytes, durationMs } } satisfies AiStep;
    },
    completeVoiceTurn: async (session, { totalDurationMs }) => {
      const mock = ctx.voices.get(session.sessionId);
      if (!mock) throw new Error(`completeVoiceTurn: unknown sessionId ${session.sessionId}`);
      await mock.completeTurn({ sessionId: session.sessionId, totalDurationMs });
      return { op: 'completeVoiceTurn', outcome: 'success', metadata: { totalDurationMs } };
    },
    closeVoiceFlow: async (session) => {
      ctx.voices.delete(session.sessionId);
    },
    startWhisperFlow: async ({ platform, userId }) => {
      const s = newSession('whisper', platform, userId);
      ctx.whispers.set(s.sessionId, createWhisperStreamingMock({ artificialLatencyMs: 0 }));
      return s;
    },
    streamAudioToWhisper: async (session, { bytes, durationMs }) => {
      const mock = ctx.whispers.get(session.sessionId);
      if (!mock) throw new Error(`streamAudioToWhisper: unknown sessionId ${session.sessionId}`);
      await mock.sendAudioChunk({ streamId: session.sessionId, byteLength: bytes, durationMs });
      return { op: 'streamAudioToWhisper', outcome: 'success', metadata: { bytes, durationMs } };
    },
    triggerVadEvent: async (session, { type, timestampMs }) => {
      const mock = ctx.whispers.get(session.sessionId);
      if (!mock) throw new Error(`triggerVadEvent: unknown sessionId ${session.sessionId}`);
      await mock.triggerVad({ streamId: session.sessionId, type, timestampMs });
      return { op: 'triggerVadEvent', outcome: 'success', metadata: { type, timestampMs } };
    },
    closeWhisperFlow: async (session) => {
      ctx.whispers.delete(session.sessionId);
    },
    startInferenceFlow: async ({ platform, userId }) => {
      const s = newSession('inf', platform, userId);
      ctx.inferences.set(s.sessionId, createRealtimeAiInferenceMock({ artificialLatencyMs: 0 }));
      return s;
    },
    submitInferenceRequest: async (session, { requestId, frameNumber, budgetMs }) => {
      const mock = ctx.inferences.get(session.sessionId);
      if (!mock) throw new Error(`submitInferenceRequest: unknown sessionId ${session.sessionId}`);
      await mock.sendRequest({ requestId, frameNumber, modelName: 'yolo-v8', budgetMs });
      return { op: 'submitInferenceRequest', outcome: 'success', metadata: { requestId, frameNumber, budgetMs } };
    },
    reportInferenceBudget: async (session, { requestId, consumedMs, budgetMs }) => {
      const mock = ctx.inferences.get(session.sessionId);
      if (!mock) throw new Error(`reportInferenceBudget: unknown sessionId ${session.sessionId}`);
      await mock.reportBudget({ requestId, budgetMs, consumedMs });
      return {
        op: 'reportInferenceBudget',
        outcome: 'success',
        metadata: { requestId, consumedMs, budgetMs, exceeded: consumedMs > budgetMs },
      };
    },
    closeInferenceFlow: async (session) => {
      ctx.inferences.delete(session.sessionId);
    },
  };
}
