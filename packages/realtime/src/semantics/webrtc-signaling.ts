import {
  initialMetrics,
  type SemanticsEvent,
  type SemanticsMetrics,
  type SemanticsMock,
  type SemanticsMockConfig,
} from './types.js';

/**
 * WebRTC signaling axis — offer / answer + SDP negotiation + ICE candidate
 * exchange + renegotiation を mock 化する。
 *
 * 実 WebRTC 呼出形式 (SDK 非依存な `RTCPeerConnection` 相当) は以下 ...
 *
 * ```ts
 * const pc = new RTCPeerConnection();
 * const offer = await pc.createOffer();
 * await pc.setLocalDescription(offer);
 * // signal 経由で remote に offer 送信
 * const answer = await remote.createAnswer(offer);
 * await pc.setRemoteDescription(answer);
 * pc.onicecandidate = (ev) => sendToRemote(ev.candidate);
 * // 通信中 track 追加時に renegotiation
 * ```
 *
 * 本 mock は上記 5 event (offer / answer / ice-candidate × N / renegotiation)
 * を deterministic seed で生成する。 real SDK は import せず shape 互換のみ。
 */

/** signaling 1 セッション分の SDP 情報 (mock 用の簡略化された JSON payload)。 */
export interface SignalingSdp {
  type: 'offer' | 'answer';
  /** SDP 本文 (mock は fingerprint hash + 属性列のみ、 完全な SDP 文字列ではない)。 */
  fingerprint: string;
  /** media section 数 (audio / video / data 3 section を default とする)。 */
  mediaSections: number;
  /** BUNDLE / RTCP-mux フラグ (mock では always true)。 */
  bundleEnabled: boolean;
}

/** ICE candidate 1 件 (mock は host / srflx / relay を type 別に配布)。 */
export interface IceCandidate {
  type: 'host' | 'srflx' | 'prflx' | 'relay';
  /** candidate protocol (udp / tcp、 mock は udp default)。 */
  protocol: 'udp' | 'tcp';
  /** priority (RFC 5245 準拠の値域、 0 〜 2^32-1)。 */
  priority: number;
  /** candidate string の識別子 (RTCIceCandidate.candidate 相当)。 */
  candidate: string;
}

export interface WebRtcSignalingMock extends SemanticsMock {
  readonly protocol: 'webrtc';
  readonly axis: 'webrtc-signaling';
  /** 新規セッション開始 → offer 生成 + emit。 */
  createOffer(): Promise<SignalingSdp>;
  /** offer 受信 → answer 生成 + emit。 */
  createAnswer(offer: SignalingSdp): Promise<SignalingSdp>;
  /** ICE candidate を n 件 trickle 送出。 */
  emitIceCandidates(count: number): Promise<IceCandidate[]>;
  /** track 追加時の renegotiation 発火。 */
  renegotiate(): Promise<SignalingSdp>;
}

export function createWebRtcSignalingMock(
  config: SemanticsMockConfig = {},
): WebRtcSignalingMock {
  const latency = config.artificialLatencyMs ?? 1;
  let seed = config.seed ?? 1;
  const handlers = new Set<(event: SemanticsEvent) => void>();
  let metrics: SemanticsMetrics = initialMetrics();
  const startTime = Date.now();
  let order = 0;
  let offerCount = 0;
  let answerCount = 0;
  let candidateCount = 0;
  let renegotiationCount = 0;

  const emit = (event: SemanticsEvent) => {
    metrics.eventsEmitted += 1;
    for (const h of handlers) {
      try {
        h(event);
      } catch {
        // 他 handler を止めない
      }
    }
  };

  const nextSeed = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed;
  };

  const sleep = (ms: number): Promise<void> => {
    if (ms <= 0) return Promise.resolve();
    return new Promise((r) => setTimeout(r, ms));
  };

  const buildSdp = (type: 'offer' | 'answer'): SignalingSdp => ({
    type,
    fingerprint: `sha256:${nextSeed().toString(16)}`,
    mediaSections: 3,
    bundleEnabled: true,
  });

  const buildCandidate = (index: number): IceCandidate => {
    const kinds: IceCandidate['type'][] = ['host', 'srflx', 'relay'];
    return {
      type: kinds[index % kinds.length]!,
      protocol: 'udp',
      priority: 2113667327 - index * 100,
      candidate: `candidate:${nextSeed().toString(16)} 1 udp ${2113667327 - index * 100} 10.0.0.${index % 255} 5000${index} typ ${kinds[index % kinds.length]}`,
    };
  };

  const mock: WebRtcSignalingMock = {
    protocol: 'webrtc',
    axis: 'webrtc-signaling',
    async createOffer() {
      await sleep(latency);
      const sdp = buildSdp('offer');
      offerCount += 1;
      metrics.custom.offers = offerCount;
      emit({
        kind: 'offer',
        payload: sdp,
        order: order++,
        relativeTimeMs: Date.now() - startTime,
      });
      return sdp;
    },
    async createAnswer(_offer: SignalingSdp) {
      await sleep(latency);
      const sdp = buildSdp('answer');
      answerCount += 1;
      metrics.custom.answers = answerCount;
      emit({
        kind: 'answer',
        payload: sdp,
        order: order++,
        relativeTimeMs: Date.now() - startTime,
      });
      return sdp;
    },
    async emitIceCandidates(count: number) {
      const list: IceCandidate[] = [];
      for (let i = 0; i < count; i += 1) {
        await sleep(latency);
        const cand = buildCandidate(candidateCount);
        candidateCount += 1;
        list.push(cand);
        metrics.custom.iceCandidates = candidateCount;
        emit({
          kind: 'ice-candidate',
          payload: cand,
          order: order++,
          relativeTimeMs: Date.now() - startTime,
        });
      }
      return list;
    },
    async renegotiate() {
      await sleep(latency);
      const sdp = buildSdp('offer');
      renegotiationCount += 1;
      metrics.custom.renegotiations = renegotiationCount;
      emit({
        kind: 'renegotiation',
        payload: sdp,
        order: order++,
        relativeTimeMs: Date.now() - startTime,
      });
      return sdp;
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
      offerCount = 0;
      answerCount = 0;
      candidateCount = 0;
      renegotiationCount = 0;
      seed = config.seed ?? 1;
    },
  };
  return mock;
}
