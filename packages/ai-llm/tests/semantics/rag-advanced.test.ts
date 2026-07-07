import { describe, expect, it } from 'vitest';
import {
  chunkDocument,
  compressContext,
  hybridRetrieve,
  rerank,
  startRagSession,
} from '../../src/semantics/index.js';

describe('startRagSession', () => {
  it('creates idle session', () => {
    const s = startRagSession({ target: 'anthropic', sessionId: 's' });
    expect(s.state).toBe('idle');
    expect(s.chunks).toEqual([]);
  });

  it('throws when sessionId empty', () => {
    expect(() => startRagSession({ target: 'openai', sessionId: '' })).toThrow(
      'sessionId must not be empty',
    );
  });
});

describe('chunkDocument', () => {
  it('splits doc into equal-size chunks with overlap', () => {
    const s = startRagSession({ target: 'anthropic', sessionId: 's' });
    const doc = 'a'.repeat(10);
    const { chunks } = chunkDocument(s, { doc, chunkSize: 4, overlap: 1 });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]?.text).toHaveLength(4);
  });

  it('handles doc shorter than chunk size', () => {
    const s = startRagSession({ target: 'openai', sessionId: 's' });
    const { chunks } = chunkDocument(s, { doc: 'abc', chunkSize: 100, overlap: 0 });
    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.text).toBe('abc');
  });

  it('throws when chunkSize <= 0', () => {
    const s = startRagSession({ target: 'openai', sessionId: 's' });
    expect(() => chunkDocument(s, { doc: 'x', chunkSize: 0, overlap: 0 })).toThrow(
      'chunkSize must be positive',
    );
  });

  it('throws when overlap >= chunkSize', () => {
    const s = startRagSession({ target: 'openai', sessionId: 's' });
    expect(() => chunkDocument(s, { doc: 'x', chunkSize: 5, overlap: 5 })).toThrow(
      'overlap must be in',
    );
  });

  it('throws when overlap negative', () => {
    const s = startRagSession({ target: 'openai', sessionId: 's' });
    expect(() => chunkDocument(s, { doc: 'x', chunkSize: 5, overlap: -1 })).toThrow(
      'overlap must be in',
    );
  });

  it('stores chunks in session', () => {
    const s = startRagSession({ target: 'openai', sessionId: 's' });
    chunkDocument(s, { doc: 'abcdef', chunkSize: 3, overlap: 0 });
    expect(s.chunks.length).toBeGreaterThan(0);
  });
});

describe('hybridRetrieve', () => {
  it('returns topK hits sorted by combined score', () => {
    const s = startRagSession({ target: 'anthropic', sessionId: 's' });
    chunkDocument(s, { doc: 'the quick brown fox jumps over the lazy dog', chunkSize: 8, overlap: 2 });
    const { hits } = hybridRetrieve(s, {
      query: 'quick fox',
      denseWeight: 0.5,
      sparseWeight: 0.5,
      topK: 3,
    });
    expect(hits.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < hits.length; i += 1) {
      expect(hits[i - 1]?.score).toBeGreaterThanOrEqual(hits[i]?.score ?? 0);
    }
  });

  it('throws when topK <= 0', () => {
    const s = startRagSession({ target: 'openai', sessionId: 's' });
    chunkDocument(s, { doc: 'abc', chunkSize: 3, overlap: 0 });
    expect(() =>
      hybridRetrieve(s, { query: 'a', denseWeight: 1, sparseWeight: 1, topK: 0 }),
    ).toThrow('topK must be positive');
  });

  it('throws when session not chunked', () => {
    const s = startRagSession({ target: 'openai', sessionId: 's' });
    expect(() =>
      hybridRetrieve(s, { query: 'a', denseWeight: 1, sparseWeight: 1, topK: 3 }),
    ).toThrow('expected chunked');
  });

  it('marks each hit with source dense or sparse', () => {
    const s = startRagSession({ target: 'openai', sessionId: 's' });
    chunkDocument(s, { doc: 'abc def ghi jkl', chunkSize: 4, overlap: 0 });
    const { hits } = hybridRetrieve(s, {
      query: 'abc',
      denseWeight: 1,
      sparseWeight: 1,
      topK: 5,
    });
    for (const h of hits) {
      expect(['dense', 'sparse']).toContain(h.source);
    }
  });
});

describe('rerank', () => {
  it('reorders hits by proximity and length', () => {
    const s = startRagSession({ target: 'anthropic', sessionId: 's' });
    chunkDocument(s, { doc: 'a b c d e f g h', chunkSize: 4, overlap: 1 });
    const { hits } = hybridRetrieve(s, {
      query: 'a b',
      denseWeight: 1,
      sparseWeight: 1,
      topK: 4,
    });
    const { reranked } = rerank(s, { query: 'a b', hits });
    expect(reranked.length).toBe(hits.length);
    for (let i = 1; i < reranked.length; i += 1) {
      expect(reranked[i - 1]?.rerankScore).toBeGreaterThanOrEqual(reranked[i]?.rerankScore ?? 0);
    }
  });

  it('throws when hits empty', () => {
    const s = startRagSession({ target: 'openai', sessionId: 's' });
    chunkDocument(s, { doc: 'a', chunkSize: 1, overlap: 0 });
    hybridRetrieve(s, { query: 'a', denseWeight: 1, sparseWeight: 1, topK: 1 });
    expect(() => rerank(s, { query: 'a', hits: [] })).toThrow('hits must not be empty');
  });

  it('throws when session not hybrid-retrieved', () => {
    const s = startRagSession({ target: 'openai', sessionId: 's' });
    chunkDocument(s, { doc: 'a', chunkSize: 1, overlap: 0 });
    expect(() =>
      rerank(s, { query: 'a', hits: [{ id: 'x', text: 'x', score: 1, source: 'dense' }] }),
    ).toThrow('expected hybrid-retrieved');
  });
});

describe('compressContext', () => {
  it('respects maxTokens budget', () => {
    const s = startRagSession({ target: 'anthropic', sessionId: 's' });
    chunkDocument(s, { doc: 'a b c d e f', chunkSize: 3, overlap: 0 });
    const { hits } = hybridRetrieve(s, {
      query: 'a',
      denseWeight: 1,
      sparseWeight: 1,
      topK: 3,
    });
    const { reranked } = rerank(s, { query: 'a', hits });
    const { totalTokens } = compressContext(s, { hits: reranked, maxTokens: 3 });
    expect(totalTokens).toBeLessThanOrEqual(3);
  });

  it('throws when maxTokens <= 0', () => {
    const s = startRagSession({ target: 'openai', sessionId: 's' });
    chunkDocument(s, { doc: 'abc', chunkSize: 3, overlap: 0 });
    hybridRetrieve(s, { query: 'a', denseWeight: 1, sparseWeight: 1, topK: 1 });
    const hits = [{ id: 'x', text: 'x', score: 1, source: 'dense' as const, rerankScore: 1 }];
    rerank(s, { query: 'a', hits: [{ id: 'x', text: 'x', score: 1, source: 'dense' }] });
    expect(() => compressContext(s, { hits, maxTokens: 0 })).toThrow('maxTokens must be positive');
  });

  it('keeps hits until budget exhausted', () => {
    const s = startRagSession({ target: 'openai', sessionId: 's' });
    chunkDocument(s, { doc: 'a b c d e f g h', chunkSize: 3, overlap: 0 });
    const { hits } = hybridRetrieve(s, {
      query: 'a',
      denseWeight: 1,
      sparseWeight: 1,
      topK: 5,
    });
    const { reranked } = rerank(s, { query: 'a', hits });
    const { keptCount } = compressContext(s, { hits: reranked, maxTokens: 100 });
    expect(keptCount).toBeGreaterThan(0);
  });

  it('throws when session not reranked', () => {
    const s = startRagSession({ target: 'openai', sessionId: 's' });
    expect(() => compressContext(s, { hits: [], maxTokens: 10 })).toThrow('expected reranked');
  });
});

describe('providerEvent dialect', () => {
  it.each(['anthropic', 'openai', 'vercel-ai', 'langchain'] as const)(
    '%s rag events use provider prefix',
    (target) => {
      const s = startRagSession({ target, sessionId: 's' });
      chunkDocument(s, { doc: 'a', chunkSize: 1, overlap: 0 });
      const prefix: Record<string, string> = {
        anthropic: 'anthropic',
        openai: 'openai',
        'vercel-ai': 'vercel',
        langchain: 'langchain',
      };
      expect(s.history[0]?.providerEvent).toContain(prefix[target]!);
    },
  );
});
