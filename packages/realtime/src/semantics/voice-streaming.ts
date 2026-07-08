import {
  initialMetrics,
  type SemanticsEvent,
  type SemanticsMetrics,
  type SemanticsMock,
  type SemanticsMockConfig,
} from './types.js';

/**
 * LLM voice streaming axis — OpenAI Realtime API + Anthropic voice + audio
 * streaming chunk exchange + turn management. session open → audio chunk
 * upload → response chunk stream → turn completed の 4-op flow を mock 化。
 */

export interface VoiceSession {
  sessionId: string;
  model: string;
  voice: string;
}

export interface VoiceAudioChunk {
  sessionId: string;
  sequenceNumber: number;
  byteLength: number;
  durationMs: number;
}

export interface VoiceStreamingMock extends SemanticsMock {
  readonly protocol: 'ai-media';
  readonly axis: 'voice-streaming';
  openSession(input: VoiceSession): Promise<void>;
  sendAudioChunk(input: VoiceAudioChunk): Promise<void>;
  receiveResponseChunk(input: VoiceAudioChunk): Promise<void>;
  completeTurn(input: { sessionId: string; totalDurationMs: number }): Promise<void>;
}

export function createVoiceStreamingMock(config: SemanticsMockConfig = {}): VoiceStreamingMock {
  const handlers: Array<(e: SemanticsEvent) => void> = [];
  let metrics = initialMetrics();
  let elapsedMs = 0;
  let order = 0;
  const latency = config.artificialLatencyMs ?? 1;

  const emit = <T,>(kind: SemanticsEvent['kind'], streamId: string, payload: T): void => {
    elapsedMs += latency;
    const ev: SemanticsEvent<T> = { kind, streamId, payload, relativeTimeMs: elapsedMs, order: order++ };
    metrics.eventsEmitted++;
    handlers.forEach((h) => h(ev));
  };

  return {
    protocol: 'ai-media',
    axis: 'voice-streaming',
    onEvent(handler) {
      handlers.push(handler);
      return () => {
        const idx = handlers.indexOf(handler);
        if (idx >= 0) handlers.splice(idx, 1);
      };
    },
    getMetrics() {
      return metrics;
    },
    reset() {
      metrics = initialMetrics();
      elapsedMs = 0;
      order = 0;
    },
    async openSession(input) {
      emit('voice-session-open', input.sessionId, input);
      metrics.custom['sessionsOpened'] = (metrics.custom['sessionsOpened'] ?? 0) + 1;
    },
    async sendAudioChunk(input) {
      emit('voice-audio-chunk-sent', input.sessionId, input);
      metrics.custom['chunksSent'] = (metrics.custom['chunksSent'] ?? 0) + 1;
      metrics.custom['bytesSent'] = (metrics.custom['bytesSent'] ?? 0) + input.byteLength;
    },
    async receiveResponseChunk(input) {
      emit('voice-response-chunk-received', input.sessionId, input);
      metrics.custom['chunksReceived'] = (metrics.custom['chunksReceived'] ?? 0) + 1;
      metrics.custom['bytesReceived'] = (metrics.custom['bytesReceived'] ?? 0) + input.byteLength;
    },
    async completeTurn(input) {
      emit('voice-turn-completed', input.sessionId, input);
      metrics.custom['turnsCompleted'] = (metrics.custom['turnsCompleted'] ?? 0) + 1;
    },
  };
}
