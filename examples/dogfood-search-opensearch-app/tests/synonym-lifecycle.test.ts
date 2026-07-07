/**
 * Synonym lifecycle tests — walk the synonym-advanced-axis end-to-end
 * (start session → register synonyms → expandMultiLanguage → phonetic
 * match → stemmer normalize → typo bridge) and assert every op appears
 * on the neutral trace and returns the expected result shape. Covers
 * the mock adapter path so the search v0.3 synonym-advanced semantics
 * remain observable.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { OpenSearchAdapter } from '../src/adapters/interface.js';
import { driveSynonymLifecycle } from '../src/flows/search-flows.js';
import { FIXTURE_MULTILINGUAL } from '../src/policies/query-fixtures.js';

function newMock(): OpenSearchAdapter {
  return makeMockAdapter();
}

describe('dogfood-search-opensearch-app — synonym lifecycle', () => {
  it('T-DFSOS-SL-001 startSynonymSession returns the requested backend + indexId + activeLanguage', async () => {
    const mock = newMock();
    const result = await mock.startSynonymSession({
      backend: 'opensearch-oss',
      indexId: 'idx-syn',
      activeLanguage: 'ja',
    });
    expect(result.backend).toBe('opensearch-oss');
    expect(result.indexId).toBe('idx-syn');
    expect(result.activeLanguage).toBe('ja');
  });

  it('T-DFSOS-SL-002 startSynonymSession defaults activeLanguage to en', async () => {
    const mock = newMock();
    const result = await mock.startSynonymSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
    });
    expect(result.activeLanguage).toBe('en');
  });

  it('T-DFSOS-SL-003 startSynonymSession emits synonym.session_started onto the trace', async () => {
    const mock = newMock();
    await mock.startSynonymSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
    });
    const trace = mock.trace();
    expect(trace).toHaveLength(1);
    expect(trace[0]?.op).toBe('startSynonymSession');
    expect(trace[0]?.neutralEvent).toBe('synonym.session_started');
  });

  it('T-DFSOS-SL-004 registerSynonyms records the entries', async () => {
    const mock = newMock();
    await mock.startSynonymSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
    });
    const result = await mock.registerSynonyms({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      entries: FIXTURE_MULTILINGUAL.synonymEntries,
    });
    expect(result.registeredCount).toBe(FIXTURE_MULTILINGUAL.synonymEntries.length);
  });

  it('T-DFSOS-SL-005 registerSynonyms emits synonym.entries_registered', async () => {
    const mock = newMock();
    await mock.startSynonymSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
    });
    await mock.registerSynonyms({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      entries: FIXTURE_MULTILINGUAL.synonymEntries,
    });
    expect(
      mock.trace().some((e) => e.neutralEvent === 'synonym.entries_registered'),
    ).toBe(true);
  });

  it('T-DFSOS-SL-006 expandMultiLanguage returns base + synonyms for a matching entry', async () => {
    const mock = newMock();
    await mock.startSynonymSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
    });
    await mock.registerSynonyms({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      entries: FIXTURE_MULTILINGUAL.synonymEntries,
    });
    const result = await mock.expandMultiLanguage({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      query: 'car',
      languages: ['en'],
    });
    // "car" + "automobile" + "vehicle" = 3 expanded
    expect(result.expandedCount).toBeGreaterThanOrEqual(3);
    expect(result.expanded).toContain('automobile');
    expect(result.expanded).toContain('vehicle');
  });

  it('T-DFSOS-SL-007 expandMultiLanguage excludes languages not in filter', async () => {
    const mock = newMock();
    await mock.startSynonymSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
    });
    await mock.registerSynonyms({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      entries: FIXTURE_MULTILINGUAL.synonymEntries,
    });
    // Query only in Japanese entries — but ask only for de.
    const result = await mock.expandMultiLanguage({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      query: '車',
      languages: ['de'],
    });
    // Japanese synonyms must not appear when only de is requested.
    expect(result.expanded).not.toContain('自動車');
    expect(result.expanded).not.toContain('クルマ');
  });

  it('T-DFSOS-SL-008 matchPhonetic returns soundex-matched candidates', async () => {
    const mock = newMock();
    await mock.startSynonymSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
    });
    const result = await mock.matchPhonetic({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      query: 'smith',
      candidates: ['smyth', 'smithe', 'smit', 'jones', 'brown'],
    });
    // "smyth" shares the smith soundex code.
    expect(result.matched).toContain('smyth');
    // "jones" / "brown" do not.
    expect(result.matched).not.toContain('jones');
    expect(result.matched).not.toContain('brown');
    expect(result.soundexCode.length).toBe(4);
  });

  it('T-DFSOS-SL-009 matchPhonetic emits synonym.phonetic_matched', async () => {
    const mock = newMock();
    await mock.startSynonymSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
    });
    await mock.matchPhonetic({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      query: 'smith',
      candidates: ['smyth'],
    });
    expect(mock.trace().some((e) => e.neutralEvent === 'synonym.phonetic_matched')).toBe(true);
  });

  it('T-DFSOS-SL-010 normalizeStemmer trims English suffixes', async () => {
    const mock = newMock();
    await mock.startSynonymSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
    });
    const result = await mock.normalizeStemmer({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      tokens: ['running', 'jumped', 'quickly'],
      language: 'en',
    });
    // "running" → "runn" (stripped "ing"). Just confirm the tokens
    // shortened.
    expect(result.normalizedCount).toBe(3);
    for (let i = 0; i < result.normalized.length; i++) {
      const orig = ['running', 'jumped', 'quickly'][i]!;
      expect(result.normalized[i]!.length).toBeLessThan(orig.length);
    }
  });

  it('T-DFSOS-SL-011 normalizeStemmer supports multiple languages', async () => {
    const mock = newMock();
    await mock.startSynonymSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
    });
    const ja = await mock.normalizeStemmer({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      tokens: ['行きます', '来ました'],
      language: 'ja',
    });
    // Japanese: "ます" → "" (stripped), "ました" → "き来" area etc.
    expect(ja.normalizedCount).toBe(2);
  });

  it('T-DFSOS-SL-012 bridgeTypo returns Levenshtein suggestions within maxDistance', async () => {
    const mock = newMock();
    await mock.startSynonymSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
    });
    const result = await mock.bridgeTypo({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      query: 'recieve',
      dictionary: ['receive', 'received', 'reception', 'reconcile'],
      maxDistance: 2,
    });
    // "receive" is 2 char swaps from "recieve" so it must appear.
    expect(result.suggestionCount).toBeGreaterThan(0);
    const terms = result.suggestions.map((s) => s.term);
    expect(terms).toContain('receive');
    // "reconcile" is far — should not appear at distance 2.
    expect(terms).not.toContain('reconcile');
  });

  it('T-DFSOS-SL-013 bridgeTypo respects default maxDistance = 2', async () => {
    const mock = newMock();
    await mock.startSynonymSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
    });
    const result = await mock.bridgeTypo({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      query: 'recieve',
      dictionary: ['receive', 'reconcile'],
    });
    // No maxDistance passed — default 2 → receive matches.
    const terms = result.suggestions.map((s) => s.term);
    expect(terms).toContain('receive');
  });

  it('T-DFSOS-SL-014 registerSynonyms on unstarted bucket throws', async () => {
    const mock = newMock();
    await expect(
      mock.registerSynonyms({
        bucket: 'opensearch-oss',
        indexId: 'nope',
        entries: [],
      }),
    ).rejects.toThrow(/has not been started/);
  });

  it('T-DFSOS-SL-015 driveSynonymLifecycle emits every synonym op onto the trace', async () => {
    const mock = newMock();
    await driveSynonymLifecycle(mock, {
      backend: 'opensearch-oss',
      indexId: 'lifecycle-syn',
      fixture: FIXTURE_MULTILINGUAL,
    });
    const ops = new Set(mock.trace().map((t) => t.op));
    expect(ops.has('startSynonymSession')).toBe(true);
    expect(ops.has('registerSynonyms')).toBe(true);
    expect(ops.has('expandMultiLanguage')).toBe(true);
    expect(ops.has('matchPhonetic')).toBe(true);
    expect(ops.has('normalizeStemmer')).toBe(true);
    expect(ops.has('bridgeTypo')).toBe(true);
  });
});
