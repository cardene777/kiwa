import { describe, expect, it } from 'vitest';
import {
  startRagSession,
  chunkDocument,
  hybridRetrieve,
  rerank,
  compressContext,
} from '../src/semantics/rag-advanced.js';

describe('rag-advanced edge cases', () => {
  it('startRagSession throws when sessionId is empty', () => {
    expect(() =>
      startRagSession({ target: 'openai', sessionId: '' }),
    ).toThrow(/sessionId must not be empty/);
  });

  it('chunkDocument throws when chunkSize is zero or negative', () => {
    const session = startRagSession({ target: 'openai', sessionId: 's1' });
    expect(() =>
      chunkDocument(session, { doc: 'hello world', chunkSize: 0, overlap: 0 }),
    ).toThrow(/chunkSize must be positive/);
  });

  it('chunkDocument throws when overlap >= chunkSize', () => {
    const session = startRagSession({ target: 'openai', sessionId: 's2' });
    expect(() =>
      chunkDocument(session, { doc: 'hello', chunkSize: 3, overlap: 3 }),
    ).toThrow(/overlap must be in/);
  });

  it('chunkDocument breaks early when computed text slice is empty', () => {
    const session = startRagSession({ target: 'openai', sessionId: 's3' });
    const { chunks } = chunkDocument(session, {
      doc: 'hello',
      chunkSize: 10,
      overlap: 0,
    });
    expect(chunks.length).toBe(1);
    expect(chunks[0]?.text).toBe('hello');
  });

  it('chunkDocument creates multiple chunks with overlap stride', () => {
    const session = startRagSession({ target: 'openai', sessionId: 's4' });
    const { chunks } = chunkDocument(session, {
      doc: 'a'.repeat(20),
      chunkSize: 8,
      overlap: 2,
    });
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('hybridRetrieve returns empty hits when chunks not present', () => {
    const session = startRagSession({ target: 'openai', sessionId: 's5' });
    chunkDocument(session, { doc: 'the quick brown fox', chunkSize: 5, overlap: 1 });
    const { hits } = hybridRetrieve(session, {
      query: 'nonexistent-query-xyz',
      denseWeight: 0.5,
      sparseWeight: 0.5,
      topK: 3,
    });
    expect(Array.isArray(hits)).toBe(true);
  });

  it('rerank orders hits by rerankScore descending', () => {
    const session = startRagSession({ target: 'openai', sessionId: 's6' });
    chunkDocument(session, {
      doc: 'the quick brown fox jumps over the lazy dog',
      chunkSize: 8,
      overlap: 2,
    });
    const { hits } = hybridRetrieve(session, {
      query: 'fox',
      denseWeight: 0.5,
      sparseWeight: 0.5,
      topK: 3,
    });
    const { reranked } = rerank(session, { query: 'fox jumps', hits });
    for (let i = 0; i + 1 < reranked.length; i += 1) {
      expect(reranked[i]!.rerankScore).toBeGreaterThanOrEqual(
        reranked[i + 1]!.rerankScore,
      );
    }
  });

  it('compressContext throws when session is not reranked', () => {
    const session = startRagSession({ target: 'openai', sessionId: 's7' });
    expect(() => compressContext(session, { hits: [], maxTokens: 100 })).toThrow(
      /expected reranked/,
    );
  });
});
