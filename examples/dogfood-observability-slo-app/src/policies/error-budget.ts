/**
 * Error-budget policies for each SLO objective.
 *
 * Each policy fixes two thresholds on the *remaining* error budget
 * (fraction of the budget still available in the current window):
 *  - `freezeThreshold` — freeze non-critical deploys when remaining drops
 *    below this fraction.
 *  - `pageThreshold` — page the on-call when remaining drops below this
 *    fraction (harder floor).
 *
 * The trio (99.9 / 99.95 / 99.99) has escalating freeze thresholds — a
 * 99.9 objective can absorb more drift before deploys freeze than a
 * 99.99 payment surface, which is very fragile.
 */

import type { ErrorBudgetPolicy } from '../adapters/interface.js';

/** Policy for internal API SLO 99.9. Deploys freeze at 25% remaining, page at 10%. */
export const POLICY_99_9: ErrorBudgetPolicy = {
  sloId: 'api-internal-99.9',
  targetObjective: 0.999,
  freezeThreshold: 0.25,
  pageThreshold: 0.1,
};

/** Policy for customer-facing SaaS SLO 99.95. Freeze at 30% remaining, page at 15%. */
export const POLICY_99_95: ErrorBudgetPolicy = {
  sloId: 'api-saas-99.95',
  targetObjective: 0.9995,
  freezeThreshold: 0.3,
  pageThreshold: 0.15,
};

/** Policy for payment / auth SLO 99.99. Freeze at 50% remaining, page at 25%. */
export const POLICY_99_99: ErrorBudgetPolicy = {
  sloId: 'api-payment-99.99',
  targetObjective: 0.9999,
  freezeThreshold: 0.5,
  pageThreshold: 0.25,
};

/** All 3 policies — one per objective. */
export const ALL_POLICIES: readonly ErrorBudgetPolicy[] = [
  POLICY_99_9,
  POLICY_99_95,
  POLICY_99_99,
];
