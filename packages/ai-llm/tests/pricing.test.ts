import { describe, expect, it } from 'vitest';
import {
  PRICE_ALIASES,
  PRICE_TABLE,
  costForTokens,
  lookupModelPrice,
} from '../src/index.js';

// -----------------------------------------------------------------------------
// § pricing lookup — Finding 3 (dogfood cross-cutting fix)
// -----------------------------------------------------------------------------

describe('lookupModelPrice', () => {
  it('T-AI-PRICE-001 known Anthropic model returns concrete entry, not fallback', () => {
    const result = lookupModelPrice('claude-3-5-sonnet-20241022');
    expect(result.wasFallback).toBe(false);
    expect(result.resolvedModel).toBe('claude-3-5-sonnet-20241022');
    expect(result.price.inputPerMillion).toBe(3);
    expect(result.price.outputPerMillion).toBe(15);
  });

  it('T-AI-PRICE-002 known OpenAI model returns concrete entry, not fallback', () => {
    const result = lookupModelPrice('gpt-4o-mini');
    expect(result.wasFallback).toBe(false);
    expect(result.resolvedModel).toBe('gpt-4o-mini');
    expect(result.price.inputPerMillion).toBe(0.15);
    expect(result.price.outputPerMillion).toBe(0.6);
  });

  it('T-AI-PRICE-003 alias resolves to canonical concrete model name', () => {
    const result = lookupModelPrice('claude-3-5-sonnet-latest');
    expect(result.wasFallback).toBe(false);
    expect(result.resolvedModel).toBe('claude-3-5-sonnet-20241022');
    expect(result.price).toEqual(PRICE_TABLE['claude-3-5-sonnet-20241022']);
  });

  it('T-AI-PRICE-004 unknown model flags wasFallback with Sonnet-3.5 default', () => {
    const result = lookupModelPrice('gpt-9-imaginary');
    expect(result.wasFallback).toBe(true);
    expect(result.resolvedModel).toBe('gpt-9-imaginary');
    expect(result.price.inputPerMillion).toBe(3);
    expect(result.price.outputPerMillion).toBe(15);
  });

  it('T-AI-PRICE-005 all published aliases resolve to entries that exist in PRICE_TABLE', () => {
    for (const alias of Object.keys(PRICE_ALIASES)) {
      const canonical = PRICE_ALIASES[alias];
      expect(canonical).toBeDefined();
      expect(PRICE_TABLE[canonical!]).toBeDefined();
    }
  });

  it('T-AI-PRICE-006 inherited Object properties (toString / __proto__) hit fallback, not built-ins', () => {
    // A hostile / accidental caller passing "toString" must not resolve to
    // Object.prototype.toString via prototype chain and confuse the lookup.
    const t = lookupModelPrice('toString');
    expect(t.wasFallback).toBe(true);
    expect(t.resolvedModel).toBe('toString');
    const p = lookupModelPrice('__proto__');
    expect(p.wasFallback).toBe(true);
    expect(p.resolvedModel).toBe('__proto__');
  });
});

describe('costForTokens', () => {
  it('T-AI-PRICE-010 Sonnet 3.5 1000 in + 500 out equals published rate', () => {
    // 1000 tokens × $3/1M = $0.003 for input, 500 × $15/1M = $0.0075 for output
    const cost = costForTokens('claude-3-5-sonnet-20241022', 1000, 500);
    expect(cost).toBeCloseTo(0.003 + 0.0075, 8);
  });

  it('T-AI-PRICE-011 gpt-4o-mini cost matches published rate at 1000/500 tokens', () => {
    // 1000 × $0.15/1M = $0.00015, 500 × $0.60/1M = $0.0003
    const cost = costForTokens('gpt-4o-mini', 1000, 500);
    expect(cost).toBeCloseTo(0.00015 + 0.0003, 8);
  });

  it('T-AI-PRICE-012 zero tokens returns zero cost across all models', () => {
    expect(costForTokens('claude-3-5-sonnet-20241022', 0, 0)).toBe(0);
    expect(costForTokens('gpt-4o', 0, 0)).toBe(0);
    expect(costForTokens('gpt-4-turbo', 0, 0)).toBe(0);
  });

  it('T-AI-PRICE-013 Haiku cost is strictly cheaper than Sonnet for the same tokens', () => {
    const sonnet = costForTokens('claude-3-5-sonnet-20241022', 1_000_000, 1_000_000);
    const haiku = costForTokens('claude-3-5-haiku-20241022', 1_000_000, 1_000_000);
    expect(haiku).toBeLessThan(sonnet);
  });

  it('T-AI-PRICE-014 unknown model still returns numeric cost (fallback path)', () => {
    const cost = costForTokens('nonexistent-model-42', 1000, 500);
    expect(cost).toBeGreaterThan(0);
    expect(Number.isFinite(cost)).toBe(true);
  });

  it('T-AI-PRICE-015 PRICE_TABLE is frozen (immutable so runtime mutation fails)', () => {
    // Structural — object is frozen at module load so a rogue caller cannot
    // patch a price in-flight and skew every subsequent lookup.
    expect(Object.isFrozen(PRICE_TABLE)).toBe(true);
    expect(Object.isFrozen(PRICE_ALIASES)).toBe(true);
  });
});
