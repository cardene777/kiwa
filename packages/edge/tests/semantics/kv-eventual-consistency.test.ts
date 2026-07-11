import { describe, expect, it } from 'vitest';
import {
  forceConvergence,
  observeRead,
  platformEventName,
  recordWriteQuorum,
  startKvConsistency,
  type EdgePlatform,
} from '../../src/index.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];

describe('kv-eventual-consistency axis — 3 platform', () => {
  it.each(platforms)('%s: write then read at same ts = read-your-writes converged', (platform) => {
    const session = startKvConsistency({ platform });
    recordWriteQuorum(session, { key: 'k1', ts: 100 });
    const read = observeRead(session, { key: 'k1', readTs: 100, replicaId: 'r1' });
    expect(read.state).toBe('converged');
    expect(read.neutralEvent).toBe('kv-consistency.read-your-writes');
    expect(read.platformEvent).toBe(platformEventName(platform, 'kv-consistency.read-your-writes'));
  });

  it('read older than last write = stale-read', () => {
    const session = startKvConsistency({ platform: 'cloudflare' });
    recordWriteQuorum(session, { key: 'k1', ts: 100 });
    const read = observeRead(session, { key: 'k1', readTs: 50, replicaId: 'r-lag' });
    expect(read.state).toBe('stale');
    expect(read.neutralEvent).toBe('kv-consistency.stale-read');
    expect(read.metadata).toMatchObject({ readTs: 50, writeTs: 100 });
  });

  it('monotonic-reads violation: earlier ts after later observed', () => {
    const session = startKvConsistency({ platform: 'vercel' });
    recordWriteQuorum(session, { key: 'k1', ts: 100 });
    observeRead(session, { key: 'k1', readTs: 100, replicaId: 'r1' });
    const violated = observeRead(session, { key: 'k1', readTs: 80, replicaId: 'r-stale' });
    expect(violated.state).toBe('violated');
    expect(violated.neutralEvent).toBe('kv-consistency.monotonic-violation');
    expect(violated.metadata).toMatchObject({ priorObserved: 100, readTs: 80 });
  });

  it('write-quorum records last-writer-wins on same key', () => {
    const session = startKvConsistency({ platform: 'deno' });
    recordWriteQuorum(session, { key: 'k1', ts: 50 });
    recordWriteQuorum(session, { key: 'k1', ts: 100 });
    recordWriteQuorum(session, { key: 'k1', ts: 80 });
    expect(session.writes['k1']).toBe(100);
  });

  it('forceConvergence advances observed pointer to latest write per key', () => {
    const session = startKvConsistency({ platform: 'cloudflare' });
    recordWriteQuorum(session, { key: 'a', ts: 50 });
    recordWriteQuorum(session, { key: 'b', ts: 100 });
    observeRead(session, { key: 'a', readTs: 30, replicaId: 'r' });
    observeRead(session, { key: 'b', readTs: 100, replicaId: 'r' });
    const reconciled = forceConvergence(session);
    expect(reconciled).toBe(1);
    expect(session.observed['a']).toBe(50);
    expect(session.observed['b']).toBe(100);
  });

  it('forceConvergence treats never-observed key as observed=0 (defensive fallback)', () => {
    const session = startKvConsistency({ platform: 'vercel' });
    recordWriteQuorum(session, { key: 'lonely', ts: 42 });
    const reconciled = forceConvergence(session);
    expect(reconciled).toBe(1);
    expect(session.observed['lonely']).toBe(42);
  });

  it('unwritten key read is treated as converged (writeTs=0)', () => {
    const session = startKvConsistency({ platform: 'vercel' });
    const read = observeRead(session, { key: 'new-key', readTs: 0, replicaId: 'r' });
    expect(read.state).toBe('converged');
  });

  it('write-quorum step carries platform-specific event name', () => {
    const session = startKvConsistency({ platform: 'deno' });
    const step = recordWriteQuorum(session, { key: 'k1', ts: 1 });
    expect(step.platformEvent).toBe(platformEventName('deno', 'kv-consistency.write-quorum'));
  });

  it('accumulates full history in order', () => {
    const session = startKvConsistency({ platform: 'cloudflare' });
    recordWriteQuorum(session, { key: 'k1', ts: 100 });
    observeRead(session, { key: 'k1', readTs: 100, replicaId: 'r1' });
    observeRead(session, { key: 'k1', readTs: 80, replicaId: 'r2' });
    expect(session.history.map((s) => s.neutralEvent)).toEqual([
      'kv-consistency.write-quorum',
      'kv-consistency.read-your-writes',
      'kv-consistency.monotonic-violation',
    ]);
  });
});
