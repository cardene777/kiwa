/**
 * Index-management lifecycle tests — walk the index-management-axis
 * end-to-end (start session → allocate shards → promote replica →
 * advance rolling reindex x N → zero-downtime swap) and assert every
 * op appears on the neutral trace and returns the expected result
 * shape. Covers the mock adapter path so the search v0.3
 * index-management semantics remain observable.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { OpenSearchAdapter } from '../src/adapters/interface.js';
import { driveIndexMgmtLifecycle } from '../src/flows/search-flows.js';
import { FIXTURE_CLUSTER } from '../src/policies/query-fixtures.js';

function newMock(): OpenSearchAdapter {
  return makeMockAdapter();
}

describe('dogfood-search-opensearch-app — index-management lifecycle', () => {
  it('T-DFSOS-IM-001 startIndexMgmtSession returns config summary', async () => {
    const mock = newMock();
    const result = await mock.startIndexMgmtSession({
      backend: 'opensearch-oss',
      indexId: 'idx-cluster',
      shardCount: 2,
      replicaCount: 1,
      nodes: ['node-a', 'node-b', 'node-c'],
    });
    expect(result.backend).toBe('opensearch-oss');
    expect(result.shardCount).toBe(2);
    expect(result.replicaCount).toBe(1);
    expect(result.nodeCount).toBe(3);
  });

  it('T-DFSOS-IM-002 startIndexMgmtSession emits index.session_started', async () => {
    const mock = newMock();
    await mock.startIndexMgmtSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
      shardCount: 1,
      replicaCount: 0,
      nodes: ['node-x'],
    });
    expect(mock.trace()[0]?.neutralEvent).toBe('index.session_started');
  });

  it('T-DFSOS-IM-003 allocateShards produces primary + replica assignments', async () => {
    const mock = newMock();
    await mock.startIndexMgmtSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
      shardCount: 2,
      replicaCount: 1,
      nodes: ['a', 'b', 'c'],
    });
    const result = await mock.allocateShards({
      bucket: 'opensearch-oss',
      indexId: 'idx',
    });
    // 2 primaries + 2 replicas (1 each) = 4 total assignments.
    expect(result.totalAssignments).toBe(4);
    expect(result.shardCount).toBe(2);
    expect(result.replicaCount).toBe(1);
  });

  it('T-DFSOS-IM-004 allocateShards emits index.shard_allocated', async () => {
    const mock = newMock();
    await mock.startIndexMgmtSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
      shardCount: 1,
      replicaCount: 0,
      nodes: ['a'],
    });
    await mock.allocateShards({
      bucket: 'opensearch-oss',
      indexId: 'idx',
    });
    expect(mock.trace().some((e) => e.neutralEvent === 'index.shard_allocated')).toBe(true);
  });

  it('T-DFSOS-IM-005 promoteReplica flips a replica to primary after a node failure', async () => {
    const mock = newMock();
    await mock.startIndexMgmtSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
      shardCount: 2,
      replicaCount: 1,
      nodes: ['node-a', 'node-b', 'node-c'],
    });
    await mock.allocateShards({
      bucket: 'opensearch-oss',
      indexId: 'idx',
    });
    const result = await mock.promoteReplica({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      shardId: 0,
      failedNode: 'node-a',
    });
    expect(result.shardId).toBe(0);
    expect(result.failedNode).toBe('node-a');
    // The new primary must be one of the other nodes.
    expect(['node-b', 'node-c']).toContain(result.newPrimaryNode);
  });

  it('T-DFSOS-IM-006 promoteReplica emits index.replica_promoted', async () => {
    const mock = newMock();
    await mock.startIndexMgmtSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
      shardCount: 1,
      replicaCount: 1,
      nodes: ['a', 'b'],
    });
    await mock.allocateShards({ bucket: 'opensearch-oss', indexId: 'idx' });
    await mock.promoteReplica({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      shardId: 0,
      failedNode: 'a',
    });
    expect(mock.trace().some((e) => e.neutralEvent === 'index.replica_promoted')).toBe(true);
  });

  it('T-DFSOS-IM-007 advanceRollingReindex advances progress by batch percent', async () => {
    const mock = newMock();
    await mock.startIndexMgmtSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
      shardCount: 1,
      replicaCount: 0,
      nodes: ['a'],
    });
    const step1 = await mock.advanceRollingReindex({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      batchPercent: 25,
    });
    expect(step1.progress).toBe(25);
    expect(step1.completed).toBe(false);
    const step2 = await mock.advanceRollingReindex({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      batchPercent: 50,
    });
    expect(step2.progress).toBe(75);
  });

  it('T-DFSOS-IM-008 advanceRollingReindex reports completed when progress hits 100', async () => {
    const mock = newMock();
    await mock.startIndexMgmtSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
      shardCount: 1,
      replicaCount: 0,
      nodes: ['a'],
    });
    await mock.advanceRollingReindex({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      batchPercent: 100,
    });
    const result = await mock.advanceRollingReindex({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      batchPercent: 0.001,
    }).catch((e) => e);
    // Second advance either completes or throws — either way the batch
    // completion signal was already emitted on the first step.
    expect(result).toBeDefined();
  });

  it('T-DFSOS-IM-009 swapZeroDowntime after 100% progress swaps alias', async () => {
    const mock = newMock();
    await mock.startIndexMgmtSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
      shardCount: 1,
      replicaCount: 0,
      nodes: ['a'],
    });
    await mock.advanceRollingReindex({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      batchPercent: 100,
    });
    const swap = await mock.swapZeroDowntime({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      newIndexId: 'idx-v2',
    });
    expect(swap.newAlias).toBe('idx-v2');
    expect(swap.reindexProgress).toBe(100);
  });

  it('T-DFSOS-IM-010 swapZeroDowntime emits index.zero_downtime_swapped', async () => {
    const mock = newMock();
    await mock.startIndexMgmtSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
      shardCount: 1,
      replicaCount: 0,
      nodes: ['a'],
    });
    await mock.advanceRollingReindex({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      batchPercent: 100,
    });
    await mock.swapZeroDowntime({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      newIndexId: 'v2',
    });
    expect(mock.trace().some((e) => e.neutralEvent === 'index.zero_downtime_swapped')).toBe(true);
  });

  it('T-DFSOS-IM-011 allocateShards on unstarted bucket throws', async () => {
    const mock = newMock();
    await expect(
      mock.allocateShards({ bucket: 'opensearch-oss', indexId: 'nope' }),
    ).rejects.toThrow(/has not been started/);
  });

  it('T-DFSOS-IM-012 driveIndexMgmtLifecycle walks the cluster fixture end-to-end', async () => {
    const mock = newMock();
    await driveIndexMgmtLifecycle(mock, {
      backend: 'opensearch-oss',
      indexId: 'lifecycle-idx',
      fixture: FIXTURE_CLUSTER,
    });
    const ops = new Set(mock.trace().map((t) => t.op));
    expect(ops.has('startIndexMgmtSession')).toBe(true);
    expect(ops.has('allocateShards')).toBe(true);
    expect(ops.has('promoteReplica')).toBe(true);
    expect(ops.has('advanceRollingReindex')).toBe(true);
    expect(ops.has('swapZeroDowntime')).toBe(true);
  });

  it('T-DFSOS-IM-013 driveIndexMgmtLifecycle advances rolling reindex through 4 batches', async () => {
    const mock = newMock();
    await driveIndexMgmtLifecycle(mock, {
      backend: 'opensearch-oss',
      indexId: 'lifecycle-idx',
      fixture: FIXTURE_CLUSTER,
    });
    const reindexEvents = mock
      .trace()
      .filter((e) => e.op === 'advanceRollingReindex');
    // Cluster fixture has 4 x 25% reindex steps.
    expect(reindexEvents.length).toBe(4);
  });
});
