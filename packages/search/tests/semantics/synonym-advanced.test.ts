import { describe, expect, it } from 'vitest';
import {
  bridgeTypo,
  expandMultiLanguage,
  matchPhonetic,
  normalizeStemmer,
  registerSynonyms,
  startSynonymSession,
} from '../../src/semantics/index.js';

describe('synonym-advanced axis — happy path', () => {
  it('expands multi-language synonym entries', () => {
    const s = startSynonymSession({ target: 'meilisearch', indexId: 'x' });
    registerSynonyms(s, [
      { base: 'car', synonyms: ['automobile', 'vehicle'], language: 'en' },
      { base: 'coche', synonyms: ['automóvil'], language: 'es' },
    ]);
    const { expanded } = expandMultiLanguage(s, {
      query: 'car',
      languages: ['en', 'es'],
    });
    expect(expanded).toContain('car');
    expect(expanded).toContain('automobile');
    expect(expanded).toContain('vehicle');
  });

  it('bidirectional expansion works from synonym to base', () => {
    const s = startSynonymSession({ target: 'typesense', indexId: 'x' });
    registerSynonyms(s, [
      { base: 'car', synonyms: ['automobile'], language: 'en' },
    ]);
    const { expanded } = expandMultiLanguage(s, {
      query: 'automobile',
      languages: ['en'],
    });
    expect(expanded).toContain('car');
  });

  it('phonetic match uses soundex codes', () => {
    const s = startSynonymSession({ target: 'algolia', indexId: 'x' });
    const { matched } = matchPhonetic(s, {
      query: 'Robert',
      candidates: ['Rupert', 'Robbert', 'Alice', 'Robb'],
    });
    expect(matched).toContain('Rupert');
    expect(matched).toContain('Robbert');
    expect(matched).not.toContain('Alice');
  });

  it('stemmer normalizes English suffixes', () => {
    const s = startSynonymSession({ target: 'meilisearch', indexId: 'x' });
    const { normalized } = normalizeStemmer(s, {
      tokens: ['running', 'jumped', 'happily', 'fastes'],
      language: 'en',
    });
    expect(normalized[0]).toBe('runn');
    expect(normalized[1]).toBe('jump');
    expect(normalized[2]).toBe('happi');
  });

  it('stemmer supports Japanese polite endings', () => {
    const s = startSynonymSession({ target: 'meilisearch', indexId: 'x' });
    const { normalized } = normalizeStemmer(s, {
      tokens: ['たべます', 'たべました', 'たべない'],
      language: 'ja',
    });
    expect(normalized[0]).toBe('たべ');
    expect(normalized[1]).toBe('たべま');
    expect(normalized[2]).toBe('たべ');
  });

  it('typo bridge suggests near-distance terms', () => {
    const s = startSynonymSession({ target: 'opensearch-oss', indexId: 'x' });
    const { suggestions } = bridgeTypo(s, {
      query: 'realtim',
      dictionary: ['realtime', 'random', 'realtor', 'realtimee'],
    });
    expect(suggestions[0]?.term).toBe('realtime');
    expect(suggestions[0]?.distance).toBe(1);
  });

  it('state transitions through 4 events', () => {
    const s = startSynonymSession({ target: 'meilisearch', indexId: 'x' });
    registerSynonyms(s, [{ base: 'car', synonyms: ['auto'], language: 'en' }]);
    expandMultiLanguage(s, { query: 'car', languages: ['en'] });
    matchPhonetic(s, { query: 'Robert', candidates: ['Rupert'] });
    normalizeStemmer(s, { tokens: ['running'], language: 'en' });
    bridgeTypo(s, { query: 'x', dictionary: ['xy'] });
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'synonym.multi_language_expanded',
      'synonym.phonetic_matched',
      'synonym.stemmer_normalized',
      'synonym.typo_bridged',
    ]);
  });

  it('translates provider events for each target', () => {
    for (const target of ['meilisearch', 'typesense', 'algolia', 'opensearch-oss'] as const) {
      const s = startSynonymSession({ target, indexId: 'x' });
      registerSynonyms(s, [{ base: 'car', synonyms: ['auto'], language: 'en' }]);
      const { step } = expandMultiLanguage(s, { query: 'car', languages: ['en'] });
      expect(step.providerEvent).not.toBe(step.neutralEvent);
    }
  });
});

describe('synonym-advanced axis — invariant guards', () => {
  it('rejects empty indexId', () => {
    expect(() => startSynonymSession({ target: 'meilisearch', indexId: '' })).toThrow(
      /indexId must not be empty/,
    );
  });

  it('rejects empty query in expand', () => {
    const s = startSynonymSession({ target: 'meilisearch', indexId: 'x' });
    expect(() => expandMultiLanguage(s, { query: '', languages: ['en'] })).toThrow(
      /query must not be empty/,
    );
  });

  it('rejects empty languages in expand', () => {
    const s = startSynonymSession({ target: 'meilisearch', indexId: 'x' });
    expect(() => expandMultiLanguage(s, { query: 'x', languages: [] })).toThrow(
      /languages must not be empty/,
    );
  });

  it('phonetic match ignores non-letter chars', () => {
    const s = startSynonymSession({ target: 'meilisearch', indexId: 'x' });
    const { matched } = matchPhonetic(s, {
      query: 'R.o.b.e.r.t',
      candidates: ['Robert'],
    });
    expect(matched).toContain('Robert');
  });

  it('typo bridge honors maxDistance', () => {
    const s = startSynonymSession({ target: 'meilisearch', indexId: 'x' });
    const { suggestions } = bridgeTypo(s, {
      query: 'a',
      dictionary: ['ab', 'abc', 'abcd'],
      maxDistance: 1,
    });
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.term).toBe('ab');
  });

  it('typo bridge excludes exact matches (distance = 0)', () => {
    const s = startSynonymSession({ target: 'meilisearch', indexId: 'x' });
    const { suggestions } = bridgeTypo(s, {
      query: 'kiwa',
      dictionary: ['kiwa', 'kiwaa'],
    });
    expect(suggestions.some((sg) => sg.distance === 0)).toBe(false);
  });

  it('stemmer supports German endings', () => {
    const s = startSynonymSession({ target: 'meilisearch', indexId: 'x' });
    const { normalized } = normalizeStemmer(s, {
      tokens: ['kinder', 'schnellen'],
      language: 'de',
    });
    expect(normalized).toContain('kind');
  });

  it('stemmer supports French endings', () => {
    const s = startSynonymSession({ target: 'meilisearch', indexId: 'x' });
    const { normalized } = normalizeStemmer(s, {
      tokens: ['heureux', 'rapidement'],
      language: 'fr',
    });
    expect(normalized).toContain('rapide');
  });

  it('stemmer supports Spanish endings', () => {
    const s = startSynonymSession({ target: 'meilisearch', indexId: 'x' });
    const { normalized } = normalizeStemmer(s, {
      tokens: ['rápidamente', 'corriendo'],
      language: 'es',
    });
    expect(normalized[0]).toBe('rápida');
    expect(normalized[1]).toBe('corr');
  });
});
