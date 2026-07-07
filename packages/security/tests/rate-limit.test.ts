import { describe, expect, it } from 'vitest';
import {
  DistributedRateLimiter,
  LeakyBucket,
  resolveClientId,
  SlidingWindow,
  TokenBucket,
  toRateLimitEvent,
} from '../src/index.js';

describe('Rate limit — TokenBucket', () => {
  it('T-SEC-RL-001 allows consumption up to capacity', () => {
    const bucket = new TokenBucket({ capacity: 5, refillPerMs: 1 }, 0);
    const d = bucket.consume(3, 0);
    expect(d.allowed).toBe(true);
    expect(d.remaining).toBe(2);
  });

  it('T-SEC-RL-002 rejects when tokens are insufficient', () => {
    const bucket = new TokenBucket({ capacity: 3, refillPerMs: 1 }, 0);
    bucket.consume(3, 0);
    const d = bucket.consume(1, 0);
    expect(d.allowed).toBe(false);
    expect(d.reason).toContain('insufficient');
  });

  it('T-SEC-RL-003 refills at the configured rate', () => {
    const bucket = new TokenBucket({ capacity: 5, refillPerMs: 0.1 }, 0);
    bucket.consume(5, 0);
    // 20 ms later, 2 tokens refilled (0.1/ms * 20)。
    const d = bucket.consume(2, 20);
    expect(d.allowed).toBe(true);
  });

  it('T-SEC-RL-004 does not exceed capacity when refilling', () => {
    const bucket = new TokenBucket({ capacity: 5, refillPerMs: 10 }, 0);
    // Massive elapsed time — cap is still 5.
    const d = bucket.consume(6, 10_000);
    expect(d.allowed).toBe(false);
  });

  it('T-SEC-RL-005 throws for invalid capacity', () => {
    expect(() => new TokenBucket({ capacity: 0, refillPerMs: 1 })).toThrow(/capacity/);
    expect(() => new TokenBucket({ capacity: 5, refillPerMs: 0 })).toThrow(/refill/);
  });

  it('T-SEC-RL-006 computes resetAtMs when denied', () => {
    const bucket = new TokenBucket({ capacity: 2, refillPerMs: 0.5 }, 0);
    bucket.consume(2, 0);
    const d = bucket.consume(1, 0);
    expect(d.allowed).toBe(false);
    expect(d.resetAtMs).toBeGreaterThan(0);
  });
});

describe('Rate limit — LeakyBucket', () => {
  it('T-SEC-RL-007 enqueues up to capacity', () => {
    const bucket = new LeakyBucket({ capacity: 4, drainPerMs: 1 }, 0);
    const d = bucket.enqueue(3, 0);
    expect(d.allowed).toBe(true);
    expect(d.remaining).toBe(1);
  });

  it('T-SEC-RL-008 rejects when the queue is full', () => {
    const bucket = new LeakyBucket({ capacity: 2, drainPerMs: 0.001 }, 0);
    bucket.enqueue(2, 0);
    const d = bucket.enqueue(1, 0);
    expect(d.allowed).toBe(false);
    expect(d.reason).toContain('full');
  });

  it('T-SEC-RL-009 drains the queue at the configured rate', () => {
    const bucket = new LeakyBucket({ capacity: 5, drainPerMs: 0.5 }, 0);
    bucket.enqueue(5, 0);
    // 10 ms later: 5 items drained, queue empty.
    const d = bucket.enqueue(1, 10);
    expect(d.allowed).toBe(true);
  });

  it('T-SEC-RL-010 throws for invalid config', () => {
    expect(() => new LeakyBucket({ capacity: 0, drainPerMs: 1 })).toThrow(/capacity/);
    expect(() => new LeakyBucket({ capacity: 5, drainPerMs: 0 })).toThrow(/drain/);
  });
});

describe('Rate limit — SlidingWindow', () => {
  it('T-SEC-RL-011 allows requests below the window quota', () => {
    const win = new SlidingWindow({ windowMs: 1000, maxRequests: 3 });
    expect(win.record(0).allowed).toBe(true);
    expect(win.record(100).allowed).toBe(true);
    expect(win.record(200).allowed).toBe(true);
  });

  it('T-SEC-RL-012 rejects the fourth request within the window', () => {
    const win = new SlidingWindow({ windowMs: 1000, maxRequests: 3 });
    win.record(0);
    win.record(100);
    win.record(200);
    const d = win.record(300);
    expect(d.allowed).toBe(false);
    expect(d.reason).toContain('exceeded');
  });

  it('T-SEC-RL-013 drops timestamps outside the window', () => {
    const win = new SlidingWindow({ windowMs: 1000, maxRequests: 2 });
    win.record(0);
    win.record(100);
    // 2000ms later — window empty again.
    const d = win.record(2000);
    expect(d.allowed).toBe(true);
  });

  it('T-SEC-RL-014 throws for invalid config', () => {
    expect(() => new SlidingWindow({ windowMs: 0, maxRequests: 1 })).toThrow(/windowMs/);
    expect(() => new SlidingWindow({ windowMs: 1000, maxRequests: 0 })).toThrow(/maxRequests/);
  });
});

describe('Rate limit — Distributed', () => {
  it('T-SEC-RL-015 distributes clients across shards', () => {
    const limiter = new DistributedRateLimiter({
      shards: 4,
      perShardMaxRequests: 100,
      windowMs: 1000,
    });
    // Same client id → same shard.
    const d1 = limiter.check('client-A', 0);
    const d2 = limiter.check('client-A', 1);
    expect(d1.reason.slice(0, 30)).toEqual(d2.reason.slice(0, 30));
  });

  it('T-SEC-RL-016 rejects when per-shard limit is exceeded', () => {
    const limiter = new DistributedRateLimiter({
      shards: 2,
      perShardMaxRequests: 2,
      windowMs: 1000,
    });
    limiter.check('client-A', 0);
    limiter.check('client-A', 10);
    const d = limiter.check('client-A', 20);
    expect(d.allowed).toBe(false);
  });

  it('T-SEC-RL-017 throws for invalid shard count', () => {
    expect(() =>
      new DistributedRateLimiter({ shards: 0, perShardMaxRequests: 1, windowMs: 1 }),
    ).toThrow(/shards/);
  });
});

describe('Rate limit — resolveClientId', () => {
  it('T-SEC-RL-018 resolves an IP-based client id', () => {
    expect(resolveClientId({ kind: 'ip', ip: '1.2.3.4' })).toBe('ip:1.2.3.4');
  });

  it('T-SEC-RL-019 resolves a user-based client id', () => {
    expect(resolveClientId({ kind: 'user', userId: 'u42' })).toBe('user:u42');
  });

  it('T-SEC-RL-020 resolves an api-key-based client id', () => {
    expect(resolveClientId({ kind: 'api-key', apiKey: 'secret' })).toBe('api-key:secret');
  });

  it('T-SEC-RL-021 throws when the required field is missing', () => {
    expect(() => resolveClientId({ kind: 'ip' })).toThrow(/ip/);
    expect(() => resolveClientId({ kind: 'user' })).toThrow(/userId/);
    expect(() => resolveClientId({ kind: 'api-key' })).toThrow(/apiKey/);
  });
});

describe('Rate limit — toRateLimitEvent', () => {
  it('T-SEC-RL-022 emits a deny event for a rejected decision', () => {
    const ev = toRateLimitEvent({
      provider: 'express-rate-limit',
      decision: { allowed: false, remaining: 0, resetAtMs: 1000, reason: 'exceeded' },
      clientId: 'ip:1.2.3.4',
      strategy: 'token-bucket',
      timestamp: 100,
    });
    expect(ev.axis).toBe('rate-limit');
    expect(ev.verdict).toBe('deny');
    expect(ev.reason).toContain('token-bucket');
  });
});
