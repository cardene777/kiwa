export type Platform = 'chromium' | 'webkit' | 'firefox';

export interface AiSession {
  sessionId: string;
  platform: Platform;
  userId: string;
}

export interface AiStep {
  op: string;
  outcome: 'success' | 'env-missing' | 'error';
  metadata: Record<string, string | number | boolean>;
}

export interface RealtimeAiAdapter {
  // voice axis
  startVoiceFlow: (input: { platform: Platform; userId: string; model: string }) => Promise<AiSession>;
  sendVoiceAudio: (session: AiSession, input: { seq: number; bytes: number; durationMs: number }) => Promise<AiStep>;
  completeVoiceTurn: (session: AiSession, input: { totalDurationMs: number }) => Promise<AiStep>;
  closeVoiceFlow: (session: AiSession) => Promise<void>;
  // whisper axis
  startWhisperFlow: (input: { platform: Platform; userId: string }) => Promise<AiSession>;
  streamAudioToWhisper: (session: AiSession, input: { bytes: number; durationMs: number }) => Promise<AiStep>;
  triggerVadEvent: (session: AiSession, input: { type: 'start' | 'end'; timestampMs: number }) => Promise<AiStep>;
  closeWhisperFlow: (session: AiSession) => Promise<void>;
  // inference axis
  startInferenceFlow: (input: { platform: Platform; userId: string; modelName: string }) => Promise<AiSession>;
  submitInferenceRequest: (session: AiSession, input: { requestId: string; frameNumber: number; budgetMs: number }) => Promise<AiStep>;
  reportInferenceBudget: (session: AiSession, input: { requestId: string; consumedMs: number; budgetMs: number }) => Promise<AiStep>;
  closeInferenceFlow: (session: AiSession) => Promise<void>;
}
