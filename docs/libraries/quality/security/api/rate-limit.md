---
title: "@kiwa-lab/security rate-limit の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/security</code> <code v-pre>rate-limit</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>DistributedRateLimiter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L190) <code v-pre>packages/security/src/rate-limit.ts</code>

```ts
export declare class DistributedRateLimiter {
    constructor(config: DistributedRateLimitConfig);
    check(clientId: string, nowMs?: number): RateLimitDecision;
}
```

#### <code v-pre>LeakyBucket</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L84) <code v-pre>packages/security/src/rate-limit.ts</code>

```ts
export declare class LeakyBucket {
    constructor(config: LeakyBucketConfig, nowMs?: number);
    enqueue(count: number, nowMs?: number): RateLimitDecision;
}
```

#### <code v-pre>resolveClientId</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L236) <code v-pre>packages/security/src/rate-limit.ts</code>

```ts
export declare function resolveClientId(input: {
    kind: ClientIdKind;
    ip?: string;
    userId?: string;
    apiKey?: string;
}): string;
```

#### <code v-pre>SlidingWindow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L140) <code v-pre>packages/security/src/rate-limit.ts</code>

```ts
export declare class SlidingWindow {
    constructor(config: SlidingWindowConfig);
    record(nowMs?: number): RateLimitDecision;
}
```

#### <code v-pre>TokenBucket</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L30) <code v-pre>packages/security/src/rate-limit.ts</code>

```ts
export declare class TokenBucket {
    constructor(config: TokenBucketConfig, nowMs?: number);
    consume(count: number, nowMs?: number): RateLimitDecision;
}
```

#### <code v-pre>toRateLimitEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L255) <code v-pre>packages/security/src/rate-limit.ts</code>

```ts
export declare function toRateLimitEvent(input: {
    provider: 'express-rate-limit' | 'coraza';
    decision: RateLimitDecision;
    clientId: string;
    strategy: RateLimitStrategy | 'distributed';
    timestamp: number;
}): SecurityEvent;
```

### 型

#### <code v-pre>ClientIdKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L234) <code v-pre>packages/security/src/rate-limit.ts</code>

Client identity keyspace resolver — IP / user / API-key の 3 通り。

```ts
export type ClientIdKind = 'ip' | 'user' | 'api-key';
```

#### <code v-pre>DistributedRateLimitConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L184) <code v-pre>packages/security/src/rate-limit.ts</code>

Distributed keyspace mock — Redis-backed のような multi-node coordination を hash-shard で emulate する。 node 数 = shards、 各 shard は独立 counter。

```ts
export interface DistributedRateLimitConfig {
    shards: number;
    perShardMaxRequests: number;
    windowMs: number;
}
```

#### <code v-pre>LeakyBucketConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L78) <code v-pre>packages/security/src/rate-limit.ts</code>

Leaky bucket — queue-based、 steady-state throughput 保証。

```ts
export interface LeakyBucketConfig {
    capacity: number;
    /** queue drain rate (items per ms、 float 可)。 */
    drainPerMs: number;
}
```

#### <code v-pre>RateLimitDecision</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L16) <code v-pre>packages/security/src/rate-limit.ts</code>

```ts
export interface RateLimitDecision {
    allowed: boolean;
    remaining: number;
    resetAtMs: number;
    reason: string;
}
```

#### <code v-pre>RateLimitStrategy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L14) <code v-pre>packages/security/src/rate-limit.ts</code>

```ts
export type RateLimitStrategy = 'token-bucket' | 'leaky-bucket' | 'sliding-window';
```

#### <code v-pre>SlidingWindowConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L135) <code v-pre>packages/security/src/rate-limit.ts</code>

Sliding window — time window の request timestamp 全部を記録し、 過去 windowMs 内の count で判定する経路。

```ts
export interface SlidingWindowConfig {
    windowMs: number;
    maxRequests: number;
}
```

#### <code v-pre>TokenBucketConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/security/src/rate-limit.ts#L24) <code v-pre>packages/security/src/rate-limit.ts</code>

Token bucket — burst 対応 (max capacity まで貯蓄可)、 constant refill 経路。

```ts
export interface TokenBucketConfig {
    capacity: number;
    /** ms あたりの refill 量 (float 可、 内部で fraction accumulator)。 */
    refillPerMs: number;
}
```
