/**
 * Canonical W3C baggage entry sets for the dogfood app.
 *
 * The dogfood app implements 4 baggage entry patterns the OpenTelemetry
 * spec + production deployments canonicalise —
 *  - `session` — request-scoped session id (session.id).
 *  - `user` — authenticated user id (user.id) + optional user.role.
 *  - `tenant` — multi-tenant tenant id (tenant.id) + tenant.tier.
 *  - `feature-flag` — active feature-flag ids for A/B experiments.
 *
 * All 4 sets are exercised for every pipeline profile (traces / metrics
 * / logs) so the fidelity harness covers every canonical baggage combo.
 */

/** Session baggage — request-scoped session id. */
export const BAGGAGE_SESSION: Record<string, string> = {
  'session.id': 'sess-01H8Z9K0X0X0X0X0X0X0X0X0X0',
};

/** User baggage — authenticated user id + role. */
export const BAGGAGE_USER: Record<string, string> = {
  'user.id': 'usr-42',
  'user.role': 'admin',
};

/** Tenant baggage — multi-tenant tenant id + tier. */
export const BAGGAGE_TENANT: Record<string, string> = {
  'tenant.id': 'tnt-cardene',
  'tenant.tier': 'enterprise',
};

/** Feature-flag baggage — active feature-flag ids for A/B experiments. */
export const BAGGAGE_FEATURE_FLAG: Record<string, string> = {
  'feature.flag.new-checkout': 'on',
  'feature.flag.experimental-cache': 'off',
};

/** All 4 canonical baggage sets. */
export const ALL_BAGGAGE_SETS: readonly Record<string, string>[] = [
  BAGGAGE_SESSION,
  BAGGAGE_USER,
  BAGGAGE_TENANT,
  BAGGAGE_FEATURE_FLAG,
];
