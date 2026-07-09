import { describe, expect, it } from 'vitest';
import { costForTokens, lookupModelPrice } from '@kiwa-lab/ai-llm';

// -----------------------------------------------------------------------------
// § pricing migration — Finding 3 (dogfood cross-cutting fix)
// -----------------------------------------------------------------------------
//
// The real OpenAI adapter previously hardcoded gpt-4o-mini's price
// (0.15 / 0.60 USD per 1M tokens) inside the module. Migration moves the
// lookup to `@kiwa-lab/ai-llm.costForTokens` so a model swap
// (gpt-4o-mini → gpt-4o → gpt-4-turbo) picks up the correct rate without
// editing the adapter. These regression tests pin the historical values
// so the migration is drop-in for the default model and reject silent
// price drift on model swap.

describe('cost lookup — post-migration behaviour', () => {
  it('T-DFO-PRICE-001 gpt-4o-mini keeps its historical rate (drop-in migration)', () => {
    // 1000 input tokens × $0.15/1M = $0.00015
    // 500 output tokens × $0.60/1M = $0.0003
    const cost = costForTokens('gpt-4o-mini', 1000, 500);
    expect(cost).toBeCloseTo(0.00015 + 0.0003, 8);
  });

  it('T-DFO-PRICE-002 gpt-4o costs more than gpt-4o-mini for identical token counts', () => {
    const mini = costForTokens('gpt-4o-mini', 100_000, 20_000);
    const full = costForTokens('gpt-4o', 100_000, 20_000);
    expect(full).toBeGreaterThan(mini);
  });

  it('T-DFO-PRICE-003 lookup returns concrete entry for the adapter default model', () => {
    const result = lookupModelPrice('gpt-4o-mini');
    expect(result.wasFallback).toBe(false);
    expect(result.resolvedModel).toBe('gpt-4o-mini');
  });

  it('T-DFO-PRICE-004 unknown model still yields finite non-zero cost via fallback', () => {
    const cost = costForTokens('gpt-99-imaginary', 1000, 500);
    expect(cost).toBeGreaterThan(0);
    expect(Number.isFinite(cost)).toBe(true);
  });
});
