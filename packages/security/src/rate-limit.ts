/**
 * Axis 2 — Rate limiting engine。
 *
 * 5 sub-axis ...
 * - token bucket (max capacity + refill rate、 burst 対応)
 * - leaky bucket (queue-based、 steady-state throughput 保証)
 * - sliding window (time-window based、 過去 N ms の request 数を counting)
 * - distributed (multiple keyspace + coordination via distributed hash mock)
 * - client id (per-IP / per-user / per-API-key の keyspace 差分)
 */

import type { SecurityEvent } from './types.js';

export type RateLimitStrategy = 'token-bucket' | 'leaky-bucket' | 'sliding-window';

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  resetAtMs: number;
  reason: string;
}

/** Token bucket — burst 対応 (max capacity まで貯蓄可)、 constant refill 経路。 */
export interface TokenBucketConfig {
  capacity: number;
  /** ms あたりの refill 量 (float 可、 内部で fraction accumulator)。 */
  refillPerMs: number;
}

export class TokenBucket {
  private tokens: number;
  private lastRefillMs: number;
  private readonly capacity: number;
  private readonly refillPerMs: number;

  constructor(config: TokenBucketConfig, nowMs: number = Date.now()) {
    if (config.capacity <= 0) {
      throw new Error('token-bucket: capacity must be > 0');
    }
    if (config.refillPerMs <= 0) {
      throw new Error('token-bucket: refillPerMs must be > 0');
    }
    this.capacity = config.capacity;
    this.refillPerMs = config.refillPerMs;
    this.tokens = config.capacity;
    this.lastRefillMs = nowMs;
  }

  consume(count: number, nowMs: number = Date.now()): RateLimitDecision {
    this.refill(nowMs);
    if (this.tokens >= count) {
      this.tokens -= count;
      return {
        allowed: true,
        remaining: Math.floor(this.tokens),
        resetAtMs: nowMs + (this.capacity - this.tokens) / this.refillPerMs,
        reason: 'token-bucket: allowed',
      };
    }
    const missing = count - this.tokens;
    return {
      allowed: false,
      remaining: Math.floor(this.tokens),
      resetAtMs: nowMs + missing / this.refillPerMs,
      reason: 'token-bucket: insufficient tokens',
    };
  }

  private refill(nowMs: number): void {
    const elapsed = nowMs - this.lastRefillMs;
    if (elapsed <= 0) return;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillPerMs);
    this.lastRefillMs = nowMs;
  }
}

/** Leaky bucket — queue-based、 steady-state throughput 保証。 */
export interface LeakyBucketConfig {
  capacity: number;
  /** queue drain rate (items per ms、 float 可)。 */
  drainPerMs: number;
}

export class LeakyBucket {
  private queue: number;
  private lastDrainMs: number;
  private readonly capacity: number;
  private readonly drainPerMs: number;

  constructor(config: LeakyBucketConfig, nowMs: number = Date.now()) {
    if (config.capacity <= 0) {
      throw new Error('leaky-bucket: capacity must be > 0');
    }
    if (config.drainPerMs <= 0) {
      throw new Error('leaky-bucket: drainPerMs must be > 0');
    }
    this.capacity = config.capacity;
    this.drainPerMs = config.drainPerMs;
    this.queue = 0;
    this.lastDrainMs = nowMs;
  }

  enqueue(count: number, nowMs: number = Date.now()): RateLimitDecision {
    this.drain(nowMs);
    if (this.queue + count <= this.capacity) {
      this.queue += count;
      const remaining = this.capacity - this.queue;
      return {
        allowed: true,
        remaining: Math.floor(remaining),
        resetAtMs: nowMs + this.queue / this.drainPerMs,
        reason: 'leaky-bucket: allowed',
      };
    }
    return {
      allowed: false,
      remaining: Math.floor(this.capacity - this.queue),
      resetAtMs: nowMs + this.queue / this.drainPerMs,
      reason: 'leaky-bucket: queue full',
    };
  }

  private drain(nowMs: number): void {
    const elapsed = nowMs - this.lastDrainMs;
    if (elapsed <= 0) return;
    this.queue = Math.max(0, this.queue - elapsed * this.drainPerMs);
    this.lastDrainMs = nowMs;
  }
}

/**
 * Sliding window — time window の request timestamp 全部を記録し、
 * 過去 windowMs 内の count で判定する経路。
 */
export interface SlidingWindowConfig {
  windowMs: number;
  maxRequests: number;
}

export class SlidingWindow {
  private timestamps: number[] = [];
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(config: SlidingWindowConfig) {
    if (config.windowMs <= 0) {
      throw new Error('sliding-window: windowMs must be > 0');
    }
    if (config.maxRequests <= 0) {
      throw new Error('sliding-window: maxRequests must be > 0');
    }
    this.windowMs = config.windowMs;
    this.maxRequests = config.maxRequests;
  }

  record(nowMs: number = Date.now()): RateLimitDecision {
    const cutoff = nowMs - this.windowMs;
    // Drop timestamps older than window.
    while (this.timestamps.length > 0 && (this.timestamps[0] ?? Infinity) <= cutoff) {
      this.timestamps.shift();
    }
    if (this.timestamps.length < this.maxRequests) {
      this.timestamps.push(nowMs);
      return {
        allowed: true,
        remaining: this.maxRequests - this.timestamps.length,
        resetAtMs: (this.timestamps[0] ?? nowMs) + this.windowMs,
        reason: 'sliding-window: allowed',
      };
    }
    return {
      allowed: false,
      remaining: 0,
      resetAtMs: (this.timestamps[0] ?? nowMs) + this.windowMs,
      reason: 'sliding-window: rate exceeded',
    };
  }
}

/**
 * Distributed keyspace mock — Redis-backed のような multi-node coordination
 * を hash-shard で emulate する。 node 数 = shards、 各 shard は独立 counter。
 */
export interface DistributedRateLimitConfig {
  shards: number;
  perShardMaxRequests: number;
  windowMs: number;
}

export class DistributedRateLimiter {
  private readonly windows: Map<string, SlidingWindow>;
  private readonly config: DistributedRateLimitConfig;

  constructor(config: DistributedRateLimitConfig) {
    if (config.shards <= 0) {
      throw new Error('distributed: shards must be > 0');
    }
    this.config = config;
    this.windows = new Map();
  }

  check(clientId: string, nowMs: number = Date.now()): RateLimitDecision {
    const shard = hashShard(clientId, this.config.shards);
    const key = `${shard}:${clientId}`;
    let win = this.windows.get(key);
    if (!win) {
      win = new SlidingWindow({
        windowMs: this.config.windowMs,
        maxRequests: this.config.perShardMaxRequests,
      });
      this.windows.set(key, win);
    }
    const decision = win.record(nowMs);
    return {
      ...decision,
      reason: decision.allowed
        ? `distributed[shard=${shard}]: allowed`
        : `distributed[shard=${shard}]: exceeded`,
    };
  }
}

function hashShard(clientId: string, shards: number): number {
  // FNV-1a 32-bit — deterministic + non-crypto (rate-limit shard purpose only).
  let hash = 0x811c9dc5;
  for (let i = 0; i < clientId.length; i += 1) {
    hash ^= clientId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash % shards;
}

/** Client identity keyspace resolver — IP / user / API-key の 3 通り。 */
export type ClientIdKind = 'ip' | 'user' | 'api-key';

export function resolveClientId(input: {
  kind: ClientIdKind;
  ip?: string;
  userId?: string;
  apiKey?: string;
}): string {
  switch (input.kind) {
    case 'ip':
      if (!input.ip) throw new Error('client-id: ip missing');
      return `ip:${input.ip}`;
    case 'user':
      if (!input.userId) throw new Error('client-id: userId missing');
      return `user:${input.userId}`;
    case 'api-key':
      if (!input.apiKey) throw new Error('client-id: apiKey missing');
      return `api-key:${input.apiKey}`;
  }
}

export function toRateLimitEvent(input: {
  provider: 'express-rate-limit' | 'coraza';
  decision: RateLimitDecision;
  clientId: string;
  strategy: RateLimitStrategy | 'distributed';
  timestamp: number;
}): SecurityEvent {
  return {
    axis: 'rate-limit',
    provider: input.provider,
    verdict: input.decision.allowed ? 'allow' : 'deny',
    reason: `${input.strategy}: ${input.decision.reason}`,
    payload: {
      clientId: input.clientId,
      remaining: input.decision.remaining,
      resetAtMs: input.decision.resetAtMs,
    },
    timestamp: input.timestamp,
  };
}
