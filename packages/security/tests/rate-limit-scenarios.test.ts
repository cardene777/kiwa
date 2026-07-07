import { describe, expect, it } from 'vitest';
import { DistributedRateLimiter, LeakyBucket, SlidingWindow, TokenBucket } from '../src/index.js';

describe('Rate limit — burst + steady scenarios', () => {
  it('T-SEC-RL-S-001 token bucket allows burst then throttles', () => {
    const bucket = new TokenBucket({ capacity: 10, refillPerMs: 0.1 }, 0);
    // 10-token burst allowed.
    expect(bucket.consume(10, 0).allowed).toBe(true);
    // Immediately after — no tokens.
    expect(bucket.consume(1, 0).allowed).toBe(false);
  });

  it('T-SEC-RL-S-002 token bucket refills incrementally', () => {
    const bucket = new TokenBucket({ capacity: 10, refillPerMs: 1 }, 0);
    bucket.consume(10, 0);
    expect(bucket.consume(1, 1).allowed).toBe(true);
    expect(bucket.consume(1, 2).allowed).toBe(true);
    expect(bucket.consume(1, 3).allowed).toBe(true);
  });

  it('T-SEC-RL-S-003 leaky bucket steady throughput', () => {
    const bucket = new LeakyBucket({ capacity: 5, drainPerMs: 1 }, 0);
    // 5 requests at t=0 fills the queue.
    for (let i = 0; i < 5; i += 1) {
      bucket.enqueue(1, 0);
    }
    // 10 ms later — queue fully drained.
    expect(bucket.enqueue(5, 10).allowed).toBe(true);
  });

  it('T-SEC-RL-S-004 sliding window rolling boundary', () => {
    const win = new SlidingWindow({ windowMs: 1000, maxRequests: 3 });
    win.record(0);
    win.record(500);
    win.record(900);
    // At 999: still 3 in window (0, 500, 900) — 4th rejected.
    expect(win.record(999).allowed).toBe(false);
    // At 1001: 0 dropped (cutoff = 1, 0 <= 1), so [500, 900] + 1001 fits under 3 → allowed.
    expect(win.record(1001).allowed).toBe(true);
  });

  it('T-SEC-RL-S-005 distributed limiter isolates keyspaces', () => {
    const limiter = new DistributedRateLimiter({
      shards: 8,
      perShardMaxRequests: 100,
      windowMs: 1000,
    });
    const d1 = limiter.check('client-A', 0);
    const d2 = limiter.check('client-B', 0);
    // Different clients — both allowed.
    expect(d1.allowed).toBe(true);
    expect(d2.allowed).toBe(true);
  });

  it('T-SEC-RL-S-006 distributed limiter deterministic sharding', () => {
    const limiter1 = new DistributedRateLimiter({ shards: 4, perShardMaxRequests: 10, windowMs: 1000 });
    const limiter2 = new DistributedRateLimiter({ shards: 4, perShardMaxRequests: 10, windowMs: 1000 });
    const r1 = limiter1.check('client-X', 0);
    const r2 = limiter2.check('client-X', 0);
    // Same client should hash to same shard.
    expect(r1.reason.match(/shard=\d+/)?.[0]).toEqual(r2.reason.match(/shard=\d+/)?.[0]);
  });

  it('T-SEC-RL-S-007 token bucket partial refill preserves fractional tokens', () => {
    const bucket = new TokenBucket({ capacity: 10, refillPerMs: 0.5 }, 0);
    bucket.consume(10, 0);
    // 1 ms after → 0.5 tokens accumulated, still cannot consume 1.
    expect(bucket.consume(1, 1).allowed).toBe(false);
    // 2 ms after → 1.0 token accumulated, can consume 1.
    expect(bucket.consume(1, 2).allowed).toBe(true);
  });

  it('T-SEC-RL-S-008 leaky bucket does not drain below zero', () => {
    const bucket = new LeakyBucket({ capacity: 5, drainPerMs: 100 }, 0);
    // No requests, then 1 second later — queue is empty (not negative).
    expect(bucket.enqueue(5, 1000).allowed).toBe(true);
  });
});
