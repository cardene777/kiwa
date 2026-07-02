import { SearchEngine } from './engine.js';
import type { SearchAdapter } from './types.js';

/**
 * Meilisearch mock. Real Meilisearch: HTTP client with settings
 * (rankingRules / stopWords / filterableAttributes). This mock exposes
 * the same 5-op adapter shape so kiwa tests can swap real vs mock.
 * Typo tolerance ON by default (matches Meilisearch's out-of-the-box
 * behaviour with typoTolerance = { enabled: true }).
 */
export function createMeilisearchMock(config?: { typoTolerance?: boolean }): SearchAdapter {
  return new SearchEngine({
    provider: 'meilisearch',
    typoTolerance: config?.typoTolerance ?? true,
  });
}
