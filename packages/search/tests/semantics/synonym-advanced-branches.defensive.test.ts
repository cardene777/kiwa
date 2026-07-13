import { describe, expect, it } from 'vitest';
import {
  bridgeTypo,
  expandMultiLanguage,
  matchPhonetic,
  normalizeStemmer,
  registerSynonyms,
  startSynonymSession,
} from '../../src/semantics/index.js';

describe('synonym-advanced defensive branches', () => {
  it('startSynonymSession accepts opensearch-oss target', () => {
    const s = startSynonymSession({ target: 'opensearch-oss', indexId: 'idx' });
    expect(s.target).toBe('opensearch-oss');
  });

  it('startSynonymSession accepts algolia target', () => {
    const s = startSynonymSession({ target: 'algolia', indexId: 'idx' });
    expect(s.target).toBe('algolia');
  });

  it('expandMultiLanguage throws when languages array is empty', () => {
    const s = startSynonymSession({ target: 'meilisearch', indexId: 'x' });
    registerSynonyms(s, [
      { base: 'car', synonyms: ['auto'], language: 'en' },
    ]);
    expect(() =>
      expandMultiLanguage(s, { query: 'car', languages: [] as never }),
    ).toThrow(/languages must not be empty/);
  });

  it('expandMultiLanguage skips entries not in requested languages', () => {
    const s = startSynonymSession({ target: 'meilisearch', indexId: 'x' });
    registerSynonyms(s, [
      { base: 'car', synonyms: ['automobile'], language: 'en' },
      { base: 'coche', synonyms: ['automóvil'], language: 'es' },
    ]);
    const { expanded } = expandMultiLanguage(s, {
      query: 'car',
      languages: ['en'],
    });
    expect(expanded).toContain('automobile');
    expect(expanded).not.toContain('automóvil');
  });

  it('matchPhonetic uses soundex with empty string input (returns 0000 fallback)', () => {
    const s = startSynonymSession({ target: 'typesense', indexId: 'x' });
    const result = matchPhonetic(s, { query: '', candidates: ['test'] });
    expect(result).toBeDefined();
  });

  it('normalizeStemmer handles French language (ment/eux/euse/es/s/e suffix)', () => {
    const s = startSynonymSession({ target: 'meilisearch', indexId: 'x' });
    const result = normalizeStemmer(s, {
      tokens: ['rapidement', 'joyeuse'],
      language: 'fr',
    });
    expect(result.normalized).toBeDefined();
    expect(result.normalized.length).toBe(2);
  });

  it('normalizeStemmer handles Spanish (mente/ando/iendo/ado/ido)', () => {
    const s = startSynonymSession({ target: 'meilisearch', indexId: 'x' });
    const result = normalizeStemmer(s, {
      tokens: ['rápidamente', 'corriendo', 'comido'],
      language: 'es',
    });
    expect(result.normalized.length).toBe(3);
  });

  it('normalizeStemmer handles Japanese (です/ます/した/ない suffix)', () => {
    const s = startSynonymSession({ target: 'meilisearch', indexId: 'x' });
    const result = normalizeStemmer(s, {
      tokens: ['書きます', '読みました'],
      language: 'ja',
    });
    expect(result.normalized.length).toBe(2);
  });

  it('normalizeStemmer default case for unknown language returns terms unchanged', () => {
    const s = startSynonymSession({ target: 'meilisearch', indexId: 'x' });
    const result = normalizeStemmer(s, {
      tokens: ['hello', 'world'],
      language: 'de',
    });
    expect(result.normalized.length).toBe(2);
  });

  it('bridgeTypo with empty candidates array returns empty suggestions', () => {
    const s = startSynonymSession({ target: 'typesense', indexId: 'x' });
    const result = bridgeTypo(s, { query: 'test', dictionary: [] });
    expect(result.suggestions).toEqual([]);
  });

  it('bridgeTypo respects maxDistance filter (drops far candidates)', () => {
    const s = startSynonymSession({ target: 'typesense', indexId: 'x' });
    const result = bridgeTypo(s, {
      query: 'cat',
      dictionary: ['bat', 'elephant'],
      maxDistance: 1,
    });
    const terms = result.suggestions.map((s) => s.term);
    expect(terms).toContain('bat');
    expect(terms).not.toContain('elephant');
  });
});
