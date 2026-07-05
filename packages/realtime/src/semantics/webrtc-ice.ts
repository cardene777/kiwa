import {
  initialMetrics,
  type SemanticsEvent,
  type SemanticsMetrics,
  type SemanticsMock,
  type SemanticsMockConfig,
} from './types.js';

/**
 * WebRTC ICE axis — candidate gathering + connectivity check + TURN relay +
 * trickle ICE を mock 化する。
 *
 * 実 WebRTC 呼出形式 (`RTCPeerConnection.onicecandidate` +
 * `iceGatheringState` + `iceConnectionState`) は以下 ...
 *
 * ```ts
 * pc.oniceconnectionstatechange = () => {
 *   console.log(pc.iceConnectionState); // 'checking' → 'connected' → 'completed'
 * };
 * pc.onicecandidate = (ev) => { if (ev.candidate) sendToRemote(ev.candidate); };
 * // trickle ICE — candidate は gathering 中に順次送出、 gathering 終了まで待たない
 * ```
 *
 * 本 mock は上記 4 event (gathering / checking / connected / relay-used) と
 * trickle ICE (candidate を順次 emit)、 TURN relay 経路情報を再現する。
 */

export type IceGatheringState = 'new' | 'gathering' | 'complete';
export type IceConnectionState = 'new' | 'checking' | 'connected' | 'completed' | 'failed' | 'disconnected';

export interface IceStats {
  candidatesGathered: number;
  candidatesRemote: number;
  activeCandidatePairs: number;
  /** relay 経路経由 (TURN) が使われた回数。 */
  relayUsedCount: number;
  gatheringDurationMs: number;
}

export interface WebRtcIceMock extends SemanticsMock {
  readonly protocol: 'webrtc';
  readonly axis: 'webrtc-ice';
  readonly gatheringState: IceGatheringState;
  readonly connectionState: IceConnectionState;
  /** ICE gathering 開始 — n 件の local candidate を trickle 送出。 */
  startGathering(localCount: number): Promise<void>;
  /** remote candidate を追加。 */
  addRemoteCandidate(candidateId: string): Promise<void>;
  /** connectivity check 開始。 */
  startConnectivityCheck(): Promise<void>;
  /** TURN relay 経路を強制 (host / srflx 失敗時の fallback 用)。 */
  forceRelay(): Promise<void>;
  /** 統計取得。 */
  getIceStats(): IceStats;
}

export function createWebRtcIceMock(config: SemanticsMockConfig = {}): WebRtcIceMock {
  const latency = config.artificialLatencyMs ?? 1;
  const handlers = new Set<(event: SemanticsEvent) => void>();
  let metrics: SemanticsMetrics = initialMetrics();
  const startTime = Date.now();
  let order = 0;
  let gatheringState: IceGatheringState = 'new';
  let connectionState: IceConnectionState = 'new';
  let candidatesGathered = 0;
  let candidatesRemote = 0;
  let activeCandidatePairs = 0;
  let relayUsedCount = 0;
  let gatheringStart = 0;
  let gatheringDurationMs = 0;

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

  const mock: WebRtcIceMock = {
    protocol: 'webrtc',
    axis: 'webrtc-ice',
    get gatheringState() {
      return gatheringState;
    },
    get connectionState() {
      return connectionState;
    },
    async startGathering(localCount: number) {
      gatheringState = 'gathering';
      gatheringStart = Date.now();
      emit({
        kind: 'ice-gathering',
        payload: { state: 'gathering', localCount },
        order: order++,
        relativeTimeMs: Date.now() - startTime,
      });
      // trickle ICE — candidate を順次 emit
      for (let i = 0; i < localCount; i += 1) {
        await sleep(latency);
        candidatesGathered += 1;
      }
      gatheringState = 'complete';
      gatheringDurationMs = Date.now() - gatheringStart;
      metrics.custom.candidatesGathered = candidatesGathered;
      emit({
        kind: 'ice-gathering',
        payload: { state: 'complete', localCount },
        order: order++,
        relativeTimeMs: Date.now() - startTime,
      });
    },
    async addRemoteCandidate(candidateId: string) {
      await sleep(latency);
      candidatesRemote += 1;
      metrics.custom.candidatesRemote = candidatesRemote;
      emit({
        kind: 'ice-candidate',
        payload: { candidateId, remote: true },
        order: order++,
        relativeTimeMs: Date.now() - startTime,
      });
    },
    async startConnectivityCheck() {
      connectionState = 'checking';
      emit({
        kind: 'ice-checking',
        payload: { state: 'checking' },
        order: order++,
        relativeTimeMs: Date.now() - startTime,
      });
      await sleep(latency);
      // 最低 1 pair を成立させる (mock は relay 未使用時 direct pair 選択)
      activeCandidatePairs = Math.max(1, candidatesGathered * candidatesRemote > 0 ? 1 : 0);
      connectionState = 'connected';
      metrics.custom.activeCandidatePairs = activeCandidatePairs;
      emit({
        kind: 'ice-connected',
        payload: { state: 'connected', activeCandidatePairs },
        order: order++,
        relativeTimeMs: Date.now() - startTime,
      });
    },
    async forceRelay() {
      await sleep(latency);
      relayUsedCount += 1;
      metrics.custom.relayUsedCount = relayUsedCount;
      emit({
        kind: 'ice-relay-used',
        payload: { relayUsedCount },
        order: order++,
        relativeTimeMs: Date.now() - startTime,
      });
    },
    getIceStats() {
      return {
        candidatesGathered,
        candidatesRemote,
        activeCandidatePairs,
        relayUsedCount,
        gatheringDurationMs,
      };
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
      gatheringState = 'new';
      connectionState = 'new';
      candidatesGathered = 0;
      candidatesRemote = 0;
      activeCandidatePairs = 0;
      relayUsedCount = 0;
      gatheringDurationMs = 0;
    },
  };
  return mock;
}
