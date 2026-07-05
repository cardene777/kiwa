import {
  initialMetrics,
  type SemanticsEvent,
  type SemanticsMetrics,
  type SemanticsMock,
  type SemanticsMockConfig,
} from './types.js';

/**
 * WebRTC track axis — getUserMedia mock + MediaStream + track add/remove +
 * simulcast layer を mock 化する。
 *
 * 実 WebRTC 呼出形式 (`getUserMedia` + `RTCPeerConnection.addTrack`) は以下 ...
 *
 * ```ts
 * const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
 * for (const track of stream.getTracks()) {
 *   const sender = pc.addTrack(track, stream);
 *   sender.setParameters({ encodings: [
 *     { rid: 'low', maxBitrate: 100000 },
 *     { rid: 'med', maxBitrate: 300000 },
 *     { rid: 'high', maxBitrate: 900000 },
 *   ]});
 * }
 * track.enabled = false; // mute
 * ```
 *
 * 本 mock は上記 4 event (track-add / track-remove / track-mute / track-unmute)
 * と simulcast layer 情報を deterministic に再現する。
 */

export type TrackKind = 'audio' | 'video';

export interface MediaTrack {
  readonly id: string;
  readonly kind: TrackKind;
  readonly label: string;
  enabled: boolean;
  /** simulcast layer 定義 (video のみ、 audio は空)。 */
  readonly simulcastLayers: SimulcastLayer[];
}

export interface SimulcastLayer {
  rid: 'low' | 'med' | 'high';
  maxBitrate: number;
  scaleResolutionDownBy: number;
}

export interface MediaStream {
  readonly id: string;
  readonly tracks: MediaTrack[];
}

export interface WebRtcTrackMock extends SemanticsMock {
  readonly protocol: 'webrtc';
  readonly axis: 'webrtc-track';
  /** getUserMedia 相当 — audio / video track を含む stream を生成。 */
  getUserMedia(constraints?: { audio?: boolean; video?: boolean }): Promise<MediaStream>;
  /** track 追加 — sender 相当の handle を返す。 */
  addTrack(track: MediaTrack, stream: MediaStream): Promise<{ trackId: string }>;
  /** track 削除。 */
  removeTrack(trackId: string): Promise<void>;
  /** track mute (enabled=false 相当)。 */
  muteTrack(trackId: string): Promise<void>;
  /** track unmute。 */
  unmuteTrack(trackId: string): Promise<void>;
}

export function createWebRtcTrackMock(config: SemanticsMockConfig = {}): WebRtcTrackMock {
  const latency = config.artificialLatencyMs ?? 1;
  const handlers = new Set<(event: SemanticsEvent) => void>();
  let metrics: SemanticsMetrics = initialMetrics();
  const startTime = Date.now();
  let order = 0;
  let trackSeq = 0;
  let streamSeq = 0;
  const senderMap = new Map<string, { track: MediaTrack; streamId: string }>();

  const emit = (event: SemanticsEvent) => {
    metrics.eventsEmitted += 1;
    for (const h of handlers) {
      try {
        h(event);
      } catch {
        // ignore
      }
    }
  };

  const sleep = (ms: number): Promise<void> => {
    if (ms <= 0) return Promise.resolve();
    return new Promise((r) => setTimeout(r, ms));
  };

  const buildSimulcastLayers = (): SimulcastLayer[] => [
    { rid: 'low', maxBitrate: 100000, scaleResolutionDownBy: 4 },
    { rid: 'med', maxBitrate: 300000, scaleResolutionDownBy: 2 },
    { rid: 'high', maxBitrate: 900000, scaleResolutionDownBy: 1 },
  ];

  const buildTrack = (kind: TrackKind): MediaTrack => {
    const id = `track-${trackSeq++}`;
    return {
      id,
      kind,
      label: kind === 'video' ? 'Camera 0' : 'Microphone 0',
      enabled: true,
      simulcastLayers: kind === 'video' ? buildSimulcastLayers() : [],
    };
  };

  const mock: WebRtcTrackMock = {
    protocol: 'webrtc',
    axis: 'webrtc-track',
    async getUserMedia(constraints = { audio: true, video: true }) {
      await sleep(latency);
      const tracks: MediaTrack[] = [];
      if (constraints.audio) tracks.push(buildTrack('audio'));
      if (constraints.video) tracks.push(buildTrack('video'));
      const stream: MediaStream = {
        id: `stream-${streamSeq++}`,
        tracks,
      };
      metrics.custom.streams = (metrics.custom.streams ?? 0) + 1;
      return stream;
    },
    async addTrack(track: MediaTrack, stream: MediaStream) {
      await sleep(latency);
      senderMap.set(track.id, { track, streamId: stream.id });
      metrics.streamsOpened += 1;
      metrics.custom.tracksAdded = (metrics.custom.tracksAdded ?? 0) + 1;
      emit({
        kind: 'track-add',
        streamId: track.id,
        payload: {
          streamId: stream.id,
          kind: track.kind,
          simulcastLayers: track.simulcastLayers,
        },
        order: order++,
        relativeTimeMs: Date.now() - startTime,
      });
      return { trackId: track.id };
    },
    async removeTrack(trackId: string) {
      await sleep(latency);
      const sender = senderMap.get(trackId);
      if (!sender) return;
      senderMap.delete(trackId);
      metrics.streamsClosed += 1;
      metrics.custom.tracksRemoved = (metrics.custom.tracksRemoved ?? 0) + 1;
      emit({
        kind: 'track-remove',
        streamId: trackId,
        payload: { streamId: sender.streamId, kind: sender.track.kind },
        order: order++,
        relativeTimeMs: Date.now() - startTime,
      });
    },
    async muteTrack(trackId: string) {
      await sleep(latency);
      const sender = senderMap.get(trackId);
      if (!sender) return;
      sender.track.enabled = false;
      metrics.custom.mutes = (metrics.custom.mutes ?? 0) + 1;
      emit({
        kind: 'track-mute',
        streamId: trackId,
        payload: { kind: sender.track.kind },
        order: order++,
        relativeTimeMs: Date.now() - startTime,
      });
    },
    async unmuteTrack(trackId: string) {
      await sleep(latency);
      const sender = senderMap.get(trackId);
      if (!sender) return;
      sender.track.enabled = true;
      metrics.custom.unmutes = (metrics.custom.unmutes ?? 0) + 1;
      emit({
        kind: 'track-unmute',
        streamId: trackId,
        payload: { kind: sender.track.kind },
        order: order++,
        relativeTimeMs: Date.now() - startTime,
      });
    },
    onEvent(handler) {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
    getMetrics() {
      return {
        ...metrics,
        custom: { ...metrics.custom },
      };
    },
    reset() {
      metrics = initialMetrics();
      order = 0;
      trackSeq = 0;
      streamSeq = 0;
      senderMap.clear();
    },
  };
  return mock;
}
