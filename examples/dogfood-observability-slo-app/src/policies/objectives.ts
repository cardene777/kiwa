/**
 * The 3 canonical production SLO objectives the dogfood app targets.
 *
 * The trio (99.9 / 99.95 / 99.99) covers the range most SRE teams ship —
 * an internal API at 99.9, a customer-facing SaaS at 99.95, and a
 * payment / auth surface at 99.99. Each objective is exercised end-to-end
 * so the fidelity harness diffs mock vs real semantics across every
 * common production tier.
 */

import type { SLOTarget } from '../adapters/interface.js';

/** SLO 99.9 — 2 nines and a half (internal API). Monthly window (28 days). */
export const SLO_TARGET_99_9: SLOTarget = {
  sloId: 'api-internal-99.9',
  targetObjective: 0.999,
  windowDays: 28,
};

/** SLO 99.95 — 3 nines and a half (customer-facing SaaS). Monthly window. */
export const SLO_TARGET_99_95: SLOTarget = {
  sloId: 'api-saas-99.95',
  targetObjective: 0.9995,
  windowDays: 28,
};

/** SLO 99.99 — 4 nines (payment / auth surface). Monthly window. */
export const SLO_TARGET_99_99: SLOTarget = {
  sloId: 'api-payment-99.99',
  targetObjective: 0.9999,
  windowDays: 28,
};

/** All 3 targets — used by the fidelity harness to walk every objective. */
export const ALL_SLO_TARGETS: readonly SLOTarget[] = [
  SLO_TARGET_99_9,
  SLO_TARGET_99_95,
  SLO_TARGET_99_99,
];
