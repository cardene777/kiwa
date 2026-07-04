/**
 * User v1 — the baseline Avro schema for the `users-value` subject.
 *
 * Every field has a `default` so the record parses as backward-compatible
 * against any later version that adds optional fields — see `user-v2.ts` for
 * the evolution case that adds an optional `email` field.
 */

export const USER_V1_SCHEMA_JSON = {
  type: 'record',
  namespace: 'kiwa.dogfood.redpanda',
  name: 'User',
  fields: [
    { name: 'id', type: 'string', default: '' },
    { name: 'displayName', type: 'string', default: '' },
    { name: 'region', type: 'string', default: 'us' },
  ],
} as const;

export const USER_V1_SCHEMA_STRING = JSON.stringify(USER_V1_SCHEMA_JSON);

/** Payload shape produced when serializing against v1. */
export interface UserV1 {
  readonly id: string;
  readonly displayName: string;
  readonly region: string;
}
