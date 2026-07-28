---
title: "@kiwa-lab/ai-llm pricing の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/ai-llm</code> <code v-pre>pricing</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/pricing.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>costForTokens</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/pricing.ts#L87) <code v-pre>packages/ai-llm/src/pricing.ts</code>

Compute cost in USD for a request given raw `input_tokens` + `output_tokens`. The vendor SSE / JSON payload names are kept out of the signature — accepts plain numbers so both Anthropic-shaped (`input_tokens`) and OpenAI-shaped (`prompt_tokens`) callers wire in without a shim.

```ts
export declare function costForTokens(model: string, inputTokens: number, outputTokens: number): number;
```

#### <code v-pre>lookupModelPrice</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/pricing.ts#L70) <code v-pre>packages/ai-llm/src/pricing.ts</code>

Look up a model's price entry. Alias-resolves first, then reads `PRICE_TABLE`. Unknown models fall back to Anthropic Sonnet 3.5 rates with `wasFallback: true` so callers can log the drift instead of silently emitting zero-cost figures. `Object.hasOwn` guards against inherited property lookups (e.g. `toString` / `__proto__`) that would otherwise resolve to non-price built-ins.

```ts
export declare function lookupModelPrice(model: string): PriceLookupResult;
```

#### <code v-pre>PRICE&#95;ALIASES</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/pricing.ts#L40) <code v-pre>packages/ai-llm/src/pricing.ts</code>

Alias → canonical model name. Vendors publish moving aliases like `-latest` that we resolve.

```ts
export declare const PRICE_ALIASES: Readonly<Record<string, string>>;
```

#### <code v-pre>PRICE&#95;TABLE</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/pricing.ts#L27) <code v-pre>packages/ai-llm/src/pricing.ts</code>

Prices per 1M tokens keyed by model identifier as the vendor names it. Aliases like `claude-3-5-sonnet-latest` route to the concrete versioned entry (`claude-3-5-sonnet-20241022`) via `PRICE_ALIASES` so a bump on the vendor side that renames the alias target does not silently break lookup.

```ts
export declare const PRICE_TABLE: Readonly<Record<string, ModelPrice>>;
```

### 型

#### <code v-pre>ModelPrice</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/pricing.ts#L13) <code v-pre>packages/ai-llm/src/pricing.ts</code>

Model-priced token cost lookup, shared across dogfood real adapters so one place tracks vendor pricing rather than each adapter hardcoding a single-model rate. Prices are USD per 1M tokens (the unit vendors publish); `costForTokens` converts to per-request USD given raw `input_tokens` + `output_tokens`. Prices refreshed 2026-07; when Anthropic / OpenAI publish new rates, update the table here — real adapters look up by model name and stay accurate without file-level edits.

```ts
export interface ModelPrice {
    /** USD per 1M input tokens (also called "prompt tokens"). */
    inputPerMillion: number;
    /** USD per 1M output tokens (also called "completion tokens"). */
    outputPerMillion: number;
}
```

#### <code v-pre>PriceLookupResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ai-llm/src/pricing.ts#L54) <code v-pre>packages/ai-llm/src/pricing.ts</code>

```ts
export interface PriceLookupResult {
    price: ModelPrice;
    /** True when the caller passed a model not in the table — cost was still computed via fallback. */
    wasFallback: boolean;
    /** Model name the price was looked up under (post-alias resolution). */
    resolvedModel: string;
}
```
