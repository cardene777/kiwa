import {
  initialMetrics,
  type SemanticsEvent,
  type SemanticsMetrics,
  type SemanticsMock,
  type SemanticsMockConfig,
} from './types.js';

/**
 * Media over QUIC / MOQT axis — track announce + subscribe + object delivery.
 * MOQT (draft-ietf-moq-transport) は QUIC 上の pub/sub media transport で、
 * publisher が track を announce → subscriber が subscribe → object を
 * 送受信する pattern。 本 mock は 4 event (announce / subscribe / object-sent
 * / object-received) を deterministic seed で emit。
 */

export interface MoqAnnouncement {
  trackName: string;
  namespace: string;
  authInfo: string;
}

export interface MoqObject {
  trackName: string;
  groupId: number;
  objectId: number;
  payloadBytes: number;
}

export interface MoqFetchMock extends SemanticsMock {
  readonly protocol: 'moqt';
  readonly axis: 'moq-fetch';
  announceTrack(input: MoqAnnouncement): Promise<void>;
  subscribeTrack(input: { trackName: string; namespace: string }): Promise<void>;
  sendObject(input: MoqObject): Promise<void>;
  receiveObject(input: MoqObject): Promise<void>;
}

export function createMoqFetchMock(config: SemanticsMockConfig = {}): MoqFetchMock {
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
    axis: 'moq-fetch',
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
    async announceTrack(input) {
      emit('moq-track-announce', input.trackName, input);
      metrics.custom['tracksAnnounced'] = (metrics.custom['tracksAnnounced'] ?? 0) + 1;
    },
    async subscribeTrack(input) {
      emit('moq-track-subscribe', input.trackName, input);
      metrics.custom['tracksSubscribed'] = (metrics.custom['tracksSubscribed'] ?? 0) + 1;
    },
    async sendObject(input) {
      emit('moq-object-sent', input.trackName, input);
      metrics.custom['objectsSent'] = (metrics.custom['objectsSent'] ?? 0) + 1;
      metrics.custom['bytesSent'] = (metrics.custom['bytesSent'] ?? 0) + input.payloadBytes;
    },
    async receiveObject(input) {
      emit('moq-object-received', input.trackName, input);
      metrics.custom['objectsReceived'] = (metrics.custom['objectsReceived'] ?? 0) + 1;
      metrics.custom['bytesReceived'] = (metrics.custom['bytesReceived'] ?? 0) + input.payloadBytes;
    },
  };
}
