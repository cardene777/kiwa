/**
 * Order v1 — the third Avro schema in the dogfood; scoped to the
 * `orders-value` subject. Included to exercise `listSubjects()` across
 * multiple subjects + confirm subject naming strategy is per-topic.
 */

export const ORDER_V1_SCHEMA_JSON = {
  type: 'record',
  namespace: 'kiwa.dogfood.redpanda',
  name: 'Order',
  fields: [
    { name: 'orderId', type: 'string', default: '' },
    { name: 'userId', type: 'string', default: '' },
    { name: 'total', type: 'double', default: 0 },
  ],
} as const;

export const ORDER_V1_SCHEMA_STRING = JSON.stringify(ORDER_V1_SCHEMA_JSON);

/** Payload shape produced when serializing against Order v1. */
export interface OrderV1 {
  readonly orderId: string;
  readonly userId: string;
  readonly total: number;
}
