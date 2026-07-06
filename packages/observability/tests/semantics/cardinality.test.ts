import { describe, expect, it } from 'vitest';
import {
  bucketHistogram,
  detectHighCardinality,
  reduceLabel,
  scanSeries,
  startCardinalitySession,
} from '../../src/semantics/index.js';

describe('cardinality axis — happy path', () => {
  it('scans series and counts unique metrics', () => {
    const s = startCardinalitySession({ target: 'prometheus', scopeId: 'default' });
    const step = scanSeries(s, [
      { metricName: 'http.requests', labels: { path: '/a', status: '200' } },
      { metricName: 'http.requests', labels: { path: '/b', status: '200' } },
      { metricName: 'db.queries', labels: { table: 'users' } },
    ]);
    expect(step.metadata.seriesCount).toBe(3);
    expect(step.metadata.metricCount).toBe(2);
  });

  it('detects high-cardinality label', () => {
    const s = startCardinalitySession({ target: 'grafana-oss', scopeId: 'x' });
    const series = [];
    for (let i = 0; i < 20; i++) {
      series.push({ metricName: 'http.requests', labels: { userId: `u${i}` } });
    }
    scanSeries(s, series);
    const { step, findings } = detectHighCardinality(s, { threshold: 10 });
    expect(findings).toHaveLength(1);
    expect(findings[0]?.label).toBe('userId');
    expect(findings[0]?.uniqueValues).toBe(20);
    expect(step.metadata.findingCount).toBe(1);
  });

  it('does not flag low-cardinality labels', () => {
    const s = startCardinalitySession({ target: 'loki', scopeId: 'x' });
    scanSeries(s, [
      { metricName: 'http.requests', labels: { method: 'GET' } },
      { metricName: 'http.requests', labels: { method: 'POST' } },
      { metricName: 'http.requests', labels: { method: 'PUT' } },
    ]);
    const { findings } = detectHighCardinality(s, { threshold: 5 });
    expect(findings).toEqual([]);
  });

  it('reduces label and deduplicates series', () => {
    const s = startCardinalitySession({ target: 'otel-collector', scopeId: 'x' });
    scanSeries(s, [
      { metricName: 'http.requests', labels: { path: '/a', userId: 'u1' } },
      { metricName: 'http.requests', labels: { path: '/a', userId: 'u2' } },
      { metricName: 'http.requests', labels: { path: '/b', userId: 'u1' } },
    ]);
    const step = reduceLabel(s, { label: 'userId' });
    expect(step.metadata.beforeCount).toBe(3);
    expect(step.metadata.afterCount).toBe(2);
    expect(s.droppedLabels).toEqual(['userId']);
  });

  it('records histogram bucket boundaries', () => {
    const s = startCardinalitySession({ target: 'prometheus', scopeId: 'x' });
    const step = bucketHistogram(s, { boundaries: [0.1, 0.5, 1, 5, 10] });
    expect(step.metadata.bucketCount).toBe(5);
    expect(step.metadata.minBoundary).toBe(0.1);
    expect(step.metadata.maxBoundary).toBe(10);
  });

  it('translates provider event for each target', () => {
    for (const target of ['grafana-oss', 'prometheus', 'loki', 'otel-collector'] as const) {
      const s = startCardinalitySession({ target, scopeId: 'x' });
      const step = scanSeries(s, [{ metricName: 'm', labels: {} }]);
      expect(step.providerEvent).not.toBe(step.neutralEvent);
    }
  });
});

describe('cardinality axis — invariant guards', () => {
  it('rejects empty scopeId', () => {
    expect(() => startCardinalitySession({ target: 'prometheus', scopeId: '' })).toThrow(/scopeId/);
  });

  it('rejects empty series scan', () => {
    const s = startCardinalitySession({ target: 'prometheus', scopeId: 'x' });
    expect(() => scanSeries(s, [])).toThrow(/must not be empty/);
  });

  it('rejects non-positive threshold', () => {
    const s = startCardinalitySession({ target: 'prometheus', scopeId: 'x' });
    scanSeries(s, [{ metricName: 'm', labels: { l: 'a' } }]);
    expect(() => detectHighCardinality(s, { threshold: 0 })).toThrow(/positive/);
  });

  it('cannot detect high-cardinality before scan', () => {
    const s = startCardinalitySession({ target: 'prometheus', scopeId: 'x' });
    expect(() => detectHighCardinality(s, { threshold: 5 })).toThrow(/scanned first/);
  });

  it('rejects empty label in reduce', () => {
    const s = startCardinalitySession({ target: 'prometheus', scopeId: 'x' });
    scanSeries(s, [{ metricName: 'm', labels: { l: 'a' } }]);
    expect(() => reduceLabel(s, { label: '' })).toThrow(/label/);
  });

  it('rejects empty histogram boundaries', () => {
    const s = startCardinalitySession({ target: 'prometheus', scopeId: 'x' });
    expect(() => bucketHistogram(s, { boundaries: [] })).toThrow(/must not be empty/);
  });

  it('rejects non-strictly-increasing boundaries', () => {
    const s = startCardinalitySession({ target: 'prometheus', scopeId: 'x' });
    expect(() => bucketHistogram(s, { boundaries: [1, 1, 2] })).toThrow(/strictly increasing/);
    expect(() => bucketHistogram(s, { boundaries: [3, 2, 1] })).toThrow(/strictly increasing/);
  });

  it('detects at threshold boundary (>= threshold)', () => {
    const s = startCardinalitySession({ target: 'prometheus', scopeId: 'x' });
    const series = [];
    for (let i = 0; i < 5; i++) {
      series.push({ metricName: 'm', labels: { userId: `u${i}` } });
    }
    scanSeries(s, series);
    const { findings } = detectHighCardinality(s, { threshold: 5 });
    expect(findings).toHaveLength(1);
  });
});
