import {
  initialMetrics,
  type SemanticsEvent,
  type SemanticsMetrics,
  type SemanticsMock,
  type SemanticsMockConfig,
} from './types.js';

/**
 * HTTP/3 server push axis — server push + prioritization + push_promise +
 * cancellation を mock 化する。
 *
 * 実 HTTP/3 呼出形式 (server 側 push、 client 側は listener 経由) は以下 ...
 *
 * ```ts
 * // server 側 (nginx / caddy 相当の JS 表現)
 * const push = req.pushStream('/assets/app.css', {
 *   priority: { urgency: 0, incremental: false },
 * });
 * push.writeHead(200, { 'content-type': 'text/css' });
 * push.end('body { }');
 * // client 側は push_promise event を受けて promise を await
 * ```
 *
 * 本 mock は上記 4 event (push-promise / push-headers / push-body /
 * push-cancelled) と priority (urgency 0-7 + incremental flag) を再現する。
 */

/** HTTP/3 priority signal (RFC 9218 準拠)。 */
export interface PushPriority {
  /** 0 (最高) 〜 7 (最低)、 default 3。 */
  urgency: number;
  /** progressive delivery 可否 (default false)。 */
  incremental: boolean;
}

export interface PushPromise {
  readonly id: string;
  readonly path: string;
  readonly priority: PushPriority;
  readonly state: 'promised' | 'headers-sent' | 'body-sent' | 'cancelled';
  sendHeaders(headers: Record<string, string>): Promise<void>;
  sendBody(body: string | Uint8Array): Promise<void>;
  cancel(errorCode: number): Promise<void>;
}

export interface Http3PushMock extends SemanticsMock {
  readonly protocol: 'http3-quic';
  readonly axis: 'http3-push';
  /** server push を promise、 client 側に push_promise event を送出。 */
  pushStream(path: string, priority?: Partial<PushPriority>): Promise<PushPromise>;
}

export function createHttp3PushMock(config: SemanticsMockConfig = {}): Http3PushMock {
  const latency = config.artificialLatencyMs ?? 1;
  const handlers = new Set<(event: SemanticsEvent) => void>();
  let metrics: SemanticsMetrics = initialMetrics();
  const startTime = Date.now();
  let order = 0;
  let pushSeq = 0;

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

  const pushStream = async (
    path: string,
    priority: Partial<PushPriority> = {},
  ): Promise<PushPromise> => {
    await sleep(latency);
    const id = `push-${pushSeq++}`;
    const resolvedPriority: PushPriority = {
      urgency: priority.urgency ?? 3,
      incremental: priority.incremental ?? false,
    };
    let state: PushPromise['state'] = 'promised';
    metrics.streamsOpened += 1;
    metrics.custom.pushesPromised = (metrics.custom.pushesPromised ?? 0) + 1;
    emit({
      kind: 'push-promise',
      streamId: id,
      payload: { path, priority: resolvedPriority },
      order: order++,
      relativeTimeMs: Date.now() - startTime,
    });

    const promise: PushPromise = {
      id,
      path,
      priority: resolvedPriority,
      get state() {
        return state;
      },
      async sendHeaders(headers: Record<string, string>) {
        if (state === 'cancelled') return;
        await sleep(latency);
        state = 'headers-sent';
        emit({
          kind: 'push-headers',
          streamId: id,
          payload: { headers, path },
          order: order++,
          relativeTimeMs: Date.now() - startTime,
        });
      },
      async sendBody(body: string | Uint8Array) {
        if (state === 'cancelled') return;
        await sleep(latency);
        state = 'body-sent';
        const byteLength = typeof body === 'string' ? body.length : body.byteLength;
        metrics.streamsClosed += 1;
        emit({
          kind: 'push-body',
          streamId: id,
          payload: { byteLength, path },
          order: order++,
          relativeTimeMs: Date.now() - startTime,
        });
      },
      async cancel(errorCode: number) {
        if (state === 'cancelled' || state === 'body-sent') return;
        await sleep(latency);
        state = 'cancelled';
        metrics.streamsReset += 1;
        metrics.custom.pushesCancelled = (metrics.custom.pushesCancelled ?? 0) + 1;
        emit({
          kind: 'push-cancelled',
          streamId: id,
          payload: { errorCode, path },
          order: order++,
          relativeTimeMs: Date.now() - startTime,
        });
      },
    };
    return promise;
  };

  const mock: Http3PushMock = {
    protocol: 'http3-quic',
    axis: 'http3-push',
    pushStream,
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
      pushSeq = 0;
    },
  };
  return mock;
}
