import { describe, expect, it } from 'vitest';
import {
  SEARCH_AXIS_TO_EVENTS,
  collectFidelityCoverage,
  providerEventName,
  type SearchTarget,
} from '../../src/semantics/index.js';

const providers: SearchTarget[] = ['meilisearch', 'typesense', 'algolia', 'opensearch-oss'];

describe('fidelity harness — 4 provider x 8 axis = 32 grid', () => {
  it('generates 32 rows by default', () => {
    const cov = collectFidelityCoverage();
    expect(cov.rows).toHaveLength(32);
    expect(cov.providers).toEqual(providers);
    expect(cov.axes).toHaveLength(8);
  });

  it('each row has 4 neutral events', () => {
    const cov = collectFidelityCoverage();
    for (const row of cov.rows) {
      expect(row.neutralEvents).toHaveLength(4);
      expect(row.providerEvents).toHaveLength(4);
    }
  });

  it('provider events differ from neutral events per row', () => {
    const cov = collectFidelityCoverage();
    for (const row of cov.rows) {
      for (let i = 0; i < row.neutralEvents.length; i += 1) {
        expect(row.providerEvents[i]).not.toBe(row.neutralEvents[i]);
      }
    }
  });

  it('axis-to-events map covers 32 neutral events across 8 axes', () => {
    let count = 0;
    for (const axis of Object.keys(SEARCH_AXIS_TO_EVENTS)) {
      const events = SEARCH_AXIS_TO_EVENTS[axis as keyof typeof SEARCH_AXIS_TO_EVENTS];
      count += events.length;
    }
    expect(count).toBe(32);
  });

  it('provider event names use a stable per-provider namespace', () => {
    const prefixes: Record<'meilisearch' | 'typesense' | 'algolia' | 'opensearch-oss', RegExp> = {
      meilisearch: /^meili\./,
      typesense: /^typesense\./,
      algolia: /^algolia\./,
      'opensearch-oss': /^opensearch\./,
    };
    const cov = collectFidelityCoverage();
    for (const row of cov.rows) {
      for (const event of row.providerEvents) {
        expect(event).toMatch(prefixes[row.provider]);
      }
    }
  });

  it('can limit providers to a subset', () => {
    const cov = collectFidelityCoverage(['meilisearch', 'typesense']);
    expect(cov.providers).toEqual(['meilisearch', 'typesense']);
    expect(cov.rows).toHaveLength(2 * 8);
  });

  it('providerEventName is idempotent for unknown neutrals', () => {
    // A neutral event we intentionally do not translate (impossible via TypeScript,
    // but the fallback path is worth asserting).
    const unknown = 'unknown.event' as never;
    expect(providerEventName('meilisearch', unknown)).toBe('unknown.event');
  });

  it('every axis is present exactly once per provider', () => {
    const cov = collectFidelityCoverage();
    for (const provider of providers) {
      const axes = new Set(cov.rows.filter((r) => r.provider === provider).map((r) => r.axis));
      expect(axes.size).toBe(8);
    }
  });

  it('no duplicate provider event across axes for a single provider', () => {
    const cov = collectFidelityCoverage();
    for (const provider of providers) {
      const events = cov.rows
        .filter((r) => r.provider === provider)
        .flatMap((r) => r.providerEvents);
      const set = new Set(events);
      expect(set.size).toBe(events.length);
    }
  });
});
