import { SearchEngine } from './engine.js';
import type { SearchAdapter } from './types.js';

/**
 * Algolia mock. Real Algolia: search-only + admin API keys, per-index
 * settings (searchableAttributes / customRanking). Typo tolerance ON
 * by default (Algolia default). Filter syntax on real Algolia is
 * `field:value`; the mock uses the plain object shape shared across
 * the three providers.
 */
export function createAlgoliaMock(config?: { typoTolerance?: boolean }): SearchAdapter {
  return new SearchEngine({
    provider: 'algolia',
    typoTolerance: config?.typoTolerance ?? true,
  });
}
