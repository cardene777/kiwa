/**
 * A11y (axe-core) config for @kiwa-lab/ai-llm.
 * Tier: SaaS tier (critical 0 / serious 0 / moderate 0) — Anthropic / OpenAI / Vercel AI SDK / LangChain adapters. No DOM.
 * SSOT: docs/quality/a11y-thresholds.md § SaaS tier.
 */
export default {
  runOptions: {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    },
  },
  thresholds: {
    critical: 0,
    serious: 0,
    moderate: 0,
  },
  baselinePath: '.a11y-baseline/ai-llm.json',
};
