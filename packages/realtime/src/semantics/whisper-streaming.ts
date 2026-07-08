import {
  initialMetrics,
  type SemanticsEvent,
  type SemanticsMetrics,
  type SemanticsMock,
  type SemanticsMockConfig,
} from './types.js';

/**
 * Whisper streaming ASR axis — Whisper streaming API (OpenAI + local
 * WhisperCPP) + partial transcript + Voice Activity Detection (VAD) trigger。
 * partial transcript は音声区切りごと、 final transcript は VAD end で確定。
 */

export interface WhisperTranscript {
  streamId: string;
  text: string;
  startMs: number;
  endMs: number;
  confidence: number;
}

export interface WhisperStreamingMock extends SemanticsMock {
  readonly protocol: 'ai-media';
  readonly axis: 'whisper-streaming';
  sendAudioChunk(input: { streamId: string; byteLength: number; durationMs: number }): Promise<void>;
  emitPartialTranscript(input: WhisperTranscript): Promise<void>;
  emitFinalTranscript(input: WhisperTranscript): Promise<void>;
  triggerVad(input: { streamId: string; type: 'start' | 'end'; timestampMs: number }): Promise<void>;
}

export function createWhisperStreamingMock(config: SemanticsMockConfig = {}): WhisperStreamingMock {
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
    axis: 'whisper-streaming',
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
    async sendAudioChunk(input) {
      emit('whisper-audio-chunk-sent', input.streamId, input);
      metrics.custom['chunksSent'] = (metrics.custom['chunksSent'] ?? 0) + 1;
      metrics.custom['bytesSent'] = (metrics.custom['bytesSent'] ?? 0) + input.byteLength;
    },
    async emitPartialTranscript(input) {
      emit('whisper-partial-transcript', input.streamId, input);
      metrics.custom['partialsEmitted'] = (metrics.custom['partialsEmitted'] ?? 0) + 1;
    },
    async emitFinalTranscript(input) {
      emit('whisper-final-transcript', input.streamId, input);
      metrics.custom['finalsEmitted'] = (metrics.custom['finalsEmitted'] ?? 0) + 1;
    },
    async triggerVad(input) {
      emit('whisper-vad-triggered', input.streamId, input);
      if (input.type === 'start') {
        metrics.custom['vadStarts'] = (metrics.custom['vadStarts'] ?? 0) + 1;
      } else {
        metrics.custom['vadEnds'] = (metrics.custom['vadEnds'] ?? 0) + 1;
      }
    },
  };
}
