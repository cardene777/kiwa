---
title: "@kiwa-lab/data expectations の API 契約"
---

# <code v-pre>@kiwa-lab/data</code> <code v-pre>expectations</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/data/src/expectations.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>expectAtLeastOnce</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/expectations.ts#L27) <code v-pre>packages/data/src/expectations.ts</code>

Asserts that a handler is invoked at least `minTimes` for a message that nacks before finally acking (at-least-once delivery semantics).

```ts
export declare function expectAtLeastOnce<T>(client: QueueClient<T>, body: T, minTimes: number, expect: {
    (actual: unknown): {
        toBeGreaterThanOrEqual: (expected: number) => void;
    };
}): Promise<number>;
```

#### <code v-pre>expectIdempotent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/expectations.ts#L11) <code v-pre>packages/data/src/expectations.ts</code>

Asserts that two sends with the same dedupKey collapse into one queue entry (caller is expected to consume + ack the entry).

```ts
export declare function expectIdempotent<T>(client: QueueClient<T>, body: T, opts: IdempotencyOptions, expect: {
    (actual: unknown): {
        toBe: (expected: unknown) => void;
    };
}): Promise<void>;
```

### 型

#### <code v-pre>IdempotencyOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/data/src/expectations.ts#L3) <code v-pre>packages/data/src/expectations.ts</code>

```ts
export interface IdempotencyOptions {
    dedupKey: string;
}
```
