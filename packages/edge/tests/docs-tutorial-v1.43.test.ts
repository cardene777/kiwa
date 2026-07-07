/**
 * v1.43-5 docs 補強 — tutorial 94-96 code snippet 検証。
 *
 * `docs/tutorials/94-serverless-cold-start.md` /
 * `docs/tutorials/95-durable-object-migration.md` /
 * `docs/tutorials/96-global-routing.md` に載っている code snippet が
 * 実際に動作することを behavior test で担保する。
 *
 * tutorial の code snippet が drift すると読者が「動かない」 体験をする
 * ため、 snippet と実 API の乖離を CI で検知する。 v1.17 / v1.19 / v1.20 /
 * v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 / v1.28 / v1.29 /
 * v1.30 / v1.31 / v1.32 / v1.33 / v1.34 / v1.35 / v1.36 / v1.37 / v1.38 /
 * v1.39 / v1.40 / v1.41 / v1.42 と同 pattern (21 milestone 連続 snippet
 * validation streak = v1.23 → v1.43)。
 *
 * v1.43 は @kiwa-test/edge v1.2 advanced 8 axis を扱う (cold-start /
 * middleware-chain / kv-eventual-consistency / r2-multipart / d1-read-replica /
 * do-state-migration / websocket-hibernation / global-routing)。 mock 部分の
 * 動作検証のみ行う (real driver = Cloudflare Workers + Vercel Edge + AWS Lambda +
 * Deno Deploy 実 stack は unit test 範囲外、 dogfood app の env-gate 経路)。
 */
import { describe, expect, it } from 'vitest';
import {
  bumpSchema,
  completeRollout,
  evictExpired,
  initiateMigration,
  invokeColdStart,
  markUnhealthy,
  matchGeo,
  migrateInstance,
  preWarmInstance,
  readFromReplica,
  receiveAnycast,
  reportLag,
  rollbackMigration,
  selectByLatency,
  startColdStartPool,
  startD1,
  startRoutingPool,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Tutorial 94 — Serverless cold-start
// ---------------------------------------------------------------------------

describe('tutorial 94 — cold-start invocation classification', () => {
  it('first invoke is cold', () => {
    const s = startColdStartPool({ platform: 'cloudflare', warmedTtlMs: 60_000 });
    const step = invokeColdStart(s, { instanceId: 'fn-a', nowMs: 0 });
    expect(step.state).toBe('cold');
    expect(step.neutralEvent).toBe('cold-start.invoked');
  });

  it('second invoke within TTL is warm', () => {
    const s = startColdStartPool({ platform: 'cloudflare', warmedTtlMs: 60_000 });
    invokeColdStart(s, { instanceId: 'fn-a', nowMs: 0 });
    const step = invokeColdStart(s, { instanceId: 'fn-a', nowMs: 30_000 });
    expect(step.state).toBe('warm');
    expect(step.neutralEvent).toBe('cold-start.cache-hit');
  });
});

describe('tutorial 94 — pre-warm', () => {
  it('pre-warmed instance skips cold path on next invoke', () => {
    const s = startColdStartPool({ platform: 'vercel' });
    preWarmInstance(s, { instanceId: 'fn-a', nowMs: 0 });
    const step = invokeColdStart(s, { instanceId: 'fn-a', nowMs: 1000 });
    expect(step.state).toBe('warm');
  });
});

describe('tutorial 94 — evict', () => {
  it('removes stale warm entries but keeps provisioned', () => {
    const s = startColdStartPool({
      platform: 'deno',
      warmedTtlMs: 10_000,
      provisionedIds: ['always-on'],
    });
    invokeColdStart(s, { instanceId: 'fn-a', nowMs: 0 });
    invokeColdStart(s, { instanceId: 'always-on', nowMs: 0 });
    const evicted = evictExpired(s, { nowMs: 100_000 });
    expect(evicted).toBe(1);
    expect(s.warmedIds.has('fn-a')).toBe(false);
    expect(s.provisionedIds.has('always-on')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tutorial 95 — DurableObject state migration
// ---------------------------------------------------------------------------

describe('tutorial 95 — schema bump', () => {
  it('initiate then bump moves state to schema-bumped', () => {
    const session = initiateMigration({
      platform: 'cloudflare',
      fromVersion: 1,
      toVersion: 2,
      instanceIds: ['do-a', 'do-b'],
    });
    expect(session.state).toBe('initiated');
    const step = bumpSchema(session);
    expect(step.state).toBe('schema-bumped');
    expect(step.neutralEvent).toBe('do-migration.schema-bumped');
  });
});

describe('tutorial 95 — data migrate', () => {
  it('per-instance version advances to toVersion', () => {
    const session = initiateMigration({
      platform: 'vercel',
      fromVersion: 1,
      toVersion: 2,
      instanceIds: ['do-a'],
    });
    bumpSchema(session);
    const step = migrateInstance(session, { instanceId: 'do-a' });
    expect(step.metadata.toVersion).toBe(2);
    expect(session.instances.get('do-a')).toBe(2);
  });
});

describe('tutorial 95 — rollout + rollback', () => {
  it('completeRollout rejects partial rollout', () => {
    const session = initiateMigration({
      platform: 'deno',
      fromVersion: 1,
      toVersion: 2,
      instanceIds: ['a', 'b'],
    });
    bumpSchema(session);
    migrateInstance(session, { instanceId: 'a' });
    expect(() => completeRollout(session)).toThrow(/still on old version/);
  });

  it('rollbackMigration resets every instance to fromVersion', () => {
    const session = initiateMigration({
      platform: 'cloudflare',
      fromVersion: 1,
      toVersion: 2,
      instanceIds: ['a', 'b'],
    });
    bumpSchema(session);
    migrateInstance(session, { instanceId: 'a' });
    rollbackMigration(session);
    expect(session.state).toBe('rolled-back');
    expect(session.instances.get('a')).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Tutorial 96 — Global routing
// ---------------------------------------------------------------------------

describe('tutorial 96 — anycast + geo', () => {
  it('receiveAnycast emits anycast-received', () => {
    const session = startRoutingPool({
      platform: 'cloudflare',
      pops: [
        { popId: 'us-1', region: 'us', latencyMs: 30, healthy: true },
        { popId: 'eu-1', region: 'eu', latencyMs: 50, healthy: true },
      ],
    });
    const step = receiveAnycast(session, { requestId: 'req-1' });
    expect(step.neutralEvent).toBe('routing.anycast-received');
    expect(step.metadata.popCount).toBe(2);
  });

  it('matchGeo counts POPs in region', () => {
    const session = startRoutingPool({
      platform: 'vercel',
      pops: [
        { popId: 'us-1', region: 'us', latencyMs: 30, healthy: true },
        { popId: 'us-2', region: 'us', latencyMs: 50, healthy: true },
      ],
    });
    const step = matchGeo(session, { requestId: 'req-1', region: 'us' });
    expect(step.metadata.matchedCount).toBe(2);
  });
});

describe('tutorial 96 — select', () => {
  it('selectByLatency picks lowest latency POP in region', () => {
    const session = startRoutingPool({
      platform: 'deno',
      pops: [
        { popId: 'us-1', region: 'us', latencyMs: 30, healthy: true },
        { popId: 'us-2', region: 'us', latencyMs: 20, healthy: true },
      ],
    });
    const step = selectByLatency(session, { requestId: 'r', preferredRegion: 'us' });
    expect(step.metadata.popId).toBe('us-2');
  });

  it('markUnhealthy excludes POP from selection', () => {
    const session = startRoutingPool({
      platform: 'cloudflare',
      pops: [
        { popId: 'us-1', region: 'us', latencyMs: 30, healthy: true },
        { popId: 'us-2', region: 'us', latencyMs: 50, healthy: true },
      ],
    });
    markUnhealthy(session, { popId: 'us-1' });
    const step = selectByLatency(session, { requestId: 'r', preferredRegion: 'us' });
    expect(step.metadata.popId).toBe('us-2');
  });
});

describe('tutorial 96 — D1 read replica', () => {
  it('read picks lowest-lag healthy replica in region', () => {
    const session = startD1({
      platform: 'cloudflare',
      primaryId: 'pg-primary',
      replicas: [
        { replicaId: 'r-us-1', region: 'us', lagMs: 100 },
        { replicaId: 'r-us-2', region: 'us', lagMs: 200 },
      ],
      maxLagMs: 500,
    });
    const step = readFromReplica(session, { query: 'SELECT 1', preferredRegion: 'us' });
    expect(step.state).toBe('replica');
    expect(step.metadata.replicaId).toBe('r-us-1');
  });

  it('reportLag flips replica unhealthy when threshold exceeded', () => {
    const session = startD1({
      platform: 'vercel',
      primaryId: 'pg-primary',
      replicas: [{ replicaId: 'r-1', region: 'us', lagMs: 100 }],
      maxLagMs: 500,
    });
    const step = reportLag(session, { replicaId: 'r-1', lagMs: 1000 });
    expect(step.state).toBe('lagged');
  });
});
