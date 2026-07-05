import {
  initialMetrics,
  type SemanticsEvent,
  type SemanticsMetrics,
  type SemanticsMock,
  type SemanticsMockConfig,
} from './types.js';

/**
 * WebTransport uni-directional axis — uni stream + Datagram + reset stream を
 * mock 化する。
 *
 * 実 WebTransport 呼出形式 (`WebTransport.createUnidirectionalStream` +
 * `datagrams.writable`) は以下 ...
 *
 * ```ts
 * const transport = new WebTransport('https://example.com/wt');
 * await transport.ready;
 * // uni stream
 * const stream = await transport.createUnidirectionalStream();
 * const writer = stream.getWriter();
 * await writer.write(new Uint8Array([1, 2, 3]));
 * writer.close();
 * // datagram
 * const dgramWriter = transport.datagrams.writable.getWriter();
 * await dgramWriter.write(new Uint8Array([9, 8, 7]));
 * ```
 *
 * 本 mock は上記 4 event (uni-stream-open / write / reset / datagram-recv) を
 * 再現する。 stream reset は abort() 相当。
 */

export interface UniStreamHandle {
  readonly id: string;
  readonly state: 'open' | 'reset' | 'closed';
  write(data: Uint8Array): Promise<void>;
  close(): Promise<void>;
  /** stream を強制 reset (WebTransport writer.abort() 相当)。 */
  reset(errorCode: number): Promise<void>;
}

export interface WebTransportUniMock extends SemanticsMock {
  readonly protocol: 'webtransport';
  readonly axis: 'webtransport-uni';
  createUniStream(): Promise<UniStreamHandle>;
  sendDatagram(data: Uint8Array): Promise<void>;
}

export function createWebTransportUniMock(
  config: SemanticsMockConfig = {},
): WebTransportUniMock {
  const latency = config.artificialLatencyMs ?? 1;
  const handlers = new Set<(event: SemanticsEvent) => void>();
  let metrics: SemanticsMetrics = initialMetrics();
  const startTime = Date.now();
  let order = 0;
  let streamSeq = 0;
  const streams = new Map<string, UniStreamHandle>();

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

  const createUniStream = async (): Promise<UniStreamHandle> => {
    await sleep(latency);
    const id = `uni-${streamSeq++}`;
    let state: UniStreamHandle['state'] = 'open';
    metrics.streamsOpened += 1;
    emit({
      kind: 'uni-stream-open',
      streamId: id,
      payload: { direction: 'uni' },
      order: order++,
      relativeTimeMs: Date.now() - startTime,
    });
    const handle: UniStreamHandle = {
      id,
      get state() {
        return state;
      },
      async write(data: Uint8Array) {
        if (state !== 'open') {
          throw new Error(`uni stream not open (state=${state})`);
        }
        await sleep(latency);
        emit({
          kind: 'uni-stream-write',
          streamId: id,
          payload: { byteLength: data.byteLength },
          order: order++,
          relativeTimeMs: Date.now() - startTime,
        });
      },
      async close() {
        if (state !== 'open') return;
        state = 'closed';
        metrics.streamsClosed += 1;
      },
      async reset(errorCode: number) {
        if (state === 'reset') return;
        state = 'reset';
        metrics.streamsReset += 1;
        emit({
          kind: 'uni-stream-reset',
          streamId: id,
          payload: { errorCode },
          order: order++,
          relativeTimeMs: Date.now() - startTime,
        });
      },
    };
    streams.set(id, handle);
    return handle;
  };

  const mock: WebTransportUniMock = {
    protocol: 'webtransport',
    axis: 'webtransport-uni',
    createUniStream,
    async sendDatagram(data: Uint8Array) {
      await sleep(latency);
      metrics.custom.datagramsSent = (metrics.custom.datagramsSent ?? 0) + 1;
      emit({
        kind: 'datagram-recv',
        payload: { byteLength: data.byteLength },
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
      streamSeq = 0;
      streams.clear();
    },
  };
  return mock;
}
