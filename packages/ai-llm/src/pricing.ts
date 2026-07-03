/**
 * Model-priced token cost lookup, shared across dogfood real adapters so
 * one place tracks vendor pricing rather than each adapter hardcoding a
 * single-model rate. Prices are USD per 1M tokens (the unit vendors
 * publish); `costForTokens` converts to per-request USD given raw
 * `input_tokens` + `output_tokens`.
 *
 * Prices refreshed 2026-07; when Anthropic / OpenAI publish new rates,
 * update the table here — real adapters look up by model name and stay
 * accurate without file-level edits.
 */

export interface ModelPrice {
  /** USD per 1M input tokens (also called "prompt tokens"). */
  inputPerMillion: number;
  /** USD per 1M output tokens (also called "completion tokens"). */
  outputPerMillion: number;
}

/**
 * Prices per 1M tokens keyed by model identifier as the vendor names it.
 * Aliases like `claude-3-5-sonnet-latest` route to the concrete versioned
 * entry (`claude-3-5-sonnet-20241022`) via `PRICE_ALIASES` so a bump on
 * the vendor side that renames the alias target does not silently break
 * lookup.
 */
export const PRICE_TABLE: Readonly<Record<string, ModelPrice>> = Object.freeze({
  // Anthropic — Claude family (USD / 1M tokens, refreshed 2026-07)
  'claude-3-5-sonnet-20241022': { inputPerMillion: 3, outputPerMillion: 15 },
  'claude-3-5-haiku-20241022': { inputPerMillion: 0.8, outputPerMillion: 4 },
  'claude-3-opus-20240229': { inputPerMillion: 15, outputPerMillion: 75 },
  'claude-3-haiku-20240307': { inputPerMillion: 0.25, outputPerMillion: 1.25 },
  // OpenAI — GPT family (USD / 1M tokens, refreshed 2026-07)
  'gpt-4o': { inputPerMillion: 2.5, outputPerMillion: 10 },
  'gpt-4o-mini': { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  'gpt-4-turbo': { inputPerMillion: 10, outputPerMillion: 30 },
});

/** Alias → canonical model name. Vendors publish moving aliases like `-latest` that we resolve. */
export const PRICE_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  'claude-3-5-sonnet-latest': 'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-latest': 'claude-3-5-haiku-20241022',
  'claude-3-opus-latest': 'claude-3-opus-20240229',
});

/**
 * Fallback price when a model name is not in the table. Anthropic Sonnet
 * 3.5 rate matches the historical hardcoded value the dogfood adapters
 * used, so migration keeps existing cost figures stable for known models
 * while flagging unknown ones through `wasFallback`.
 */
const FALLBACK: ModelPrice = { inputPerMillion: 3, outputPerMillion: 15 };

export interface PriceLookupResult {
  price: ModelPrice;
  /** True when the caller passed a model not in the table — cost was still computed via fallback. */
  wasFallback: boolean;
  /** Model name the price was looked up under (post-alias resolution). */
  resolvedModel: string;
}

/**
 * Look up a model's price entry. Alias-resolves first, then reads
 * `PRICE_TABLE`. Unknown models fall back to Anthropic Sonnet 3.5 rates
 * with `wasFallback: true` so callers can log the drift instead of
 * silently emitting zero-cost figures. `Object.hasOwn` guards against
 * inherited property lookups (e.g. `toString` / `__proto__`) that would
 * otherwise resolve to non-price built-ins.
 */
export function lookupModelPrice(model: string): PriceLookupResult {
  const resolvedModel = Object.hasOwn(PRICE_ALIASES, model)
    ? PRICE_ALIASES[model]!
    : model;
  if (Object.hasOwn(PRICE_TABLE, resolvedModel)) {
    return { price: PRICE_TABLE[resolvedModel]!, wasFallback: false, resolvedModel };
  }
  return { price: FALLBACK, wasFallback: true, resolvedModel };
}

/**
 * Compute cost in USD for a request given raw `input_tokens` +
 * `output_tokens`. The vendor SSE / JSON payload names are kept out of
 * the signature — accepts plain numbers so both Anthropic-shaped
 * (`input_tokens`) and OpenAI-shaped (`prompt_tokens`) callers wire in
 * without a shim.
 */
export function costForTokens(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const { price } = lookupModelPrice(model);
  return (
    (inputTokens * price.inputPerMillion + outputTokens * price.outputPerMillion) /
    1_000_000
  );
}
