/**
 * A11y (axe-core) config for @kiwa/mcp.
 * Tier: SaaS tier (critical 0 / serious 0 / moderate 0) — MCP JSON-RPC protocol + transport. No DOM.
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
  baselinePath: '.a11y-baseline/mcp.json',
};
