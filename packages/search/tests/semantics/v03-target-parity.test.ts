import { describe, expect, it } from 'vitest';
import {
  SEARCH_AXIS_TO_EVENTS,
  collectFidelityCoverage,
  providerEventName,
  type SearchAxis,
  type SearchTarget,
} from '../../src/semantics/index.js';

const providers: SearchTarget[] = ['meilisearch', 'typesense', 'algolia', 'opensearch-oss'];
const axes = Object.keys(SEARCH_AXIS_TO_EVENTS) as SearchAxis[];

describe('v0.3 target parity — every neutral event resolves per provider', () => {
  for (const provider of providers) {
    for (const axis of axes) {
      for (const event of SEARCH_AXIS_TO_EVENTS[axis]) {
        it(`${provider} translates ${event}`, () => {
          const dialect = providerEventName(provider, event);
          expect(dialect).not.toBe(event);
          expect(dialect.length).toBeGreaterThan(0);
        });
      }
    }
  }
});

describe('v0.3 target parity — static invariants', () => {
  it('all axes are unique', () => {
    expect(new Set(axes).size).toBe(axes.length);
  });

  it('all 4 providers appear in fidelity coverage', () => {
    const cov = collectFidelityCoverage();
    expect(cov.providers).toEqual(providers);
  });

  it('provider dialect namespace uses expected prefix', () => {
    const prefixes: Record<SearchTarget, RegExp> = {
      meilisearch: /^meili\./,
      typesense: /^typesense\./,
      algolia: /^algolia\./,
      'opensearch-oss': /^opensearch\./,
    };
    for (const provider of providers) {
      for (const axis of axes) {
        for (const event of SEARCH_AXIS_TO_EVENTS[axis]) {
          const dialect = providerEventName(provider, event);
          expect(dialect).toMatch(prefixes[provider]);
        }
      }
    }
  });

  it('fidelity providerEvents field matches direct providerEventName lookup', () => {
    const cov = collectFidelityCoverage();
    for (const row of cov.rows) {
      for (let i = 0; i < row.neutralEvents.length; i += 1) {
        const neutral = row.neutralEvents[i];
        const observed = row.providerEvents[i];
        if (!neutral || !observed) continue;
        expect(observed).toBe(providerEventName(row.provider, neutral));
      }
    }
  });

  it('every 8 axis appears in axis-to-events map', () => {
    const expected: SearchAxis[] = [
      'vector',
      'semantic',
      'faceted-advanced',
      'geo',
      'relevance',
      'synonym-advanced',
      'index-management',
      'query-dsl',
    ];
    for (const axis of expected) {
      expect(SEARCH_AXIS_TO_EVENTS[axis]).toBeDefined();
      expect(SEARCH_AXIS_TO_EVENTS[axis].length).toBe(4);
    }
  });
});
