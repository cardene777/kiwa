import { describe, expect, it } from 'vitest';
import {
  cacheEmbedding,
  classifyIntent,
  crossEncoderRerank,
  startSemanticSession,
  understandQuery,
} from '../../src/semantics/index.js';

describe('semantic axis — happy path', () => {
  it('runs full lifecycle understand → intent → rerank → cache', () => {
    const s = startSemanticSession({ target: 'algolia', sessionId: 'sess-1' });
    understandQuery(s, 'best iphone 15 price');
    classifyIntent(s);
    const rerank = crossEncoderRerank(s, [
      { id: 'a', content: 'best iphone 15 price comparison', baseScore: 0.5 },
      { id: 'b', content: 'android phones', baseScore: 0.4 },
    ]);
    cacheEmbedding(s, 'iphone', [0.1, 0.2, 0.3]);
    expect(rerank.reranked[0]?.id).toBe('a');
    expect(s.state).toBe('embedding-cached');
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'semantic.query_understood',
      'semantic.intent_classified',
      'semantic.cross_encoder_reranked',
      'semantic.embedding_cached',
    ]);
  });

  it('classifies transactional intent for buy/price', () => {
    const s = startSemanticSession({ target: 'meilisearch', sessionId: 'x' });
    understandQuery(s, 'buy iphone discount');
    const step = classifyIntent(s);
    expect(step.metadata.intent).toBe('transactional');
    expect(s.intent).toBe('transactional');
  });

  it('classifies commercial intent for compare', () => {
    const s = startSemanticSession({ target: 'meilisearch', sessionId: 'x' });
    understandQuery(s, 'iphone vs pixel best review');
    classifyIntent(s);
    expect(s.intent).toBe('commercial');
  });

  it('classifies navigational intent for login/homepage', () => {
    const s = startSemanticSession({ target: 'meilisearch', sessionId: 'x' });
    understandQuery(s, 'apple login official');
    classifyIntent(s);
    expect(s.intent).toBe('navigational');
  });

  it('classifies informational as default', () => {
    const s = startSemanticSession({ target: 'meilisearch', sessionId: 'x' });
    understandQuery(s, 'how does iphone camera work');
    classifyIntent(s);
    expect(s.intent).toBe('informational');
  });

  it('fused score = 0.5*cross + 0.5*base', () => {
    const s = startSemanticSession({ target: 'typesense', sessionId: 'x' });
    understandQuery(s, 'apple pie recipe');
    classifyIntent(s);
    const { reranked } = crossEncoderRerank(s, [
      { id: 'a', content: 'apple pie recipe traditional', baseScore: 0.8 },
      { id: 'b', content: 'unrelated text', baseScore: 0.9 },
    ]);
    expect(reranked[0]?.id).toBe('a');
  });

  it('normalizes rawQuery to trimmed lowercase', () => {
    const s = startSemanticSession({ target: 'algolia', sessionId: 'x' });
    understandQuery(s, '  HELLO World  ');
    expect(s.normalizedQuery).toBe('hello world');
  });

  it('uses default rerank model when not overridden', () => {
    const s = startSemanticSession({ target: 'algolia', sessionId: 'x' });
    expect(s.rerankModel).toBe('ms-marco-MiniLM-L-6-v2');
  });

  it('accepts custom rerank model', () => {
    const s = startSemanticSession({
      target: 'algolia',
      sessionId: 'x',
      rerankModel: 'bge-reranker-large',
    });
    expect(s.rerankModel).toBe('bge-reranker-large');
  });

  it('translates provider events for each target', () => {
    for (const target of ['meilisearch', 'typesense', 'algolia', 'opensearch-oss'] as const) {
      const s = startSemanticSession({ target, sessionId: 'x' });
      const step = understandQuery(s, 'hello');
      expect(step.providerEvent).not.toBe(step.neutralEvent);
    }
  });
});

describe('semantic axis — invariant guards', () => {
  it('rejects empty sessionId', () => {
    expect(() => startSemanticSession({ target: 'algolia', sessionId: '' })).toThrow(
      /sessionId must not be empty/,
    );
  });

  it('rejects empty query', () => {
    const s = startSemanticSession({ target: 'algolia', sessionId: 'x' });
    expect(() => understandQuery(s, '')).toThrow(/rawQuery must not be empty/);
  });

  it('cannot classify intent before understanding query', () => {
    const s = startSemanticSession({ target: 'algolia', sessionId: 'x' });
    expect(() => classifyIntent(s)).toThrow(/not query-understood/);
  });

  it('rejects empty rerank candidates', () => {
    const s = startSemanticSession({ target: 'algolia', sessionId: 'x' });
    understandQuery(s, 'hello');
    classifyIntent(s);
    expect(() => crossEncoderRerank(s, [])).toThrow(/candidates must not be empty/);
  });

  it('rejects empty embedding key', () => {
    const s = startSemanticSession({ target: 'algolia', sessionId: 'x' });
    expect(() => cacheEmbedding(s, '', [0.1])).toThrow(/key must not be empty/);
  });

  it('rejects empty embedding vector', () => {
    const s = startSemanticSession({ target: 'algolia', sessionId: 'x' });
    expect(() => cacheEmbedding(s, 'k', [])).toThrow(/embedding must not be empty/);
  });

  it('embedding cache retains size across cache calls', () => {
    const s = startSemanticSession({ target: 'algolia', sessionId: 'x' });
    cacheEmbedding(s, 'k1', [0.1]);
    cacheEmbedding(s, 'k2', [0.2]);
    expect(s.embeddingCache.size).toBe(2);
  });

  it('rerank without understand throws', () => {
    const s = startSemanticSession({ target: 'algolia', sessionId: 'x' });
    expect(() => crossEncoderRerank(s, [{ id: 'a', content: 'x', baseScore: 0 }])).toThrow(
      /need intent-classified or query-understood/,
    );
  });
});
