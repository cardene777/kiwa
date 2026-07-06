/**
 * A11y (axe-core) config for @kiwa-test/cache.
 * Tier: SaaS tier (critical 0 / serious 0 / moderate 0) — Redis / KeyDB / Memcached. No DOM.
 * SSOT: docs/quality/a11y-thresholds.md § SaaS tier.
 *
 * `providers` list persists the SaaS provenance the baseline covers — 3 provider adapters
 * (in-memory / keydb / memcached) mirroring the v1.30-3 Issue #994 AC "cache = 3 provider".
 * `in-memory` is the Redis-shaped fixture the sandbox / testcontainers modes wrap.
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
  baselinePath: '.a11y-baseline/cache.json',
  providers: [
    { name: 'in-memory' },
    { name: 'keydb' },
    { name: 'memcached' },
  ],
};
