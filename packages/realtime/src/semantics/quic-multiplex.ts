import {
  initialMetrics,
  type SemanticsEvent,
  type SemanticsMetrics,
  type SemanticsMock,
  type SemanticsMockConfig,
} from './types.js';

/**
 * QUIC multiplex axis — stream multiplex + stream priority + HPACK dynamic
 * table + 0-RTT を mock 化する。
 *
 * 実 QUIC (HTTP/3 下層) 呼出形式 (aioquic / quiche / ngtcp2 相当) は以下 ...
 *
 * ```ts
 * // client 側 (aioquic 相当の JS 表現)
 * const conn = new QuicConnection({ enable0RTT: true });
 * await conn.handshake();
 * const stream1 = conn.openStream({ priority: 3 });
 * const stream2 = conn.openStream({ priority: 5 });
 * // HPACK dynamic table 更新
 * conn.hpack.insertHeader('content-type', 'application/json');
 * ```
 *
 * 本 mock は上記 4 event (stream-open / stream-close / hpack-insert /
 * zero-rtt-used) と stream priority (低い数字が高優先) を再現する。
 */

export interface QuicStreamOptions {
  /** priority (0=最高、 255=最低、 default 128)。 */
  priority?: number;
}

export interface QuicStreamHandle {
  readonly id: string;
  readonly priority: number;
  readonly state: 'open' | 'closed';
  close(): Promise<void>;
}

export interface HpackEntry {
  name: string;
  value: string;
  /** 挿入順 (dynamic table index)。 */
  index: number;
}

export interface QuicMultiplexMock extends SemanticsMock {
  readonly protocol: 'http3-quic';
  readonly axis: 'quic-multiplex';
  readonly zeroRttEnabled: boolean;
  readonly hpackTableSize: number;
  openStream(options?: QuicStreamOptions): Promise<QuicStreamHandle>;
  insertHpackHeader(name: string, value: string): Promise<HpackEntry>;
  /** 0-RTT で resume (以前の session ticket があると想定)。 */
  resumeWithZeroRtt(): Promise<void>;
  /** 現在 open な stream を priority 順に返す (低い値 = 高優先)。 */
  getActiveStreams(): QuicStreamHandle[];
}

export function createQuicMultiplexMock(
  config: SemanticsMockConfig & { enable0RTT?: boolean } = {},
): QuicMultiplexMock {
  const latency = config.artificialLatencyMs ?? 1;
  const handlers = new Set<(event: SemanticsEvent) => void>();
  let metrics: SemanticsMetrics = initialMetrics();
  const startTime = Date.now();
  let order = 0;
  let streamSeq = 0;
  let hpackIndex = 0;
  const zeroRttEnabled = config.enable0RTT ?? false;
  const activeStreams = new Map<string, QuicStreamHandle>();
  const hpackTable: HpackEntry[] = [];

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

  const openStream = async (
    options: QuicStreamOptions = {},
  ): Promise<QuicStreamHandle> => {
    await sleep(latency);
    const id = `qs-${streamSeq++}`;
    const priority = options.priority ?? 128;
    let state: QuicStreamHandle['state'] = 'open';
    metrics.streamsOpened += 1;
    emit({
      kind: 'stream-open',
      streamId: id,
      payload: { priority },
      order: order++,
      relativeTimeMs: Date.now() - startTime,
    });

    const handle: QuicStreamHandle = {
      id,
      priority,
      get state() {
        return state;
      },
      async close() {
        if (state === 'closed') return;
        state = 'closed';
        activeStreams.delete(id);
        metrics.streamsClosed += 1;
        emit({
          kind: 'stream-close',
          streamId: id,
          payload: { priority },
          order: order++,
          relativeTimeMs: Date.now() - startTime,
        });
      },
    };
    activeStreams.set(id, handle);
    return handle;
  };

  const mock: QuicMultiplexMock = {
    protocol: 'http3-quic',
    axis: 'quic-multiplex',
    zeroRttEnabled,
    get hpackTableSize() {
      return hpackTable.length;
    },
    openStream,
    async insertHpackHeader(name: string, value: string) {
      await sleep(latency);
      const entry: HpackEntry = { name, value, index: hpackIndex++ };
      hpackTable.push(entry);
      metrics.custom.hpackInserts = (metrics.custom.hpackInserts ?? 0) + 1;
      emit({
        kind: 'hpack-insert',
        payload: { name, value, index: entry.index },
        order: order++,
        relativeTimeMs: Date.now() - startTime,
      });
      return entry;
    },
    async resumeWithZeroRtt() {
      if (!zeroRttEnabled) {
        throw new Error('0-RTT is not enabled for this connection');
      }
      await sleep(latency);
      metrics.custom.zeroRttResumes = (metrics.custom.zeroRttResumes ?? 0) + 1;
      emit({
        kind: 'zero-rtt-used',
        payload: { enable0RTT: true },
        order: order++,
        relativeTimeMs: Date.now() - startTime,
      });
    },
    getActiveStreams() {
      return Array.from(activeStreams.values()).sort((a, b) => a.priority - b.priority);
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
      streamSeq = 0;
      hpackIndex = 0;
      activeStreams.clear();
      hpackTable.length = 0;
    },
  };
  return mock;
}
