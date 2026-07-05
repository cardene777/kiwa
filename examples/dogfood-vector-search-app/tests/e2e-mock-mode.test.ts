import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { sampleDocRow } from '../src/adapters/interface.js';
import { ivfFlatIndex, hnswIndex } from '../src/index-store/index.js';
import {
  driveCacheHitRateFlow,
  driveFidelityFlow,
  driveHybridSearchFlow,
  driveIndexBuildFlow,
  driveSemanticSearchFlow,
} from '../src/flows/vector-flows.js';

describe('end-to-end mock-mode integration', () => {
  it('T-DVE-M-001 5-op surface produces 5 ok trace entries', async () => {
    const adapter = makeMockAdapter();
    const docs = [
      sampleDocRow({ documentId: 'o1', embedding: [1, 0, 0, 0] }),
      sampleDocRow({ documentId: 'o2', embedding: [0, 1, 0, 0] }),
    ];
    const index = ivfFlatIndex({ name: 'e2e', dimensions: 4, lists: 2 });
    await driveIndexBuildFlow(adapter, { docs, index });
    await driveSemanticSearchFlow(adapter, {
      docs,
      index,
      distanceKind: 'cosine',
      query: { embedding: [1, 0, 0, 0], keyword: '', topK: 2 },
    });
    await driveHybridSearchFlow(adapter, {
      docs,
      index,
      distanceKind: 'cosine',
      vectorWeight: 0.5,
      query: { embedding: [1, 0, 0, 0], keyword: 'anything', topK: 2 },
    });
    await driveCacheHitRateFlow(adapter, {
      docs,
      lookups: [{ key: 'query-1', expectedEmbedding: [1, 0, 0, 0] }],
    });
    await driveFidelityFlow(adapter);

    const okOps = adapter.traces().filter((t) => t.ok).map((t) => t.op);
    for (const op of [
      'driveIndexBuild',
      'driveSemanticSearch',
      'driveHybridSearch',
      'driveCacheHitRate',
      'emitFidelity',
    ]) {
      expect(okOps).toContain(op);
    }
    await adapter.reset();
  });

  it('T-DVE-M-002 metrics counters accumulate across ops', async () => {
    const adapter = makeMockAdapter();
    const docs = [
      sampleDocRow({ documentId: 'a', embedding: [1, 0, 0, 0] }),
      sampleDocRow({ documentId: 'b', embedding: [0, 1, 0, 0] }),
      sampleDocRow({ documentId: 'c', embedding: [0, 0, 1, 0] }),
    ];
    const index = ivfFlatIndex({ name: 'm-idx', dimensions: 4, lists: 2 });
    await driveIndexBuildFlow(adapter, { docs, index });
    await driveSemanticSearchFlow(adapter, {
      docs,
      index,
      distanceKind: 'cosine',
      query: { embedding: [1, 0, 0, 0], keyword: '', topK: 3 },
    });
    await driveHybridSearchFlow(adapter, {
      docs,
      index,
      distanceKind: 'cosine',
      vectorWeight: 0.5,
      query: { embedding: [1, 0, 0, 0], keyword: 'foo', topK: 3 },
    });
    const m = adapter.metrics();
    expect(m.documentsIndexed).toBe(3);
    expect(m.semanticSearches).toBe(1);
    expect(m.hybridSearches).toBe(1);
    expect(m.latencySamplesMs.length).toBe(3);
    await adapter.reset();
  });

  it('T-DVE-M-003 driveIndexBuild indexes N documents + returns indexed=true', async () => {
    const adapter = makeMockAdapter();
    const docs = [
      sampleDocRow({ documentId: 'a', embedding: [1, 0, 0, 0] }),
      sampleDocRow({ documentId: 'b', embedding: [0, 1, 0, 0] }),
      sampleDocRow({ documentId: 'c', embedding: [0, 0, 1, 0] }),
    ];
    const out = await adapter.driveIndexBuild({
      docs,
      index: hnswIndex({ name: 'hn', dimensions: 4, m: 16, efConstruction: 64 }),
    });
    expect(out.indexKind).toBe('hnsw');
    expect(out.dimensions).toBe(4);
    expect(out.indexed).toBe(true);
    expect(out.documentsIndexed).toBe(3);
    await adapter.reset();
  });

  it('T-DVE-M-004 driveSemanticSearch returns ranked ids ordered by cosine distance', async () => {
    const adapter = makeMockAdapter();
    const docs = [
      sampleDocRow({ documentId: 'far', embedding: [0, 1, 0, 0] }),
      sampleDocRow({ documentId: 'near', embedding: [0.99, 0.01, 0, 0] }),
      sampleDocRow({ documentId: 'exact', embedding: [1, 0, 0, 0] }),
    ];
    const index = ivfFlatIndex({ name: 's', dimensions: 4, lists: 2 });
    const out = await adapter.driveSemanticSearch({
      docs,
      index,
      distanceKind: 'cosine',
      query: { embedding: [1, 0, 0, 0], keyword: '', topK: 3 },
    });
    expect(out.rankedIds).toEqual(['exact', 'near', 'far']);
    expect(out.distances[0]).toBeLessThanOrEqual(out.distances[1]!);
    expect(out.distances[1]).toBeLessThanOrEqual(out.distances[2]!);
    await adapter.reset();
  });

  it('T-DVE-M-005 driveHybridSearch fuses vector + keyword scores', async () => {
    const adapter = makeMockAdapter();
    const docs = [
      sampleDocRow({
        documentId: 'a',
        body: 'apple pie',
        embedding: [1, 0, 0, 0],
      }),
      sampleDocRow({
        documentId: 'b',
        body: 'blueberry pie',
        embedding: [0, 1, 0, 0],
      }),
    ];
    const index = ivfFlatIndex({ name: 'hyb', dimensions: 4, lists: 2 });
    const out = await adapter.driveHybridSearch({
      docs,
      index,
      distanceKind: 'cosine',
      vectorWeight: 0.5,
      query: { embedding: [1, 0, 0, 0], keyword: 'blueberry', topK: 2 },
    });
    expect(out.rankedIds).toHaveLength(2);
    expect(out.vectorWeight).toBe(0.5);
    expect(out.keywordWeight).toBe(0.5);
    await adapter.reset();
  });

  it('T-DVE-M-006 driveCacheHitRate observes cache hits after set + get pattern', async () => {
    const adapter = makeMockAdapter();
    const docs = [sampleDocRow({ documentId: 'a', embedding: [1, 0, 0, 0] })];
    const out = await adapter.driveCacheHitRate({
      docs,
      lookups: [
        { key: 'q1', expectedEmbedding: [1, 0, 0, 0] },
        { key: 'q2', expectedEmbedding: [0, 1, 0, 0] },
      ],
    });
    expect(out.hits).toBeGreaterThan(0);
    expect(out.misses).toBeGreaterThan(0);
    expect(out.hitRate).toBeGreaterThan(0);
    await adapter.reset();
  });

  it('T-DVE-M-007 emitFidelity records a single ok trace', async () => {
    const adapter = makeMockAdapter();
    await adapter.emitFidelity();
    const emit = adapter.traces().filter((t) => t.op === 'emitFidelity');
    expect(emit).toHaveLength(1);
    expect(emit[0]!.ok).toBe(true);
    await adapter.reset();
  });
});
