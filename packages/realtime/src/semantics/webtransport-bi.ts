import {
  initialMetrics,
  type SemanticsEvent,
  type SemanticsMetrics,
  type SemanticsMock,
  type SemanticsMockConfig,
} from './types.js';

/**
 * WebTransport bi-directional axis — bi stream + flow control + backpressure +
 * close を mock 化する。
 *
 * 実 WebTransport 呼出形式 (`WebTransport.createBidirectionalStream`) は以下 ...
 *
 * ```ts
 * const stream = await transport.createBidirectionalStream();
 * const writer = stream.writable.getWriter();
 * await writer.ready; // backpressure — ready 待機
 * await writer.write(new Uint8Array(1024));
 * // reader 側
 * const reader = stream.readable.getReader();
 * const { value, done } = await reader.read();
 * ```
 *
 * 本 mock は上記 4 event (bi-stream-open / write / close / backpressure) と
 * flow control (window size ベース backpressure) を再現する。
 */

export interface BiStreamOptions {
  /** flow control window size (byte、 default 16384)。 */
  windowSize?: number;
}

export interface BiStreamHandle {
  readonly id: string;
  readonly state: 'open' | 'closed';
  readonly windowRemaining: number;
  write(data: Uint8Array): Promise<void>;
  read(): Promise<Uint8Array | null>;
  close(): Promise<void>;
}

export interface WebTransportBiMock extends SemanticsMock {
  readonly protocol: 'webtransport';
  readonly axis: 'webtransport-bi';
  createBiStream(options?: BiStreamOptions): Promise<BiStreamHandle>;
}

export function createWebTransportBiMock(
  config: SemanticsMockConfig = {},
): WebTransportBiMock {
  const latency = config.artificialLatencyMs ?? 1;
  const handlers = new Set<(event: SemanticsEvent) => void>();
  let metrics: SemanticsMetrics = initialMetrics();
  const startTime = Date.now();
  let order = 0;
  let streamSeq = 0;

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

  const createBiStream = async (options: BiStreamOptions = {}): Promise<BiStreamHandle> => {
    await sleep(latency);
    const id = `bi-${streamSeq++}`;
    let state: BiStreamHandle['state'] = 'open';
    const window = options.windowSize ?? 16384;
    let windowRemaining = window;
    const readQueue: Uint8Array[] = [];

    metrics.streamsOpened += 1;
    emit({
      kind: 'bi-stream-open',
      streamId: id,
      payload: { direction: 'bi', windowSize: window },
      order: order++,
      relativeTimeMs: Date.now() - startTime,
    });

    const handle: BiStreamHandle = {
      id,
      get state() {
        return state;
      },
      get windowRemaining() {
        return windowRemaining;
      },
      async write(data: Uint8Array) {
        if (state !== 'open') {
          throw new Error(`bi stream not open (state=${state})`);
        }
        // flow control — window 不足で backpressure 発火
        if (data.byteLength > windowRemaining) {
          metrics.backpressureCount += 1;
          emit({
            kind: 'bi-backpressure',
            streamId: id,
            payload: {
              requested: data.byteLength,
              remaining: windowRemaining,
            },
            order: order++,
            relativeTimeMs: Date.now() - startTime,
          });
          // window 補充を待つ (mock は artificial delay 後に補充)
          await sleep(latency);
          windowRemaining = window;
        }
        await sleep(latency);
        windowRemaining -= data.byteLength;
        // echo — write した data を read queue に積む (bi の性質を反映)
        readQueue.push(data);
        emit({
          kind: 'bi-stream-write',
          streamId: id,
          payload: {
            byteLength: data.byteLength,
            windowRemaining,
          },
          order: order++,
          relativeTimeMs: Date.now() - startTime,
        });
      },
      async read() {
        await sleep(latency);
        if (state !== 'open') return null;
        const chunk = readQueue.shift();
        return chunk ?? null;
      },
      async close() {
        if (state === 'closed') return;
        state = 'closed';
        metrics.streamsClosed += 1;
        emit({
          kind: 'bi-stream-close',
          streamId: id,
          payload: { direction: 'bi' },
          order: order++,
          relativeTimeMs: Date.now() - startTime,
        });
      },
    };
    return handle;
  };

  const mock: WebTransportBiMock = {
    protocol: 'webtransport',
    axis: 'webtransport-bi',
    createBiStream,
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
    },
  };
  return mock;
}
