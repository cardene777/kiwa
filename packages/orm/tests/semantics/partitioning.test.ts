import { describe, expect, it } from 'vitest';
import {
  backendEventName,
  createPartitioningSession,
  declarePartition,
  partitionWiseJoin,
  prunePartitions,
  routeInsert,
  type OrmBackend,
  type OrmProvider,
} from '../../src/index.js';

const providers: OrmProvider[] = ['drizzle', 'prisma', 'kysely'];
const backends: OrmBackend[] = ['postgres', 'mysql', 'sqlite'];

describe('partitioning axis — 3 provider × 3 backend', () => {
  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: declare range → prune → wise-join → route happy path',
    (provider, backend) => {
      const session = createPartitioningSession({ tableId: 'orders', provider, backend });
      declarePartition(session, {
        name: 'orders_2024',
        strategy: 'range',
        bounds: { low: 0, high: 100 },
      });
      declarePartition(session, {
        name: 'orders_2025',
        strategy: 'range',
        bounds: { low: 100, high: 200 },
      });
      const pruned = prunePartitions(session, { predicate: 'ts > 150', keptCount: 1 });
      expect(pruned.metadata.pruned).toBe(1);

      const joined = partitionWiseJoin(session, {
        otherTable: 'shipments',
        matchedBuckets: 2,
      });
      expect(joined.state).toBe('joined');

      const route = routeInsert(session, { key: 50 });
      expect(route.metadata.bucket).toBe('orders_2024');
    },
  );

  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: emits backend dialect',
    (provider, backend) => {
      const session = createPartitioningSession({ tableId: 't', provider, backend });
      const step = declarePartition(session, {
        name: 'b1',
        strategy: 'list',
        bounds: { values: ['x', 'y'] },
      });
      expect(step.backendEvent).toBe(
        backendEventName(backend, 'partition.declared', provider),
      );
    },
  );

  it('declarePartition range rejects missing bounds', () => {
    const session = createPartitioningSession({
      tableId: 't',
      provider: 'drizzle',
      backend: 'postgres',
    });
    expect(() =>
      declarePartition(session, { name: 'b', strategy: 'range', bounds: {} }),
    ).toThrow(/low \+ high/);
  });

  it('declarePartition range rejects high <= low', () => {
    const session = createPartitioningSession({
      tableId: 't',
      provider: 'drizzle',
      backend: 'postgres',
    });
    expect(() =>
      declarePartition(session, {
        name: 'b',
        strategy: 'range',
        bounds: { low: 10, high: 10 },
      }),
    ).toThrow(/high must exceed low/);
  });

  it('declarePartition list rejects empty values', () => {
    const session = createPartitioningSession({
      tableId: 't',
      provider: 'drizzle',
      backend: 'postgres',
    });
    expect(() =>
      declarePartition(session, { name: 'b', strategy: 'list', bounds: { values: [] } }),
    ).toThrow(/values/);
  });

  it('declarePartition hash requires modulus + remainder in range', () => {
    const session = createPartitioningSession({
      tableId: 't',
      provider: 'drizzle',
      backend: 'postgres',
    });
    expect(() =>
      declarePartition(session, {
        name: 'b',
        strategy: 'hash',
        bounds: { modulus: 4, remainder: 5 },
      }),
    ).toThrow(/remainder/);
    expect(() =>
      declarePartition(session, {
        name: 'b',
        strategy: 'hash',
        bounds: { modulus: 0, remainder: 0 },
      }),
    ).toThrow(/modulus must be positive/);
  });

  it('declarePartition rejects duplicate names', () => {
    const session = createPartitioningSession({
      tableId: 't',
      provider: 'drizzle',
      backend: 'postgres',
    });
    declarePartition(session, { name: 'b', strategy: 'list', bounds: { values: ['x'] } });
    expect(() =>
      declarePartition(session, { name: 'b', strategy: 'list', bounds: { values: ['y'] } }),
    ).toThrow(/duplicate/);
  });

  it('prunePartitions requires declared buckets', () => {
    const session = createPartitioningSession({
      tableId: 't',
      provider: 'drizzle',
      backend: 'postgres',
    });
    expect(() => prunePartitions(session, { predicate: 'x', keptCount: 0 })).toThrow(
      /no partitions/,
    );
  });

  it('prunePartitions rejects out-of-range keptCount', () => {
    const session = createPartitioningSession({
      tableId: 't',
      provider: 'drizzle',
      backend: 'postgres',
    });
    declarePartition(session, { name: 'b1', strategy: 'list', bounds: { values: ['x'] } });
    expect(() => prunePartitions(session, { predicate: 'x', keptCount: 5 })).toThrow(
      /out of range/,
    );
  });

  it('partitionWiseJoin rejects undeclared partitions', () => {
    const session = createPartitioningSession({
      tableId: 't',
      provider: 'drizzle',
      backend: 'postgres',
    });
    expect(() => partitionWiseJoin(session, { otherTable: 'x', matchedBuckets: 1 })).toThrow(
      /declared/,
    );
  });

  it('partitionWiseJoin rejects matchedBuckets > declared', () => {
    const session = createPartitioningSession({
      tableId: 't',
      provider: 'drizzle',
      backend: 'postgres',
    });
    declarePartition(session, { name: 'b1', strategy: 'list', bounds: { values: [1] } });
    expect(() => partitionWiseJoin(session, { otherTable: 'x', matchedBuckets: 2 })).toThrow(
      /exceeds declared/,
    );
  });

  it('routeInsert picks correct list / hash bucket', () => {
    const session = createPartitioningSession({
      tableId: 't',
      provider: 'drizzle',
      backend: 'postgres',
    });
    declarePartition(session, {
      name: 'listA',
      strategy: 'list',
      bounds: { values: ['a', 'b'] },
    });
    declarePartition(session, {
      name: 'listB',
      strategy: 'list',
      bounds: { values: ['c'] },
    });
    const listStep = routeInsert(session, { key: 'c' });
    expect(listStep.metadata.bucket).toBe('listB');

    const hashSession = createPartitioningSession({
      tableId: 't2',
      provider: 'drizzle',
      backend: 'postgres',
    });
    declarePartition(hashSession, {
      name: 'h_even',
      strategy: 'hash',
      bounds: { modulus: 2, remainder: 0 },
    });
    declarePartition(hashSession, {
      name: 'h_odd',
      strategy: 'hash',
      bounds: { modulus: 2, remainder: 1 },
    });
    const hashStep = routeInsert(hashSession, { key: 5 });
    expect(hashStep.metadata.bucket).toBe('h_odd');
  });

  it('routeInsert throws when no bucket matches', () => {
    const session = createPartitioningSession({
      tableId: 't',
      provider: 'drizzle',
      backend: 'postgres',
    });
    declarePartition(session, {
      name: 'r',
      strategy: 'range',
      bounds: { low: 0, high: 10 },
    });
    expect(() => routeInsert(session, { key: 100 })).toThrow(/no bucket matches/);
  });
});
