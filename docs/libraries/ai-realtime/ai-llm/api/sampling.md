---
title: "@kiwa-lab/ai-llm sampling の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>sampling</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/sampling.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>makeSeededRandom</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/sampling.ts#L20) <code v-pre>packages/ai-llm/src/sampling.ts</code>

mulberry32 seeded PRNG — 32-bit state, returns floats in [0, 1). Same seed always yields the same sequence, so a perf test with `seed=42` observes identical samples on every run and can gate on the resulting distribution shape.

```ts
export declare function makeSeededRandom(seed: number): () => number;
```

#### <code v-pre>samplePoisson</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/sampling.ts#L38) <code v-pre>packages/ai-llm/src/sampling.ts</code>

Poisson-distributed sample stream. Knuth's algorithm — simple, correct for the small lambdas (0.5–20) perf tests use for arrival-interval / request-count models. For lambda &gt; ~30 numerical underflow makes this variant unusable, but that regime is out of scope for the dogfood perf suite.

```ts
export declare function samplePoisson(count: number, lambda: number, rng: () => number): number[];
```

#### <code v-pre>sampleZipf</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/sampling.ts#L76) <code v-pre>packages/ai-llm/src/sampling.ts</code>

Zipf-distributed sample stream — heavy-tail integer draws from {1..n}. Rejection method with Devroye's shape parameter is used so larger `s` (skew) values still converge; perf tests use s ≈ 1.07 to approximate the observed prompt-length distribution in production chat traffic.

```ts
export declare function sampleZipf(count: number, n: number, s: number, rng: () => number): number[];
```


