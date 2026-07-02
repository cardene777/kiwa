import { describe, expect, it } from 'vitest';
import {
  createDatadogMock,
  createOtelMock,
  createSentryMock,
} from '../src/index.js';

describe('createOtelMock — spans / metrics / logs', () => {
  it('startSpan records attributes + events + end time', () => {
    let clock = 100;
    const otel = createOtelMock({ now: () => clock });
    const span = otel.tracer.startSpan('handle-request', { attributes: { route: '/api' } });
    clock = 105;
    span.addEvent('cache-miss', { key: 'user:1' });
    clock = 110;
    span.setAttribute('status', 200);
    span.end();

    const rec = otel.collector.spanByName('handle-request');
    expect(rec?.attributes.route).toBe('/api');
    expect(rec?.attributes.status).toBe(200);
    expect(rec?.events[0]?.name).toBe('cache-miss');
    expect(rec?.startedAt).toBe(100);
    expect(rec?.endedAt).toBe(110);
  });

  it('counter / gauge / histogram all land in the collector', () => {
    const otel = createOtelMock();
    otel.meter.createCounter('req.total').add(1, { route: '/a' });
    otel.meter.createCounter('req.total').add(2, { route: '/a' });
    otel.meter.createGauge('mem.used').record(512);
    otel.meter.createHistogram('lat.ms').record(42);
    expect(otel.collector.metricSum('req.total')).toBe(3);
    expect(otel.collector.metrics.find((m) => m.kind === 'gauge')?.value).toBe(512);
    expect(otel.collector.metrics.find((m) => m.kind === 'histogram')?.value).toBe(42);
  });

  it('logger emits records with level + attributes', () => {
    const otel = createOtelMock();
    otel.logger.emit({ level: 'warn', message: 'deprecated', attributes: { feature: 'x' } });
    expect(otel.collector.logs[0]?.level).toBe('warn');
    expect(otel.collector.logs[0]?.attributes.feature).toBe('x');
  });
});

describe('createDatadogMock — statsd + tracer', () => {
  it('statsd increment default value = 1', () => {
    const dd = createDatadogMock();
    dd.statsd.increment('api.hit');
    dd.statsd.increment('api.hit', 5);
    expect(dd.collector.metricSum('api.hit')).toBe(6);
  });

  it('statsd gauge + histogram tag propagation', () => {
    const dd = createDatadogMock();
    dd.statsd.gauge('queue.depth', 12, { env: 'prod' });
    dd.statsd.histogram('req.ms', 250, { route: '/x' });
    expect(dd.collector.metrics[0]?.tags.env).toBe('prod');
    expect(dd.collector.metrics[1]?.tags.route).toBe('/x');
  });

  it('tracer startSpan supports addTags + log + finish', () => {
    let clock = 0;
    const dd = createDatadogMock({ now: () => clock });
    const span = dd.tracer.startSpan('db.query', { tags: { engine: 'pg' } });
    clock = 10;
    span.addTags({ table: 'users' });
    span.log({ event: 'row_count', rows: 42 });
    span.finish();
    const rec = dd.collector.spanByName('db.query');
    expect(rec?.attributes.engine).toBe('pg');
    expect(rec?.attributes.table).toBe('users');
    expect(rec?.events[0]?.attributes.rows).toBe(42);
    expect(rec?.endedAt).toBe(10);
  });
});

describe('createSentryMock — captureException + breadcrumbs + transactions', () => {
  it('captureException records fingerprint + stack', () => {
    const sentry = createSentryMock();
    const fp = sentry.captureException(new Error('db down'), { tags: { region: 'us' } });
    expect(fp).toMatch(/^fp_[0-9a-f]+$/);
    expect(sentry.collector.hasException(fp)).toBe(true);
    expect(sentry.collector.exceptions[0]?.tags.region).toBe('us');
  });

  it('addBreadcrumb attaches to next captureException, then clears', () => {
    const sentry = createSentryMock();
    sentry.addBreadcrumb({ category: 'ui', message: 'clicked-button' });
    sentry.addBreadcrumb({ category: 'net', message: 'fetch /api' });
    sentry.captureException(new Error('boom'));
    // next capture starts with empty breadcrumbs
    sentry.captureException(new Error('boom2'));
    expect(sentry.collector.exceptions[0]?.breadcrumbs).toHaveLength(2);
    expect(sentry.collector.exceptions[1]?.breadcrumbs).toHaveLength(0);
  });

  it('startTransaction records name / op / lifecycle', () => {
    let clock = 0;
    const sentry = createSentryMock({ now: () => clock });
    const tx = sentry.startTransaction({ name: 'checkout', op: 'http.server' });
    clock = 50;
    tx.finish();
    expect(sentry.collector.transactions[0]?.name).toBe('checkout');
    expect(sentry.collector.transactions[0]?.operation).toBe('http.server');
    expect(sentry.collector.transactions[0]?.endedAt).toBe(50);
  });

  it('same message produces same fingerprint (dedupe)', () => {
    const sentry = createSentryMock();
    const a = sentry.captureException(new Error('same'));
    const b = sentry.captureException(new Error('same'));
    expect(a).toBe(b);
  });
});

describe('TelemetryCollector shared shape', () => {
  it('clear resets all sinks', () => {
    const otel = createOtelMock();
    otel.tracer.startSpan('x').end();
    otel.meter.createCounter('c').add(1);
    otel.logger.emit({ level: 'info', message: 'hi', attributes: {} });
    otel.collector.clear();
    expect(otel.collector.spans).toHaveLength(0);
    expect(otel.collector.metrics).toHaveLength(0);
    expect(otel.collector.logs).toHaveLength(0);
  });
});
