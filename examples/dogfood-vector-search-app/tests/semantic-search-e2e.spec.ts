import { describe, expect, it } from 'vitest';
import { createDocumentStore, bm25Score } from '../src/document/index.js';
import {
  createVectorIndexGate,
  hnswIndex,
  ivfFlatIndex,
} from '../src/index-store/index.js';

describe('semantic search — vector index gate + cosine / L2 distance correctness', () => {
  it('T-DVS-001 documentStore refuses upsert with mixed embedding dimensions', () => {
    const store = createDocumentStore();
    store.upsert({ documentId: 'a', body: 'first doc', embedding: [0.1, 0.2, 0.3] });
    expect(() =>
      store.upsert({ documentId: 'b', body: 'wrong dim', embedding: [0.1, 0.2] }),
    ).toThrowError(/dim 2 != store dim 3/);
    expect(store.dimensions()).toBe(3);
  });

  it('T-DVS-002 documentStore captures dim from the first upsert', () => {
    const store = createDocumentStore();
    expect(store.dimensions()).toBeNull();
    store.upsert({ documentId: 'a', body: 'x', embedding: [0.1, 0.2, 0.3, 0.4] });
    expect(store.dimensions()).toBe(4);
    expect(store.size()).toBe(1);
  });

  it('T-DVS-003 bm25Score returns proportion of matched query terms', () => {
    expect(bm25Score('the quick brown fox', 'quick fox')).toBe(1);
    expect(bm25Score('the quick brown fox', 'quick zebra')).toBe(0.5);
    expect(bm25Score('the quick brown fox', 'zebra')).toBe(0);
    expect(bm25Score('the quick brown fox', '')).toBe(0);
  });

  it('T-DVS-004 ivfflat index gate transitions the session to indexed', () => {
    const gate = createVectorIndexGate({ storeId: 'documents', distanceKind: 'cosine' });
    expect(gate.session.state).toBe('unindexed');
    gate.mountIndex(ivfFlatIndex({ name: 'idx-1', dimensions: 4, lists: 8 }));
    expect(gate.session.state).toBe('indexed');
    expect(gate.session.index?.kind).toBe('ivfflat');
  });

  it('T-DVS-005 hnsw index gate transitions the session to indexed', () => {
    const gate = createVectorIndexGate({ storeId: 'documents', distanceKind: 'l2' });
    gate.mountIndex(hnswIndex({ name: 'idx-2', dimensions: 4, m: 16, efConstruction: 64 }));
    expect(gate.session.state).toBe('indexed');
    expect(gate.session.index?.kind).toBe('hnsw');
  });

  it('T-DVS-006 knn without mountIndex throws — search requires index', () => {
    const gate = createVectorIndexGate({ storeId: 'documents', distanceKind: 'cosine' });
    expect(() => gate.knn({ query: [0, 0, 0, 0], k: 3 })).toThrowError(
      /no index mounted/,
    );
  });

  it('T-DVS-007 knn emits vector.knn-searched and bumps searchCount', () => {
    const gate = createVectorIndexGate({ storeId: 'documents', distanceKind: 'cosine' });
    gate.mountIndex(ivfFlatIndex({ name: 'idx', dimensions: 4, lists: 4 }));
    gate.knn({ query: [1, 0, 0, 0], k: 3 });
    expect(gate.session.searchCount).toBe(1);
    const events = gate.session.history.map((s) => s.neutralEvent);
    expect(events).toContain('vector.indexed');
    expect(events).toContain('vector.knn-searched');
  });

  it('T-DVS-008 cosine distance is 0 for identical vectors and 1 for orthogonal', () => {
    const gate = createVectorIndexGate({ storeId: 'documents', distanceKind: 'cosine' });
    const same = gate.distance({ a: [1, 0, 0, 0], b: [1, 0, 0, 0] });
    const ortho = gate.distance({ a: [1, 0, 0, 0], b: [0, 1, 0, 0] });
    expect(same).toBeCloseTo(0, 6);
    expect(ortho).toBeCloseTo(1, 6);
  });

  it('T-DVS-009 L2 distance grows with vector separation', () => {
    const gate = createVectorIndexGate({ storeId: 'documents', distanceKind: 'l2' });
    const near = gate.distance({ a: [0, 0, 0, 0], b: [0.1, 0, 0, 0] });
    const far = gate.distance({ a: [0, 0, 0, 0], b: [1, 0, 0, 0] });
    expect(near).toBeLessThan(far);
    expect(far).toBeCloseTo(1, 6);
  });

  it('T-DVS-010 mountIndex refuses ivfflat without positive lists', () => {
    const gate = createVectorIndexGate({ storeId: 'documents', distanceKind: 'cosine' });
    expect(() =>
      gate.mountIndex({ name: 'bad', kind: 'ivfflat', dimensions: 4, lists: 0 }),
    ).toThrowError(/positive `lists`/);
  });
});
