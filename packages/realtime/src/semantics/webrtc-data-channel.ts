import {
  initialMetrics,
  type SemanticsEvent,
  type SemanticsMetrics,
  type SemanticsMock,
  type SemanticsMockConfig,
} from './types.js';

/**
 * WebRTC data channel axis — ordered / unordered + reliable / unreliable +
 * maxRetransmits + binaryType (arraybuffer / blob) を mock 化する。
 *
 * 実 WebRTC 呼出形式 (`RTCPeerConnection.createDataChannel`) は以下 ...
 *
 * ```ts
 * const dc = pc.createDataChannel('chat', {
 *   ordered: true,
 *   maxRetransmits: 3,
 *   maxPacketLifeTime: null,
 * });
 * dc.binaryType = 'arraybuffer';
 * dc.onopen = () => dc.send('hello');
 * dc.onmessage = (ev) => console.log(ev.data);
 * dc.onclose = () => cleanup();
 * ```
 *
 * 本 mock は上記 4 lifecycle event (open / message / close / error) と
 * ordered / maxRetransmits 挙動を deterministic に再現する。
 */

export interface DataChannelOptions {
  /** default true — 順序保証。 */
  ordered?: boolean;
  /** unordered 時の最大 retransmit 回数 (default 0)。 */
  maxRetransmits?: number;
  /** binary type — arraybuffer / blob (default arraybuffer)。 */
  binaryType?: 'arraybuffer' | 'blob';
  /** label (mock は識別子のみ、 SDK では channel 名として使う)。 */
  label?: string;
}

export interface DataChannelHandle {
  readonly id: string;
  readonly label: string;
  readonly options: Required<DataChannelOptions>;
  readonly readyState: 'connecting' | 'open' | 'closing' | 'closed';
  send(data: string | ArrayBuffer): Promise<void>;
  close(): Promise<void>;
}

export interface WebRtcDataChannelMock extends SemanticsMock {
  readonly protocol: 'webrtc';
  readonly axis: 'webrtc-data-channel';
  createDataChannel(options?: DataChannelOptions): DataChannelHandle;
}

export function createWebRtcDataChannelMock(
  config: SemanticsMockConfig = {},
): WebRtcDataChannelMock {
  const latency = config.artificialLatencyMs ?? 1;
  const handlers = new Set<(event: SemanticsEvent) => void>();
  let metrics: SemanticsMetrics = initialMetrics();
  const startTime = Date.now();
  let order = 0;
  let channelSeq = 0;
  let seed = config.seed ?? 1;

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

  const nextRandom = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  const createDataChannel = (opts: DataChannelOptions = {}): DataChannelHandle => {
    const resolved: Required<DataChannelOptions> = {
      ordered: opts.ordered ?? true,
      maxRetransmits: opts.maxRetransmits ?? 0,
      binaryType: opts.binaryType ?? 'arraybuffer',
      label: opts.label ?? `dc-${channelSeq}`,
    };
    const id = `dc-${channelSeq++}`;
    let state: DataChannelHandle['readyState'] = 'connecting';
    let sendSeq = 0;

    // 非同期 open — real SDK と同様、 constructor 直後は connecting
    setTimeout(() => {
      state = 'open';
      metrics.streamsOpened += 1;
      emit({
        kind: 'data-open',
        streamId: id,
        payload: { label: resolved.label, options: resolved },
        order: order++,
        relativeTimeMs: Date.now() - startTime,
      });
    }, latency);

    const handle: DataChannelHandle = {
      id,
      label: resolved.label,
      options: resolved,
      get readyState() {
        return state;
      },
      async send(data: string | ArrayBuffer) {
        if (state !== 'open') {
          throw new Error(`data channel not open (state=${state})`);
        }
        await sleep(latency);
        // unordered + maxRetransmits > 0 で確率的 drop を再現
        if (!resolved.ordered && resolved.maxRetransmits > 0) {
          const dropChance = 1 / (resolved.maxRetransmits + 2);
          if (nextRandom() < dropChance) {
            metrics.custom.drops = (metrics.custom.drops ?? 0) + 1;
            // drop でも event は emit する (real WebRTC は send 側から観測できないが、
            // mock は fidelity 計測のため drop 事実を記録)
            emit({
              kind: 'data-message',
              streamId: id,
              payload: { seq: sendSeq++, dropped: true, data },
              order: order++,
              relativeTimeMs: Date.now() - startTime,
            });
            return;
          }
        }
        emit({
          kind: 'data-message',
          streamId: id,
          payload: { seq: sendSeq++, dropped: false, data, binaryType: resolved.binaryType },
          order: order++,
          relativeTimeMs: Date.now() - startTime,
        });
      },
      async close() {
        if (state === 'closed') return;
        state = 'closing';
        await sleep(latency);
        state = 'closed';
        metrics.streamsClosed += 1;
        emit({
          kind: 'data-close',
          streamId: id,
          payload: { label: resolved.label },
          order: order++,
          relativeTimeMs: Date.now() - startTime,
        });
      },
    };
    return handle;
  };

  const mock: WebRtcDataChannelMock = {
    protocol: 'webrtc',
    axis: 'webrtc-data-channel',
    createDataChannel,
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
      channelSeq = 0;
      seed = config.seed ?? 1;
    },
  };
  return mock;
}
