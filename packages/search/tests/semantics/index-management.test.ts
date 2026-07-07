import { describe, expect, it } from 'vitest';
import {
  advanceRollingReindex,
  allocateShards,
  promoteReplica,
  startIndexMgmtSession,
  swapZeroDowntime,
} from '../../src/semantics/index.js';

describe('index-management axis — happy path', () => {
  it('runs full lifecycle allocate → promote → reindex → swap', () => {
    const s = startIndexMgmtSession({
      target: 'opensearch-oss',
      indexId: 'products-v1',
      shardCount: 3,
      replicaCount: 1,
      nodes: ['n1', 'n2', 'n3'],
    });
    allocateShards(s);
    expect(s.shards.filter((sh) => sh.role === 'primary')).toHaveLength(3);
    const failedNode = s.shards[0]?.nodeId ?? 'n1';
    promoteReplica(s, { shardId: 0, failedNode });
    advanceRollingReindex(s, { batchPercent: 50 });
    advanceRollingReindex(s, { batchPercent: 50 });
    swapZeroDowntime(s, { newIndexId: 'products-v2' });
    expect(s.state).toBe('zero-downtime-swapped');
    expect(s.aliasTarget).toBe('products-v2');
  });

  it('allocation places primary + replica on distinct nodes', () => {
    const s = startIndexMgmtSession({
      target: 'algolia',
      indexId: 'x',
      shardCount: 2,
      replicaCount: 1,
      nodes: ['n1', 'n2'],
    });
    allocateShards(s);
    for (let shardId = 0; shardId < 2; shardId += 1) {
      const nodes = new Set(s.shards.filter((sh) => sh.shardId === shardId).map((sh) => sh.nodeId));
      expect(nodes.size).toBeGreaterThan(1);
    }
  });

  it('rolling reindex percent accumulates', () => {
    const s = startIndexMgmtSession({
      target: 'meilisearch',
      indexId: 'x',
      shardCount: 1,
      replicaCount: 0,
      nodes: ['n1'],
    });
    allocateShards(s);
    const step1 = advanceRollingReindex(s, { batchPercent: 30 });
    expect(step1.metadata.progress).toBe(30);
    const step2 = advanceRollingReindex(s, { batchPercent: 40 });
    expect(step2.metadata.progress).toBe(70);
    const step3 = advanceRollingReindex(s, { batchPercent: 30 });
    expect(step3.metadata.progress).toBe(100);
    expect(step3.metadata.completed).toBe(true);
  });

  it('zero-downtime swap changes aliasTarget without touching original', () => {
    const s = startIndexMgmtSession({
      target: 'typesense',
      indexId: 'v1',
      shardCount: 1,
      replicaCount: 0,
      nodes: ['n1'],
    });
    allocateShards(s);
    advanceRollingReindex(s, { batchPercent: 100 });
    const step = swapZeroDowntime(s, { newIndexId: 'v2' });
    expect(step.metadata.previousAlias).toBe('v1');
    expect(step.metadata.newAlias).toBe('v2');
    expect(s.indexId).toBe('v1');
  });

  it('state transitions through all 4 events', () => {
    const s = startIndexMgmtSession({
      target: 'meilisearch',
      indexId: 'v1',
      shardCount: 1,
      replicaCount: 1,
      nodes: ['n1', 'n2'],
    });
    allocateShards(s);
    promoteReplica(s, { shardId: 0, failedNode: 'n1' });
    advanceRollingReindex(s, { batchPercent: 100 });
    swapZeroDowntime(s, { newIndexId: 'v2' });
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'index.shard_allocated',
      'index.replica_promoted',
      'index.rolling_reindex_advanced',
      'index.zero_downtime_swapped',
    ]);
  });

  it('translates provider events for each target', () => {
    for (const target of ['meilisearch', 'typesense', 'algolia', 'opensearch-oss'] as const) {
      const s = startIndexMgmtSession({
        target,
        indexId: 'x',
        shardCount: 1,
        replicaCount: 0,
        nodes: ['n1'],
      });
      const step = allocateShards(s);
      expect(step.providerEvent).not.toBe(step.neutralEvent);
    }
  });
});

describe('index-management axis — invariant guards', () => {
  it('rejects empty indexId', () => {
    expect(() =>
      startIndexMgmtSession({
        target: 'meilisearch',
        indexId: '',
        shardCount: 1,
        replicaCount: 0,
        nodes: ['n1'],
      }),
    ).toThrow(/indexId must not be empty/);
  });

  it('rejects non-positive shardCount', () => {
    expect(() =>
      startIndexMgmtSession({
        target: 'meilisearch',
        indexId: 'x',
        shardCount: 0,
        replicaCount: 0,
        nodes: ['n1'],
      }),
    ).toThrow(/shardCount must be positive/);
  });

  it('rejects negative replicaCount', () => {
    expect(() =>
      startIndexMgmtSession({
        target: 'meilisearch',
        indexId: 'x',
        shardCount: 1,
        replicaCount: -1,
        nodes: ['n1'],
      }),
    ).toThrow(/replicaCount must be non-negative/);
  });

  it('rejects empty nodes', () => {
    expect(() =>
      startIndexMgmtSession({
        target: 'meilisearch',
        indexId: 'x',
        shardCount: 1,
        replicaCount: 0,
        nodes: [],
      }),
    ).toThrow(/nodes must not be empty/);
  });

  it('rejects allocate when nodes < replica requirement', () => {
    const s = startIndexMgmtSession({
      target: 'meilisearch',
      indexId: 'x',
      shardCount: 1,
      replicaCount: 3,
      nodes: ['n1', 'n2'],
    });
    expect(() => allocateShards(s)).toThrow(/need at least/);
  });

  it('cannot allocate twice', () => {
    const s = startIndexMgmtSession({
      target: 'meilisearch',
      indexId: 'x',
      shardCount: 1,
      replicaCount: 0,
      nodes: ['n1'],
    });
    allocateShards(s);
    expect(() => allocateShards(s)).toThrow(/not idle/);
  });

  it('promoteReplica requires primary + replica present', () => {
    const s = startIndexMgmtSession({
      target: 'meilisearch',
      indexId: 'x',
      shardCount: 1,
      replicaCount: 0,
      nodes: ['n1'],
    });
    allocateShards(s);
    expect(() => promoteReplica(s, { shardId: 0, failedNode: 'n1' })).toThrow(/no replica/);
  });

  it('promoteReplica requires primary to exist on failedNode', () => {
    const s = startIndexMgmtSession({
      target: 'meilisearch',
      indexId: 'x',
      shardCount: 1,
      replicaCount: 1,
      nodes: ['n1', 'n2'],
    });
    allocateShards(s);
    expect(() => promoteReplica(s, { shardId: 0, failedNode: 'unknown' })).toThrow(
      /primary shard 0 on unknown/,
    );
  });

  it('reindex rejects batchPercent out of range', () => {
    const s = startIndexMgmtSession({
      target: 'meilisearch',
      indexId: 'x',
      shardCount: 1,
      replicaCount: 0,
      nodes: ['n1'],
    });
    allocateShards(s);
    expect(() => advanceRollingReindex(s, { batchPercent: 0 })).toThrow(/batchPercent must be/);
    expect(() => advanceRollingReindex(s, { batchPercent: 101 })).toThrow(/batchPercent must be/);
  });

  it('cannot advance reindex after swap', () => {
    const s = startIndexMgmtSession({
      target: 'meilisearch',
      indexId: 'v1',
      shardCount: 1,
      replicaCount: 0,
      nodes: ['n1'],
    });
    allocateShards(s);
    advanceRollingReindex(s, { batchPercent: 100 });
    swapZeroDowntime(s, { newIndexId: 'v2' });
    expect(() => advanceRollingReindex(s, { batchPercent: 10 })).toThrow(/already swapped/);
  });

  it('cannot swap before reindex completes', () => {
    const s = startIndexMgmtSession({
      target: 'meilisearch',
      indexId: 'v1',
      shardCount: 1,
      replicaCount: 0,
      nodes: ['n1'],
    });
    allocateShards(s);
    advanceRollingReindex(s, { batchPercent: 50 });
    expect(() => swapZeroDowntime(s, { newIndexId: 'v2' })).toThrow(/reindex-completed/);
  });

  it('rejects empty newIndexId in swap', () => {
    const s = startIndexMgmtSession({
      target: 'meilisearch',
      indexId: 'v1',
      shardCount: 1,
      replicaCount: 0,
      nodes: ['n1'],
    });
    allocateShards(s);
    advanceRollingReindex(s, { batchPercent: 100 });
    expect(() => swapZeroDowntime(s, { newIndexId: '' })).toThrow(/newIndexId must not be empty/);
  });
});
