/**
 * Canonical hybrid weight configurations the dogfood app exercises.
 *
 * The 5 configurations (vector-heavy / keyword-heavy / balanced /
 * vector-only / keyword-only) cover the full weight spectrum production
 * hybrid-search deployments typically choose between. Every backend is
 * walked through every config so the fidelity harness measures drift
 * across the full 2 x 5 = 10 combos.
 */

import type { HybridWeights } from '../adapters/interface.js';

/** A named hybrid weight config with a stable id. */
export interface HybridConfig {
  id: string;
  label: string;
  weights: HybridWeights;
}

/** Vector-heavy — 80% vector / 20% keyword (semantic-priority). */
export const HYBRID_VECTOR_HEAVY: HybridConfig = {
  id: 'vector-heavy',
  label: 'vector-heavy (0.8 / 0.2)',
  weights: { vectorWeight: 0.8, keywordWeight: 0.2 },
};

/** Keyword-heavy — 20% vector / 80% keyword (BM25-priority). */
export const HYBRID_KEYWORD_HEAVY: HybridConfig = {
  id: 'keyword-heavy',
  label: 'keyword-heavy (0.2 / 0.8)',
  weights: { vectorWeight: 0.2, keywordWeight: 0.8 },
};

/** Balanced — 50% / 50% (typical default). */
export const HYBRID_BALANCED: HybridConfig = {
  id: 'balanced',
  label: 'balanced (0.5 / 0.5)',
  weights: { vectorWeight: 0.5, keywordWeight: 0.5 },
};

/** Vector-only — 100% vector / 0% keyword (pure kNN). */
export const HYBRID_VECTOR_ONLY: HybridConfig = {
  id: 'vector-only',
  label: 'vector-only (1.0 / 0.0)',
  weights: { vectorWeight: 1.0, keywordWeight: 0.0 },
};

/** Keyword-only — 0% vector / 100% keyword (pure BM25). */
export const HYBRID_KEYWORD_ONLY: HybridConfig = {
  id: 'keyword-only',
  label: 'keyword-only (0.0 / 1.0)',
  weights: { vectorWeight: 0.0, keywordWeight: 1.0 },
};

/** All 5 canonical hybrid configs. */
export const ALL_HYBRID_CONFIGS: readonly HybridConfig[] = [
  HYBRID_VECTOR_HEAVY,
  HYBRID_KEYWORD_HEAVY,
  HYBRID_BALANCED,
  HYBRID_VECTOR_ONLY,
  HYBRID_KEYWORD_ONLY,
];
