import { SearchEngine } from './engine.js';
import type { SearchAdapter } from './types.js';

/**
 * Typesense mock. Real Typesense: schema-first (typed fields), typo
 * tolerance controllable via `num_typos`. This mock defaults typo
 * tolerance OFF (Typesense's num_typos = 0 is a common production
 * choice for exact-match indices).
 */
export function createTypesenseMock(config?: { typoTolerance?: boolean }): SearchAdapter {
  return new SearchEngine({
    provider: 'typesense',
    typoTolerance: config?.typoTolerance ?? false,
  });
}
