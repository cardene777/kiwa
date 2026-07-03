import type { AdapterLog, AdapterSpan, LoadedTrace } from '../adapters/interface.js';

/**
 * 10 canonical trace fixtures. Together they contain 100 spans and 34
 * logs covering the typical shapes a Node.js / browser SUT emits: a
 * shallow HTTP handler, a fan-out parallel worker, a nested retry
 * chain, a deep server-side render tree, a batched database write, a
 * chunked file upload, an authenticated API gateway, an async event
 * bus, a cache miss + fill cycle, and a background job with a
 * long-running child task.
 *
 * Each fixture is a self-contained {@link LoadedTrace} — the traceId
 * is unique, every span's parentSpanId points at a preceding sibling
 * or root, and every log carries its span + trace correlation ids so
 * the LogCorrelationIndex builds a full join.
 *
 * The set is intentionally biased toward mixed depths so the flame
 * graph renderer stress-tests sibling collapse (depth 3+ chains where
 * two sub-spans share the same name).
 */

function span(input: {
  spanId: string;
  parentSpanId: string | null;
  name: string;
  traceId: string;
  startedAt: number;
  endedAt: number | null;
  attributes?: Record<string, unknown>;
}): AdapterSpan {
  return {
    spanId: input.spanId,
    parentSpanId: input.parentSpanId,
    name: input.name,
    traceId: input.traceId,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    attributes: {
      trace_id: input.traceId,
      span_id: input.spanId,
      ...(input.attributes ?? {}),
    },
  };
}

function log(input: {
  level: AdapterLog['level'];
  message: string;
  timestamp: number;
  traceId: string;
  spanId: string;
  attributes?: Record<string, unknown>;
}): AdapterLog {
  return {
    level: input.level,
    message: input.message,
    timestamp: input.timestamp,
    traceId: input.traceId,
    spanId: input.spanId,
    attributes: {
      trace_id: input.traceId,
      span_id: input.spanId,
      ...(input.attributes ?? {}),
    },
  };
}

/**
 * F-01 http-handler — flat 4-span HTTP handler (route → auth → db → serialize).
 * Warm-cache request; every span closes; total ~40 ms.
 */
export function traceHttpHandler(): LoadedTrace {
  const t = 'trace-http-handler';
  const spans: AdapterSpan[] = [
    span({ spanId: 's-http-1', parentSpanId: null, name: 'http.handler', traceId: t, startedAt: 0, endedAt: 40 }),
    span({ spanId: 's-http-2', parentSpanId: 's-http-1', name: 'auth.verify', traceId: t, startedAt: 1, endedAt: 6 }),
    span({ spanId: 's-http-3', parentSpanId: 's-http-1', name: 'db.query', traceId: t, startedAt: 7, endedAt: 30, attributes: { 'db.name': 'orders' } }),
    // The query is planned + executed + fetched in that order.
    span({ spanId: 's-http-3a', parentSpanId: 's-http-3', name: 'db.plan', traceId: t, startedAt: 8, endedAt: 12 }),
    span({ spanId: 's-http-3b', parentSpanId: 's-http-3', name: 'db.execute', traceId: t, startedAt: 12, endedAt: 25 }),
    span({ spanId: 's-http-3c', parentSpanId: 's-http-3', name: 'db.fetch', traceId: t, startedAt: 25, endedAt: 29 }),
    span({ spanId: 's-http-4', parentSpanId: 's-http-1', name: 'response.serialize', traceId: t, startedAt: 31, endedAt: 39 }),
  ];
  const logs: AdapterLog[] = [
    log({ level: 'info', message: 'GET /orders', timestamp: 0, traceId: t, spanId: 's-http-1' }),
    log({ level: 'debug', message: 'JWT verified', timestamp: 5, traceId: t, spanId: 's-http-2' }),
    log({ level: 'info', message: 'orders loaded', timestamp: 29, traceId: t, spanId: 's-http-3', attributes: { rows: 12 } }),
  ];
  return { traceId: t, spans, logs };
}

/**
 * F-02 fanout-parallel — root span with 5 parallel child workers.
 * Two children share the same name (`worker.process`) so the flame
 * graph collapses them into a single node with samples=2.
 */
export function traceFanoutParallel(): LoadedTrace {
  const t = 'trace-fanout-parallel';
  const spans: AdapterSpan[] = [
    span({ spanId: 's-fan-1', parentSpanId: null, name: 'job.dispatcher', traceId: t, startedAt: 0, endedAt: 120 }),
    span({ spanId: 's-fan-2', parentSpanId: 's-fan-1', name: 'worker.process', traceId: t, startedAt: 5, endedAt: 60 }),
    span({ spanId: 's-fan-3', parentSpanId: 's-fan-1', name: 'worker.process', traceId: t, startedAt: 5, endedAt: 65 }),
    span({ spanId: 's-fan-4', parentSpanId: 's-fan-1', name: 'worker.enqueue', traceId: t, startedAt: 5, endedAt: 20 }),
    span({ spanId: 's-fan-5', parentSpanId: 's-fan-1', name: 'worker.publish', traceId: t, startedAt: 60, endedAt: 100 }),
    span({ spanId: 's-fan-6', parentSpanId: 's-fan-1', name: 'metrics.emit', traceId: t, startedAt: 100, endedAt: 118 }),
  ];
  const logs: AdapterLog[] = [
    log({ level: 'info', message: 'dispatch batch=5', timestamp: 0, traceId: t, spanId: 's-fan-1' }),
    log({ level: 'debug', message: 'worker A done', timestamp: 60, traceId: t, spanId: 's-fan-2' }),
    log({ level: 'warn', message: 'worker B slow', timestamp: 64, traceId: t, spanId: 's-fan-3' }),
  ];
  return { traceId: t, spans, logs };
}

/**
 * F-03 nested-retry — 3-level nested retry chain. Each retry attempt is
 * a child of the previous, so the flame graph shows a deep column with
 * `http.retry` at depth 1, 2 and 3.
 */
export function traceNestedRetry(): LoadedTrace {
  const t = 'trace-nested-retry';
  const spans: AdapterSpan[] = [
    span({ spanId: 's-retry-1', parentSpanId: null, name: 'http.request', traceId: t, startedAt: 0, endedAt: 900 }),
    span({ spanId: 's-retry-2', parentSpanId: 's-retry-1', name: 'http.retry', traceId: t, startedAt: 100, endedAt: 300, attributes: { attempt: 1 } }),
    span({ spanId: 's-retry-3', parentSpanId: 's-retry-2', name: 'http.retry', traceId: t, startedAt: 310, endedAt: 500, attributes: { attempt: 2 } }),
    span({ spanId: 's-retry-4', parentSpanId: 's-retry-3', name: 'http.retry', traceId: t, startedAt: 510, endedAt: 700, attributes: { attempt: 3 } }),
    span({ spanId: 's-retry-5', parentSpanId: 's-retry-4', name: 'http.response.error', traceId: t, startedAt: 700, endedAt: 720, attributes: { status: 503 } }),
    span({ spanId: 's-retry-6', parentSpanId: 's-retry-1', name: 'backoff.wait', traceId: t, startedAt: 720, endedAt: 880 }),
    span({ spanId: 's-retry-7', parentSpanId: 's-retry-1', name: 'metrics.emit', traceId: t, startedAt: 880, endedAt: 895 }),
  ];
  const logs: AdapterLog[] = [
    log({ level: 'warn', message: 'attempt 1 failed', timestamp: 300, traceId: t, spanId: 's-retry-2' }),
    log({ level: 'warn', message: 'attempt 2 failed', timestamp: 500, traceId: t, spanId: 's-retry-3' }),
    log({ level: 'error', message: 'all retries exhausted', timestamp: 720, traceId: t, spanId: 's-retry-5' }),
  ];
  return { traceId: t, spans, logs };
}

/**
 * F-04 ssr-tree — deep 6-level React SSR render tree. Modelled as the
 * flame graph a React SSR renderer emits when rendering a page with
 * nested layouts + a data-loading boundary.
 */
export function traceSsrTree(): LoadedTrace {
  const t = 'trace-ssr-tree';
  const spans: AdapterSpan[] = [
    span({ spanId: 's-ssr-1', parentSpanId: null, name: 'ssr.render', traceId: t, startedAt: 0, endedAt: 260 }),
    span({ spanId: 's-ssr-2', parentSpanId: 's-ssr-1', name: 'layout.root', traceId: t, startedAt: 1, endedAt: 250 }),
    span({ spanId: 's-ssr-3', parentSpanId: 's-ssr-2', name: 'layout.dashboard', traceId: t, startedAt: 5, endedAt: 240 }),
    span({ spanId: 's-ssr-4', parentSpanId: 's-ssr-3', name: 'boundary.data', traceId: t, startedAt: 10, endedAt: 200 }),
    span({ spanId: 's-ssr-5', parentSpanId: 's-ssr-4', name: 'component.chart', traceId: t, startedAt: 20, endedAt: 180, attributes: { children: 3 } }),
    span({ spanId: 's-ssr-6', parentSpanId: 's-ssr-5', name: 'component.axis', traceId: t, startedAt: 30, endedAt: 90 }),
    span({ spanId: 's-ssr-7', parentSpanId: 's-ssr-5', name: 'component.series', traceId: t, startedAt: 95, endedAt: 175, attributes: { series: 4 } }),
    // Series is rendered per data point (4 leaf spans).
    span({ spanId: 's-ssr-7a', parentSpanId: 's-ssr-7', name: 'component.datapoint', traceId: t, startedAt: 100, endedAt: 120 }),
    span({ spanId: 's-ssr-7b', parentSpanId: 's-ssr-7', name: 'component.datapoint', traceId: t, startedAt: 120, endedAt: 140 }),
    span({ spanId: 's-ssr-7c', parentSpanId: 's-ssr-7', name: 'component.datapoint', traceId: t, startedAt: 140, endedAt: 160 }),
    span({ spanId: 's-ssr-7d', parentSpanId: 's-ssr-7', name: 'component.datapoint', traceId: t, startedAt: 160, endedAt: 174 }),
    span({ spanId: 's-ssr-8', parentSpanId: 's-ssr-3', name: 'suspense.resolve', traceId: t, startedAt: 240, endedAt: 250 }),
    span({ spanId: 's-ssr-9', parentSpanId: 's-ssr-1', name: 'ssr.hydrate.script', traceId: t, startedAt: 250, endedAt: 258 }),
  ];
  const logs: AdapterLog[] = [
    log({ level: 'info', message: 'ssr start', timestamp: 0, traceId: t, spanId: 's-ssr-1' }),
    log({ level: 'debug', message: 'chart mounted', timestamp: 180, traceId: t, spanId: 's-ssr-5' }),
  ];
  return { traceId: t, spans, logs };
}

/**
 * F-05 batch-write — batched database write with 4 sequential batches
 * of 5 inserts each. The flame graph collapses the 4 batch spans into
 * a single flame node (samples=4).
 */
export function traceBatchWrite(): LoadedTrace {
  const t = 'trace-batch-write';
  const spans: AdapterSpan[] = [
    span({ spanId: 's-batch-1', parentSpanId: null, name: 'db.transaction', traceId: t, startedAt: 0, endedAt: 800, attributes: { 'db.name': 'events' } }),
    span({ spanId: 's-batch-2', parentSpanId: 's-batch-1', name: 'db.batch', traceId: t, startedAt: 10, endedAt: 200, attributes: { rows: 5 } }),
    span({ spanId: 's-batch-3', parentSpanId: 's-batch-1', name: 'db.batch', traceId: t, startedAt: 210, endedAt: 400, attributes: { rows: 5 } }),
    span({ spanId: 's-batch-4', parentSpanId: 's-batch-1', name: 'db.batch', traceId: t, startedAt: 410, endedAt: 600, attributes: { rows: 5 } }),
    span({ spanId: 's-batch-5', parentSpanId: 's-batch-1', name: 'db.batch', traceId: t, startedAt: 610, endedAt: 780, attributes: { rows: 5 } }),
    // Every batch is preceded by a validation pass on the app side.
    span({ spanId: 's-batch-2v', parentSpanId: 's-batch-2', name: 'db.validate', traceId: t, startedAt: 10, endedAt: 25 }),
    span({ spanId: 's-batch-3v', parentSpanId: 's-batch-3', name: 'db.validate', traceId: t, startedAt: 210, endedAt: 225 }),
    span({ spanId: 's-batch-4v', parentSpanId: 's-batch-4', name: 'db.validate', traceId: t, startedAt: 410, endedAt: 425 }),
    span({ spanId: 's-batch-5v', parentSpanId: 's-batch-5', name: 'db.validate', traceId: t, startedAt: 610, endedAt: 625 }),
    span({ spanId: 's-batch-6', parentSpanId: 's-batch-1', name: 'db.commit', traceId: t, startedAt: 780, endedAt: 795 }),
  ];
  const logs: AdapterLog[] = [
    log({ level: 'info', message: 'batch 1 committed', timestamp: 200, traceId: t, spanId: 's-batch-2' }),
    log({ level: 'info', message: 'batch 4 committed', timestamp: 780, traceId: t, spanId: 's-batch-5' }),
  ];
  return { traceId: t, spans, logs };
}

/**
 * F-06 chunked-upload — sequential chunk stream where each chunk span
 * has an inner checksum + upload child pair. Depth 3; two identical
 * child names per chunk.
 */
export function traceChunkedUpload(): LoadedTrace {
  const t = 'trace-chunked-upload';
  const spans: AdapterSpan[] = [
    span({ spanId: 's-up-1', parentSpanId: null, name: 'upload.stream', traceId: t, startedAt: 0, endedAt: 600 }),
    span({ spanId: 's-up-2', parentSpanId: 's-up-1', name: 'chunk.upload', traceId: t, startedAt: 0, endedAt: 200, attributes: { chunkIdx: 0 } }),
    span({ spanId: 's-up-3', parentSpanId: 's-up-2', name: 'chunk.checksum', traceId: t, startedAt: 5, endedAt: 20 }),
    span({ spanId: 's-up-4', parentSpanId: 's-up-2', name: 'chunk.write', traceId: t, startedAt: 20, endedAt: 195 }),
    span({ spanId: 's-up-5', parentSpanId: 's-up-1', name: 'chunk.upload', traceId: t, startedAt: 200, endedAt: 400, attributes: { chunkIdx: 1 } }),
    span({ spanId: 's-up-6', parentSpanId: 's-up-5', name: 'chunk.checksum', traceId: t, startedAt: 205, endedAt: 215 }),
    span({ spanId: 's-up-7', parentSpanId: 's-up-5', name: 'chunk.write', traceId: t, startedAt: 215, endedAt: 395 }),
    span({ spanId: 's-up-8', parentSpanId: 's-up-1', name: 'chunk.upload', traceId: t, startedAt: 400, endedAt: 590, attributes: { chunkIdx: 2 } }),
    span({ spanId: 's-up-9', parentSpanId: 's-up-8', name: 'chunk.checksum', traceId: t, startedAt: 405, endedAt: 420 }),
    span({ spanId: 's-up-10', parentSpanId: 's-up-8', name: 'chunk.write', traceId: t, startedAt: 420, endedAt: 590 }),
    span({ spanId: 's-up-11', parentSpanId: 's-up-1', name: 'upload.finalize', traceId: t, startedAt: 590, endedAt: 599 }),
  ];
  const logs: AdapterLog[] = [
    log({ level: 'debug', message: 'chunk 0 uploaded', timestamp: 200, traceId: t, spanId: 's-up-2' }),
    log({ level: 'debug', message: 'chunk 1 uploaded', timestamp: 400, traceId: t, spanId: 's-up-5' }),
    log({ level: 'debug', message: 'chunk 2 uploaded', timestamp: 590, traceId: t, spanId: 's-up-8' }),
    log({ level: 'info', message: 'upload complete', timestamp: 599, traceId: t, spanId: 's-up-1' }),
  ];
  return { traceId: t, spans, logs };
}

/**
 * F-07 api-gateway — API gateway with auth + rate-limit + downstream
 * fan-out to 3 microservices. Every downstream span carries a distinct
 * service name so the flame graph shows a wide low-depth structure.
 */
export function traceApiGateway(): LoadedTrace {
  const t = 'trace-api-gateway';
  const spans: AdapterSpan[] = [
    span({ spanId: 's-gw-1', parentSpanId: null, name: 'gateway.request', traceId: t, startedAt: 0, endedAt: 300 }),
    span({ spanId: 's-gw-2', parentSpanId: 's-gw-1', name: 'gateway.auth', traceId: t, startedAt: 1, endedAt: 8 }),
    span({ spanId: 's-gw-3', parentSpanId: 's-gw-1', name: 'gateway.ratelimit', traceId: t, startedAt: 8, endedAt: 12 }),
    span({ spanId: 's-gw-4', parentSpanId: 's-gw-1', name: 'downstream.users', traceId: t, startedAt: 12, endedAt: 90 }),
    // Users microservice makes 2 internal calls (db + cache).
    span({ spanId: 's-gw-4a', parentSpanId: 's-gw-4', name: 'users.db.query', traceId: t, startedAt: 15, endedAt: 60 }),
    span({ spanId: 's-gw-4b', parentSpanId: 's-gw-4', name: 'users.cache.write', traceId: t, startedAt: 60, endedAt: 85 }),
    span({ spanId: 's-gw-5', parentSpanId: 's-gw-1', name: 'downstream.orders', traceId: t, startedAt: 12, endedAt: 110 }),
    // Orders microservice fans out to inventory + shipping.
    span({ spanId: 's-gw-5a', parentSpanId: 's-gw-5', name: 'orders.inventory.check', traceId: t, startedAt: 15, endedAt: 70 }),
    span({ spanId: 's-gw-5b', parentSpanId: 's-gw-5', name: 'orders.shipping.quote', traceId: t, startedAt: 70, endedAt: 105 }),
    span({ spanId: 's-gw-6', parentSpanId: 's-gw-1', name: 'downstream.billing', traceId: t, startedAt: 12, endedAt: 180 }),
    span({ spanId: 's-gw-6a', parentSpanId: 's-gw-6', name: 'billing.stripe.charge', traceId: t, startedAt: 15, endedAt: 170 }),
    span({ spanId: 's-gw-7', parentSpanId: 's-gw-1', name: 'gateway.aggregate', traceId: t, startedAt: 180, endedAt: 260 }),
    span({ spanId: 's-gw-8', parentSpanId: 's-gw-1', name: 'gateway.response', traceId: t, startedAt: 260, endedAt: 290 }),
    span({ spanId: 's-gw-9', parentSpanId: 's-gw-1', name: 'gateway.metrics.emit', traceId: t, startedAt: 285, endedAt: 295 }),
  ];
  const logs: AdapterLog[] = [
    log({ level: 'info', message: 'gateway open', timestamp: 0, traceId: t, spanId: 's-gw-1' }),
    log({ level: 'debug', message: 'users cache warmed', timestamp: 85, traceId: t, spanId: 's-gw-4b' }),
    log({ level: 'info', message: 'inventory ok', timestamp: 70, traceId: t, spanId: 's-gw-5a' }),
    log({ level: 'warn', message: 'billing slow', timestamp: 180, traceId: t, spanId: 's-gw-6' }),
    log({ level: 'error', message: 'stripe timeout retry', timestamp: 165, traceId: t, spanId: 's-gw-6a' }),
    log({ level: 'info', message: 'aggregate ready', timestamp: 260, traceId: t, spanId: 's-gw-7' }),
  ];
  return { traceId: t, spans, logs };
}

/**
 * F-08 event-bus — async event bus with 4 subscribers, one of which
 * emits a nested "handler" child span. The subscribers all share the
 * name `bus.subscribe` so the flame graph collapses to samples=4.
 */
export function traceEventBus(): LoadedTrace {
  const t = 'trace-event-bus';
  const spans: AdapterSpan[] = [
    span({ spanId: 's-bus-1', parentSpanId: null, name: 'bus.publish', traceId: t, startedAt: 0, endedAt: 500, attributes: { topic: 'order.placed' } }),
    span({ spanId: 's-bus-2', parentSpanId: 's-bus-1', name: 'bus.subscribe', traceId: t, startedAt: 10, endedAt: 100, attributes: { subscriber: 'analytics' } }),
    // Analytics subscriber writes to warehouse.
    span({ spanId: 's-bus-2a', parentSpanId: 's-bus-2', name: 'warehouse.append', traceId: t, startedAt: 30, endedAt: 95 }),
    span({ spanId: 's-bus-3', parentSpanId: 's-bus-1', name: 'bus.subscribe', traceId: t, startedAt: 10, endedAt: 120, attributes: { subscriber: 'notifications' } }),
    span({ spanId: 's-bus-4', parentSpanId: 's-bus-3', name: 'notification.send', traceId: t, startedAt: 30, endedAt: 100 }),
    // Notification sender fans out per channel.
    span({ spanId: 's-bus-4a', parentSpanId: 's-bus-4', name: 'channel.email', traceId: t, startedAt: 35, endedAt: 90 }),
    span({ spanId: 's-bus-4b', parentSpanId: 's-bus-4', name: 'channel.push', traceId: t, startedAt: 35, endedAt: 80 }),
    span({ spanId: 's-bus-5', parentSpanId: 's-bus-1', name: 'bus.subscribe', traceId: t, startedAt: 10, endedAt: 150, attributes: { subscriber: 'billing' } }),
    span({ spanId: 's-bus-5a', parentSpanId: 's-bus-5', name: 'billing.reserve', traceId: t, startedAt: 30, endedAt: 140 }),
    span({ spanId: 's-bus-6', parentSpanId: 's-bus-1', name: 'bus.subscribe', traceId: t, startedAt: 10, endedAt: 130, attributes: { subscriber: 'search' } }),
    span({ spanId: 's-bus-6a', parentSpanId: 's-bus-6', name: 'search.index', traceId: t, startedAt: 30, endedAt: 125 }),
    span({ spanId: 's-bus-7', parentSpanId: 's-bus-1', name: 'bus.ack', traceId: t, startedAt: 480, endedAt: 495 }),
  ];
  const logs: AdapterLog[] = [
    log({ level: 'info', message: 'event published', timestamp: 0, traceId: t, spanId: 's-bus-1' }),
    log({ level: 'debug', message: 'warehouse row written', timestamp: 95, traceId: t, spanId: 's-bus-2a' }),
    log({ level: 'debug', message: 'notifications acked', timestamp: 120, traceId: t, spanId: 's-bus-3' }),
    log({ level: 'debug', message: 'email queued', timestamp: 90, traceId: t, spanId: 's-bus-4a' }),
    log({ level: 'info', message: 'search re-indexed', timestamp: 125, traceId: t, spanId: 's-bus-6a' }),
  ];
  return { traceId: t, spans, logs };
}

/**
 * F-09 cache-cycle — cache miss + fill cycle with a nested db.query
 * behind the cache miss and a cache.write on the way out.
 */
export function traceCacheCycle(): LoadedTrace {
  const t = 'trace-cache-cycle';
  const spans: AdapterSpan[] = [
    span({ spanId: 's-cache-1', parentSpanId: null, name: 'cache.get', traceId: t, startedAt: 0, endedAt: 60, attributes: { key: 'user:42' } }),
    span({ spanId: 's-cache-2', parentSpanId: 's-cache-1', name: 'cache.miss', traceId: t, startedAt: 1, endedAt: 5 }),
    span({ spanId: 's-cache-3', parentSpanId: 's-cache-1', name: 'db.query', traceId: t, startedAt: 5, endedAt: 45, attributes: { rows: 1 } }),
    span({ spanId: 's-cache-3a', parentSpanId: 's-cache-3', name: 'db.plan', traceId: t, startedAt: 6, endedAt: 10 }),
    span({ spanId: 's-cache-3b', parentSpanId: 's-cache-3', name: 'db.execute', traceId: t, startedAt: 10, endedAt: 40 }),
    span({ spanId: 's-cache-4', parentSpanId: 's-cache-1', name: 'cache.write', traceId: t, startedAt: 45, endedAt: 55 }),
    span({ spanId: 's-cache-5', parentSpanId: 's-cache-1', name: 'cache.write.ack', traceId: t, startedAt: 55, endedAt: 58 }),
    span({ spanId: 's-cache-6', parentSpanId: 's-cache-1', name: 'metrics.emit', traceId: t, startedAt: 58, endedAt: 59 }),
    span({ spanId: 's-cache-7', parentSpanId: 's-cache-1', name: 'cache.audit', traceId: t, startedAt: 59, endedAt: 60 }),
  ];
  const logs: AdapterLog[] = [
    log({ level: 'debug', message: 'cache miss', timestamp: 1, traceId: t, spanId: 's-cache-2' }),
    log({ level: 'info', message: 'user fetched', timestamp: 45, traceId: t, spanId: 's-cache-3' }),
  ];
  return { traceId: t, spans, logs };
}

/**
 * F-10 bg-job — background job that spawns a long-running child which
 * emits multiple heartbeat spans (same name, different times). The
 * flame graph collapses heartbeats into samples=5.
 */
export function traceBackgroundJob(): LoadedTrace {
  const t = 'trace-bg-job';
  const spans: AdapterSpan[] = [
    span({ spanId: 's-job-1', parentSpanId: null, name: 'job.run', traceId: t, startedAt: 0, endedAt: 1_000, attributes: { jobId: 'nightly-1' } }),
    span({ spanId: 's-job-2', parentSpanId: 's-job-1', name: 'job.child', traceId: t, startedAt: 10, endedAt: 990 }),
    span({ spanId: 's-job-3', parentSpanId: 's-job-2', name: 'heartbeat', traceId: t, startedAt: 100, endedAt: 105 }),
    span({ spanId: 's-job-4', parentSpanId: 's-job-2', name: 'heartbeat', traceId: t, startedAt: 300, endedAt: 305 }),
    span({ spanId: 's-job-5', parentSpanId: 's-job-2', name: 'heartbeat', traceId: t, startedAt: 500, endedAt: 505 }),
    span({ spanId: 's-job-6', parentSpanId: 's-job-2', name: 'heartbeat', traceId: t, startedAt: 700, endedAt: 705 }),
    span({ spanId: 's-job-7', parentSpanId: 's-job-2', name: 'heartbeat', traceId: t, startedAt: 900, endedAt: 905 }),
    // Job also emits per-batch checkpoints (3 spans, same name).
    span({ spanId: 's-job-2a', parentSpanId: 's-job-2', name: 'job.checkpoint', traceId: t, startedAt: 200, endedAt: 210 }),
    span({ spanId: 's-job-2b', parentSpanId: 's-job-2', name: 'job.checkpoint', traceId: t, startedAt: 500, endedAt: 510 }),
    span({ spanId: 's-job-2c', parentSpanId: 's-job-2', name: 'job.checkpoint', traceId: t, startedAt: 800, endedAt: 810 }),
    span({ spanId: 's-job-8', parentSpanId: 's-job-1', name: 'job.finalize', traceId: t, startedAt: 990, endedAt: 999 }),
  ];
  const logs: AdapterLog[] = [
    log({ level: 'info', message: 'nightly job started', timestamp: 0, traceId: t, spanId: 's-job-1' }),
    log({ level: 'debug', message: 'heartbeat @ 100', timestamp: 100, traceId: t, spanId: 's-job-3' }),
    log({ level: 'debug', message: 'heartbeat @ 900', timestamp: 900, traceId: t, spanId: 's-job-7' }),
    log({ level: 'info', message: 'job finalized', timestamp: 999, traceId: t, spanId: 's-job-8' }),
  ];
  return { traceId: t, spans, logs };
}

/**
 * The full seeded set. `seededTraces()` is the sole entry point the
 * mock adapter uses — kiwa test authors override individual fixtures
 * by re-building the config with a custom `traces` array.
 */
export function seededTraces(): LoadedTrace[] {
  return [
    traceHttpHandler(),
    traceFanoutParallel(),
    traceNestedRetry(),
    traceSsrTree(),
    traceBatchWrite(),
    traceChunkedUpload(),
    traceApiGateway(),
    traceEventBus(),
    traceCacheCycle(),
    traceBackgroundJob(),
  ];
}

/** Named lookup — falls back to `undefined` when no fixture matches. */
export function traceById(id: string): LoadedTrace | undefined {
  return seededTraces().find((t) => t.traceId === id);
}
