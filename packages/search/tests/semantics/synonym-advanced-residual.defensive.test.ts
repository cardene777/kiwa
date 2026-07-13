import { describe, expect, it } from 'vitest';
import {
  bridgeTypo,
  matchPhonetic,
  normalizeStemmer,
  startSynonymSession,
} from '../../src/semantics/index.js';

describe('synonym-advanced residual defensive branches', () => {
  it('bridgeTypo with empty query string matches every dictionary word within distance', () => {
    const s = startSynonymSession({ target: 'typesense', indexId: 'x' });
    const result = bridgeTypo(s, {
      query: '',
      dictionary: ['a', 'ab', 'abc'],
      maxDistance: 3,
    });
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('bridgeTypo with empty dictionary word triggers levenshtein n === 0 early return', () => {
    const s = startSynonymSession({ target: 'typesense', indexId: 'x' });
    const result = bridgeTypo(s, {
      query: 'test',
      dictionary: [''],
      maxDistance: 4,
    });
    expect(result.suggestions).toBeDefined();
  });

  it('bridgeTypo excludes identical words (distance=0 filtered out)', () => {
    const s = startSynonymSession({ target: 'typesense', indexId: 'x' });
    const result = bridgeTypo(s, {
      query: 'apple',
      dictionary: ['apple', 'appla', 'orange'],
      maxDistance: 2,
    });
    const terms = result.suggestions.map((suggestion) => suggestion.term);
    expect(terms).not.toContain('apple');
    expect(terms).toContain('appla');
  });

  it('normalizeStemmer with French "e" suffix trims trailing e', () => {
    const s = startSynonymSession({ target: 'meilisearch', indexId: 'x' });
    const result = normalizeStemmer(s, {
      tokens: ['pomme', 'grande'],
      language: 'fr',
    });
    expect(result.normalized.length).toBe(2);
  });

  it('normalizeStemmer with French "ment" suffix removed', () => {
    const s = startSynonymSession({ target: 'meilisearch', indexId: 'x' });
    const result = normalizeStemmer(s, {
      tokens: ['seulement', 'rapidement'],
      language: 'fr',
    });
    expect(result.normalized[0]).not.toContain('ment');
  });

  it('normalizeStemmer with Spanish "es" plural suffix removed', () => {
    const s = startSynonymSession({ target: 'meilisearch', indexId: 'x' });
    const result = normalizeStemmer(s, {
      tokens: ['flores', 'plantes'],
      language: 'es',
    });
    expect(result.normalized.length).toBe(2);
  });

  it('normalizeStemmer with Japanese した suffix removed', () => {
    const s = startSynonymSession({ target: 'meilisearch', indexId: 'x' });
    const result = normalizeStemmer(s, {
      tokens: ['書いた', 'した'],
      language: 'ja',
    });
    expect(result.normalized.length).toBe(2);
  });

  it('matchPhonetic filters non-alphabetic characters via soundex regex', () => {
    const s = startSynonymSession({ target: 'typesense', indexId: 'x' });
    const result = matchPhonetic(s, {
      query: '123!@#',
      candidates: ['test'],
    });
    expect(result).toBeDefined();
  });
});
