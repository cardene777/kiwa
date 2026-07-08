import {
  initialMetrics,
  type SemanticsEvent,
  type SemanticsMetrics,
  type SemanticsMock,
  type SemanticsMockConfig,
} from './types.js';

/**
 * WebCodecs decoder axis — VideoDecoder / AudioDecoder + frame buffer +
 * reorder + drop policy. B-frame や out-of-order 到着に対応する reorder
 * buffer + latency budget 超過時の drop path を含む。
 */

export interface DecoderConfig {
  codec: 'H264' | 'VP9' | 'AV1' | 'Opus' | 'AAC';
  description?: string;
}

export interface WebCodecsDecoderMock extends SemanticsMock {
  readonly protocol: 'webcodecs';
  readonly axis: 'webcodecs-decoder';
  configure(input: { decoderId: string; config: DecoderConfig }): Promise<void>;
  decodeFrame(input: { decoderId: string; frameNumber: number; type: 'key' | 'delta' }): Promise<void>;
  reorderFrame(input: { decoderId: string; frameNumber: number; delayMs: number }): Promise<void>;
  dropFrame(input: { decoderId: string; frameNumber: number; reason: string }): Promise<void>;
}

export function createWebCodecsDecoderMock(config: SemanticsMockConfig = {}): WebCodecsDecoderMock {
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
    axis: 'webcodecs-decoder',
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
      emit('decoder-config-set', input.decoderId, input);
      metrics.custom['configsSet'] = (metrics.custom['configsSet'] ?? 0) + 1;
    },
    async decodeFrame(input) {
      emit('decoder-frame-decoded', input.decoderId, input);
      metrics.custom['framesDecoded'] = (metrics.custom['framesDecoded'] ?? 0) + 1;
      if (input.type === 'key') {
        metrics.custom['keyframesDecoded'] = (metrics.custom['keyframesDecoded'] ?? 0) + 1;
      }
    },
    async reorderFrame(input) {
      emit('decoder-frame-reordered', input.decoderId, input);
      metrics.custom['framesReordered'] = (metrics.custom['framesReordered'] ?? 0) + 1;
      metrics.custom['maxReorderDelayMs'] = Math.max(
        metrics.custom['maxReorderDelayMs'] ?? 0,
        input.delayMs,
      );
    },
    async dropFrame(input) {
      emit('decoder-frame-dropped', input.decoderId, input);
      metrics.custom['framesDropped'] = (metrics.custom['framesDropped'] ?? 0) + 1;
    },
  };
}
