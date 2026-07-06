/**
 * A11y (axe-core) config for @kiwa-test/orm.
 * Tier: SaaS tier (critical 0 / serious 0 / moderate 0) — Prisma / Drizzle / Kysely. No DOM.
 * SSOT: docs/quality/a11y-thresholds.md § SaaS tier.
 *
 * `providers` list persists the SaaS provenance the baseline covers — 3 provider adapters
 * (drizzle / prisma / kysely) × 3 backend (postgres / mysql / sqlite) × 8 semantics axis
 * (cdc / replication / mvcc / partitioning / connection-pool / logical-replication /
 * rls / vector-store) mirroring the v1.30-3 Issue #994 AC "orm = 3 provider × 3 backend × 8 axis".
 * Each 3-way tuple is a separate provenance row so downstream gates can name the exact
 * provider × backend × axis triple the sweep considered.
 */
const AXES = [
  'cdc',
  'replication',
  'mvcc',
  'partitioning',
  'connection-pool',
  'logical-replication',
  'rls',
  'vector-store',
];

const BACKENDS = ['postgres', 'mysql', 'sqlite'];

const BRANDS = ['drizzle', 'prisma', 'kysely'];

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
  baselinePath: '.a11y-baseline/orm.json',
  providers: BRANDS.flatMap((brand) =>
    BACKENDS.flatMap((backend) =>
      AXES.map((axis) => ({ name: brand, backend, axis })),
    ),
  ),
};
