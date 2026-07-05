import { describe, expect, it } from 'vitest';
import {
  backendEventName,
  buildIndex,
  computeDistance,
  createVectorStoreSession,
  hybridSearch,
  knnSearch,
  type OrmBackend,
  type OrmProvider,
} from '../../src/index.js';

const providers: OrmProvider[] = ['drizzle', 'prisma', 'kysely'];
const backends: OrmBackend[] = ['postgres', 'mysql', 'sqlite'];

describe('vector-store axis — 3 provider × 3 backend', () => {
  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: build IVFFlat → knn → hybrid → distance happy path',
    (provider, backend) => {
      const session = createVectorStoreSession({
        storeId: 'store_1',
        provider,
        backend,
        distanceKind: 'cosine',
      });
      buildIndex(session, {
        name: 'idx',
        kind: 'ivfflat',
        dimensions: 3,
        lists: 10,
      });
      expect(session.state).toBe('indexed');
      const knn = knnSearch(session, { query: [0.1, 0.2, 0.3], k: 5 });
      expect(knn.state).toBe('searched');
      expect(session.searchCount).toBe(1);

      const hybrid = hybridSearch(session, {
        query: [0.1, 0.2, 0.3],
        k: 5,
        keyword: 'foo',
        vectorWeight: 0.7,
      });
      expect(hybrid.metadata.keyword).toBe('foo');
      expect(session.searchCount).toBe(2);

      const distance = computeDistance(session, {
        a: [1, 0, 0],
        b: [0, 1, 0],
      });
      expect(distance.metadata.distance).toBeCloseTo(1, 5);
    },
  );

  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: emits backend dialect',
    (provider, backend) => {
      const session = createVectorStoreSession({
        storeId: 's',
        provider,
        backend,
        distanceKind: 'l2',
      });
      const step = buildIndex(session, {
        name: 'idx',
        kind: 'hnsw',
        dimensions: 2,
        m: 8,
        efConstruction: 40,
      });
      expect(step.backendEvent).toBe(backendEventName(backend, 'vector.indexed', provider));
    },
  );

  it('buildIndex rejects zero dimensions', () => {
    const session = createVectorStoreSession({
      storeId: 's',
      provider: 'drizzle',
      backend: 'postgres',
      distanceKind: 'cosine',
    });
    expect(() =>
      buildIndex(session, { name: 'i', kind: 'ivfflat', dimensions: 0, lists: 1 }),
    ).toThrow(/dimensions/);
  });

  it('buildIndex ivfflat requires positive lists', () => {
    const session = createVectorStoreSession({
      storeId: 's',
      provider: 'drizzle',
      backend: 'postgres',
      distanceKind: 'cosine',
    });
    expect(() =>
      buildIndex(session, { name: 'i', kind: 'ivfflat', dimensions: 3, lists: 0 }),
    ).toThrow(/lists/);
  });

  it('buildIndex hnsw requires positive m + efConstruction', () => {
    const session = createVectorStoreSession({
      storeId: 's',
      provider: 'drizzle',
      backend: 'postgres',
      distanceKind: 'cosine',
    });
    expect(() =>
      buildIndex(session, { name: 'i', kind: 'hnsw', dimensions: 3, m: 0, efConstruction: 40 }),
    ).toThrow(/m/);
    expect(() =>
      buildIndex(session, {
        name: 'i',
        kind: 'hnsw',
        dimensions: 3,
        m: 8,
        efConstruction: 0,
      }),
    ).toThrow(/efConstruction/);
  });

  it('knnSearch requires built index', () => {
    const session = createVectorStoreSession({
      storeId: 's',
      provider: 'drizzle',
      backend: 'postgres',
      distanceKind: 'cosine',
    });
    expect(() => knnSearch(session, { query: [0], k: 1 })).toThrow(/no index/);
  });

  it('knnSearch rejects dim mismatch and k <= 0', () => {
    const session = createVectorStoreSession({
      storeId: 's',
      provider: 'drizzle',
      backend: 'postgres',
      distanceKind: 'cosine',
    });
    buildIndex(session, { name: 'i', kind: 'ivfflat', dimensions: 3, lists: 1 });
    expect(() => knnSearch(session, { query: [1, 2], k: 5 })).toThrow(/query dim/);
    expect(() => knnSearch(session, { query: [1, 2, 3], k: 0 })).toThrow(/k/);
  });

  it('hybridSearch rejects vectorWeight out of [0, 1]', () => {
    const session = createVectorStoreSession({
      storeId: 's',
      provider: 'drizzle',
      backend: 'postgres',
      distanceKind: 'cosine',
    });
    buildIndex(session, { name: 'i', kind: 'ivfflat', dimensions: 3, lists: 1 });
    expect(() =>
      hybridSearch(session, {
        query: [1, 2, 3],
        k: 1,
        keyword: 'x',
        vectorWeight: 1.5,
      }),
    ).toThrow(/vectorWeight/);
    expect(() =>
      hybridSearch(session, {
        query: [1, 2, 3],
        k: 1,
        keyword: 'x',
        vectorWeight: -0.1,
      }),
    ).toThrow(/vectorWeight/);
  });

  it('hybridSearch rejects empty keyword and dim mismatch', () => {
    const session = createVectorStoreSession({
      storeId: 's',
      provider: 'drizzle',
      backend: 'postgres',
      distanceKind: 'cosine',
    });
    buildIndex(session, { name: 'i', kind: 'ivfflat', dimensions: 3, lists: 1 });
    expect(() =>
      hybridSearch(session, {
        query: [1, 2, 3],
        k: 1,
        keyword: '',
        vectorWeight: 0.5,
      }),
    ).toThrow(/keyword required/);
    expect(() =>
      hybridSearch(session, {
        query: [1, 2],
        k: 1,
        keyword: 'x',
        vectorWeight: 0.5,
      }),
    ).toThrow(/query dim/);
  });

  it('hybridSearch also requires built index and positive k', () => {
    const session = createVectorStoreSession({
      storeId: 's',
      provider: 'drizzle',
      backend: 'postgres',
      distanceKind: 'cosine',
    });
    expect(() =>
      hybridSearch(session, { query: [1], k: 1, keyword: 'x', vectorWeight: 0.5 }),
    ).toThrow(/no index/);
    buildIndex(session, { name: 'i', kind: 'ivfflat', dimensions: 3, lists: 1 });
    expect(() =>
      hybridSearch(session, { query: [1, 2, 3], k: 0, keyword: 'x', vectorWeight: 0.5 }),
    ).toThrow(/k/);
  });

  it('computeDistance L2 handles unit vectors', () => {
    const session = createVectorStoreSession({
      storeId: 's',
      provider: 'drizzle',
      backend: 'postgres',
      distanceKind: 'l2',
    });
    const step = computeDistance(session, { a: [0, 0, 0], b: [3, 4, 0] });
    expect(step.metadata.distance).toBeCloseTo(5, 5);
  });

  it('computeDistance inner-product returns negative dot product', () => {
    const session = createVectorStoreSession({
      storeId: 's',
      provider: 'drizzle',
      backend: 'postgres',
      distanceKind: 'inner-product',
    });
    const step = computeDistance(session, { a: [1, 2, 3], b: [4, 5, 6] });
    // dot = 4 + 10 + 18 = 32 → distance = -32
    expect(step.metadata.distance).toBeCloseTo(-32, 5);
  });

  it('computeDistance rejects length mismatch and empty', () => {
    const session = createVectorStoreSession({
      storeId: 's',
      provider: 'drizzle',
      backend: 'postgres',
      distanceKind: 'l2',
    });
    expect(() => computeDistance(session, { a: [1, 2], b: [1] })).toThrow(/length mismatch/);
    expect(() => computeDistance(session, { a: [], b: [] })).toThrow(/empty vectors/);
  });

  it('computeDistance cosine handles zero-norm vectors', () => {
    const session = createVectorStoreSession({
      storeId: 's',
      provider: 'drizzle',
      backend: 'postgres',
      distanceKind: 'cosine',
    });
    const step = computeDistance(session, { a: [0, 0], b: [0, 0] });
    // convention: zero-norm → maximally distant (1.0)
    expect(step.metadata.distance).toBe(1);
  });
});
