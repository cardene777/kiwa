import {
  initialMetrics,
  type SemanticsEvent,
  type SemanticsMetrics,
  type SemanticsMock,
  type SemanticsMockConfig,
} from './types.js';

/**
 * Simulcast + SVC axis — Simulcast (複数解像度 stream) + Scalable Video
 * Coding (temporal / spatial / quality layer) + adaptive bitrate + layer
 * drop policy。 WebRTC v1 / v2 と MoQ 両方で採用される layered delivery
 * pattern。
 */

export interface SimulcastSvcLayer {
  layerId: string;
  resolution: string;
  bitrateKbps: number;
  scalabilityMode: 'L1T1' | 'L1T2' | 'L1T3' | 'L2T1' | 'L2T3' | 'L3T3';
}

export interface SimulcastSvcMock extends SemanticsMock {
  readonly protocol: 'webcodecs';
  readonly axis: 'simulcast-svc';
  addSimulcastLayer(input: SimulcastSvcLayer): Promise<void>;
  selectSvcLayer(input: { layerId: string; temporalId: number; spatialId: number }): Promise<void>;
  adaptBitrate(input: { layerId: string; targetKbps: number; reason: string }): Promise<void>;
  dropLayer(input: { layerId: string; reason: string }): Promise<void>;
}

export function createSimulcastSvcMock(config: SemanticsMockConfig = {}): SimulcastSvcMock {
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
    axis: 'simulcast-svc',
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
    async addSimulcastLayer(input) {
      emit('simulcast-layer-added', input.layerId, input);
      metrics.custom['layersAdded'] = (metrics.custom['layersAdded'] ?? 0) + 1;
    },
    async selectSvcLayer(input) {
      emit('svc-layer-selected', input.layerId, input);
      metrics.custom['layersSelected'] = (metrics.custom['layersSelected'] ?? 0) + 1;
    },
    async adaptBitrate(input) {
      emit('bitrate-adapted', input.layerId, input);
      metrics.custom['bitrateAdaptations'] = (metrics.custom['bitrateAdaptations'] ?? 0) + 1;
    },
    async dropLayer(input) {
      emit('layer-dropped', input.layerId, input);
      metrics.custom['layersDropped'] = (metrics.custom['layersDropped'] ?? 0) + 1;
    },
  };
}
