import {
  initialMetrics,
  type SemanticsEvent,
  type SemanticsMetrics,
  type SemanticsMock,
  type SemanticsMockConfig,
} from './types.js';

/**
 * MoQ datagram media axis — partial reliability + priority + FEC recovery.
 * MOQT の datagram delivery mode は QUIC datagram frame を使い、 packet
 * drop を許容する pattern。 Forward Error Correction (FEC) で失われた
 * datagram を再構成する path も含む。
 */

export interface MoqDatagram {
  trackName: string;
  sequenceNumber: number;
  payloadBytes: number;
  priority: number;
}

export interface MoqDatagramMediaMock extends SemanticsMock {
  readonly protocol: 'moqt';
  readonly axis: 'moq-datagram-media';
  sendDatagram(input: MoqDatagram): Promise<void>;
  dropDatagram(input: { trackName: string; sequenceNumber: number }): Promise<void>;
  setPriority(input: { trackName: string; priority: number }): Promise<void>;
  recoverFec(input: { trackName: string; recoveredCount: number }): Promise<void>;
}

export function createMoqDatagramMediaMock(config: SemanticsMockConfig = {}): MoqDatagramMediaMock {
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
    protocol: 'moqt',
    axis: 'moq-datagram-media',
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
    async sendDatagram(input) {
      emit('moq-datagram-sent', input.trackName, input);
      metrics.custom['datagramsSent'] = (metrics.custom['datagramsSent'] ?? 0) + 1;
      metrics.custom['bytesSent'] = (metrics.custom['bytesSent'] ?? 0) + input.payloadBytes;
    },
    async dropDatagram(input) {
      emit('moq-datagram-dropped', input.trackName, input);
      metrics.custom['datagramsDropped'] = (metrics.custom['datagramsDropped'] ?? 0) + 1;
    },
    async setPriority(input) {
      emit('moq-priority-set', input.trackName, input);
      metrics.custom['prioritySets'] = (metrics.custom['prioritySets'] ?? 0) + 1;
    },
    async recoverFec(input) {
      emit('moq-fec-recovered', input.trackName, input);
      metrics.custom['fecRecovered'] =
        (metrics.custom['fecRecovered'] ?? 0) + input.recoveredCount;
    },
  };
}
