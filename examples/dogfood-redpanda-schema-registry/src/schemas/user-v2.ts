/**
 * User v2 — adds an optional `email` field to v1.
 *
 * The mock's compat check treats fields with a `default` as optional; consumers
 * built against v1 keep parsing the record because the new field is not
 * required. This is the BACKWARD-compatible evolution case the dogfood
 * asserts on.
 */

export const USER_V2_SCHEMA_JSON = {
  type: 'record',
  namespace: 'kiwa.dogfood.redpanda',
  name: 'User',
  fields: [
    { name: 'id', type: 'string', default: '' },
    { name: 'displayName', type: 'string', default: '' },
    { name: 'region', type: 'string', default: 'us' },
    { name: 'email', type: ['null', 'string'], default: null },
  ],
} as const;

export const USER_V2_SCHEMA_STRING = JSON.stringify(USER_V2_SCHEMA_JSON);

/** Payload shape produced when serializing against v2. */
export interface UserV2 {
  readonly id: string;
  readonly displayName: string;
  readonly region: string;
  readonly email: string | null;
}

/**
 * User v2 BREAK — a variant that adds a *required* `email` field (no default).
 * The dogfood registers this against a compat=BACKWARD subject and asserts
 * the registry rejects it.
 */
export const USER_V2_BREAK_SCHEMA_JSON = {
  type: 'record',
  namespace: 'kiwa.dogfood.redpanda',
  name: 'User',
  fields: [
    { name: 'id', type: 'string', default: '' },
    { name: 'displayName', type: 'string', default: '' },
    { name: 'region', type: 'string', default: 'us' },
    { name: 'email', type: 'string' },
  ],
} as const;

export const USER_V2_BREAK_SCHEMA_STRING = JSON.stringify(USER_V2_BREAK_SCHEMA_JSON);
