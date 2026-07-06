/**
 * User v3 — adds an optional `metadata` field to v2 (`type: [null, string]`
 * with default `null`). Used by the v1.31-3 transitive evolution flow to
 * form a v1 → v2 → v3 chain.
 *
 * The paired "TRANSITIVE_BREAK" variant flips the field to a *required*
 * field with no default — accepted by immediate BACKWARD (v3 vs v2 both
 * carry `email`; the mock's structural check reports no delta) but rejected
 * by BACKWARD_TRANSITIVE because it rechecks against v1 (which has no
 * `metadata`, so adding it as required breaks v1 consumers).
 */

export const USER_V3_SCHEMA_JSON = {
  type: 'record',
  namespace: 'kiwa.dogfood.redpanda',
  name: 'User',
  fields: [
    { name: 'id', type: 'string', default: '' },
    { name: 'displayName', type: 'string', default: '' },
    { name: 'region', type: 'string', default: 'us' },
    { name: 'email', type: ['null', 'string'], default: null },
    { name: 'metadata', type: ['null', 'string'], default: null },
  ],
} as const;

export const USER_V3_SCHEMA_STRING = JSON.stringify(USER_V3_SCHEMA_JSON);

/**
 * v3 payload — the transitive-friendly variant.
 */
export interface UserV3 {
  readonly id: string;
  readonly displayName: string;
  readonly region: string;
  readonly email: string | null;
  readonly metadata: string | null;
}

/**
 * v3 TRANSITIVE_BREAK — same schema as v3 but marks `metadata` as required.
 * Immediate BACKWARD vs v2 wouldn't flag it (v2 didn't have `metadata`, so
 * adding it as required is a new-required-field break vs v2 already);
 * TRANSITIVE variants recheck against every prior version so it is flagged
 * against both v1 + v2.
 */
export const USER_V3_TRANSITIVE_BREAK_SCHEMA_JSON = {
  type: 'record',
  namespace: 'kiwa.dogfood.redpanda',
  name: 'User',
  fields: [
    { name: 'id', type: 'string', default: '' },
    { name: 'displayName', type: 'string', default: '' },
    { name: 'region', type: 'string', default: 'us' },
    { name: 'email', type: ['null', 'string'], default: null },
    { name: 'metadata', type: 'string' },
  ],
} as const;

export const USER_V3_TRANSITIVE_BREAK_SCHEMA_STRING = JSON.stringify(
  USER_V3_TRANSITIVE_BREAK_SCHEMA_JSON,
);
