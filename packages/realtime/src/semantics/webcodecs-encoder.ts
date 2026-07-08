import {
  initialMetrics,
  type SemanticsEvent,
  type SemanticsMetrics,
  type SemanticsMock,
  type SemanticsMockConfig,
} from './types.js';

/**
 * WebCodecs encoder axis — VideoEncoder / AudioEncoder direct API + hardware
 * acceleration hints. Chrome / Safari / Firefox の WebCodecs 実装は codec
 * config → frame encode → keyframe force → hardware fallback path を持つ。
 */

export interface EncoderConfig {
  codec: 'H264' | 'VP9' | 'AV1' | 'Opus' | 'AAC';
  width: number;
  height: number;
  bitrate: number;
  hardwareAcceleration: 'prefer-hardware' | 'prefer-software' | 'no-preference';
}

export interface EncodedFrame {
  encoderId: string;
  frameNumber: number;
  type: 'key' | 'delta';
  byteLength: number;
}

export interface WebCodecsEncoderMock extends SemanticsMock {
  readonly protocol: 'webcodecs';
  readonly axis: 'webcodecs-encoder';
  configure(input: { encoderId: string; config: EncoderConfig }): Promise<void>;
  encodeFrame(input: { encoderId: string; frameNumber: number; byteLength: number }): Promise<void>;
  forceKeyframe(input: { encoderId: string; frameNumber: number }): Promise<void>;
  reportHardwareUsed(input: { encoderId: string; hardware: boolean }): Promise<void>;
}

export function createWebCodecsEncoderMock(config: SemanticsMockConfig = {}): WebCodecsEncoderMock {
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
    protocol: 'webcodecs',
    axis: 'webcodecs-encoder',
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
    async configure(input) {
      emit('encoder-config-set', input.encoderId, input);
      metrics.custom['configsSet'] = (metrics.custom['configsSet'] ?? 0) + 1;
    },
    async encodeFrame(input) {
      emit('encoder-frame-encoded', input.encoderId, input);
      metrics.custom['framesEncoded'] = (metrics.custom['framesEncoded'] ?? 0) + 1;
      metrics.custom['bytesEncoded'] = (metrics.custom['bytesEncoded'] ?? 0) + input.byteLength;
    },
    async forceKeyframe(input) {
      emit('encoder-keyframe-forced', input.encoderId, input);
      metrics.custom['keyframesForced'] = (metrics.custom['keyframesForced'] ?? 0) + 1;
    },
    async reportHardwareUsed(input) {
      emit('encoder-hardware-used', input.encoderId, input);
      if (input.hardware) {
        metrics.custom['hardwarePath'] = (metrics.custom['hardwarePath'] ?? 0) + 1;
      } else {
        metrics.custom['softwarePath'] = (metrics.custom['softwarePath'] ?? 0) + 1;
      }
    },
  };
}
