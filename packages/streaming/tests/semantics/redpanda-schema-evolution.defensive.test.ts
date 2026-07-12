import { describe, expect, it } from 'vitest';
import { createRedpandaSchemaEvolution } from '../../src/index.js';

// Follow-up file — closes reachable compat-oracle branches that
// redpanda-schema-evolution.branches.test.ts leaves open. In particular, the
// `REQUIRED_REMOVE` marker breaks FORWARD / FORWARD_TRANSITIVE mode, and the
// `check` / `versions` accessors are exercised against subjects that were
// never registered so the default-compat fallback fires.
//
// Complements redpanda-schema-evolution.branches.test.ts (T-RSE-B-001..008).

describe('createRedpandaSchemaEvolution defensive guards', () => {
  it('T-RSE-B-009 REQUIRED_REMOVE breaks FORWARD', () => {
    const evo = createRedpandaSchemaEvolution({ defaultCompatibility: 'FORWARD' });
    evo.register({ subject: 'Order', kind: 'avro', schema: 'v1' });
    // v2 carries the REQUIRED_REMOVE marker — the new marker vs v1 baseline
    // trips the FORWARD / FORWARD_TRANSITIVE / FULL / FULL_TRANSITIVE arm.
    expect(() =>
      evo.register({ subject: 'Order', kind: 'avro', schema: 'v2 REQUIRED_REMOVE:legacy' }),
    ).toThrow(/removed required field "legacy" breaks FORWARD/);
  });

  it('T-RSE-B-010 REQUIRED_REMOVE breaks FORWARD_TRANSITIVE', () => {
    const evo = createRedpandaSchemaEvolution({ defaultCompatibility: 'FORWARD_TRANSITIVE' });
    evo.register({ subject: 'Order', kind: 'avro', schema: 'v1' });
    expect(() =>
      evo.register({ subject: 'Order', kind: 'avro', schema: 'v2 REQUIRED_REMOVE:legacy' }),
    ).toThrow(/removed required field "legacy" breaks FORWARD_TRANSITIVE/);
  });

  it('T-RSE-B-011 REQUIRED_REMOVE breaks FULL / FULL_TRANSITIVE modes', () => {
    for (const mode of ['FULL', 'FULL_TRANSITIVE'] as const) {
      const evo = createRedpandaSchemaEvolution({ defaultCompatibility: mode });
      evo.register({ subject: 'Order', kind: 'avro', schema: 'v1' });
      expect(() =>
        evo.register({ subject: 'Order', kind: 'avro', schema: 'v2 REQUIRED_REMOVE:x' }),
      ).toThrow(new RegExp(`removed required field "x" breaks ${mode}`));
    }
  });

  it('T-RSE-B-012 TYPE_CHANGE reason surfaces on the reason list', () => {
    const evo = createRedpandaSchemaEvolution({ defaultCompatibility: 'BACKWARD' });
    evo.register({ subject: 'Order', kind: 'avro', schema: 'v1' });
    const check = evo.check({ subject: 'Order', kind: 'avro', schema: 'v2 TYPE_CHANGE:amount' });
    expect(check.compatible).toBe(false);
    expect(check.reasons.join(' ')).toMatch(/type change on field "amount"/);
  });

  it('T-RSE-B-013 versions on an unknown subject returns an empty array', () => {
    const evo = createRedpandaSchemaEvolution();
    expect(evo.versions('never-registered')).toEqual([]);
  });

  it('T-RSE-B-014 check on an unknown subject reports compatible=true against the default mode', () => {
    const evo = createRedpandaSchemaEvolution({ defaultCompatibility: 'FORWARD' });
    const result = evo.check({ subject: 'brand-new', kind: 'avro', schema: 'seed' });
    expect(result.compatible).toBe(true);
    expect(result.mode).toBe('FORWARD');
    expect(result.reasons).toEqual([]);
  });

  it('T-RSE-B-015 unresolved reference subject rejects registration', () => {
    const evo = createRedpandaSchemaEvolution();
    expect(() =>
      evo.register({
        subject: 'Order',
        kind: 'avro',
        schema: 'seed',
        references: [{ name: 'addr', subject: 'Address', version: 1 }],
      }),
    ).toThrow(/unknown reference subject "Address"/);
  });

  it('T-RSE-B-016 subjectFor topic-name concatenates topic + role', () => {
    const evo = createRedpandaSchemaEvolution({ subjectNamingStrategy: 'topic-name' });
    expect(evo.subjectFor('orders', 'value')).toBe('orders-value');
    expect(evo.subjectFor('orders', 'key')).toBe('orders-key');
  });

  it('T-RSE-B-017 subjectFor record-name / topic-record-name honor the supplied recordName', () => {
    const recordName = createRedpandaSchemaEvolution({ subjectNamingStrategy: 'record-name' });
    expect(recordName.subjectFor('orders', 'value', 'OrderRecord')).toBe('OrderRecord');
    const topicRecord = createRedpandaSchemaEvolution({ subjectNamingStrategy: 'topic-record-name' });
    expect(topicRecord.subjectFor('orders', 'value', 'OrderRecord')).toBe('orders-OrderRecord');
  });

  it('T-RSE-B-018 resolveReferences returns registered matches only', () => {
    const evo = createRedpandaSchemaEvolution({ defaultCompatibility: 'NONE' });
    evo.register({ subject: 'Address', kind: 'avro', schema: 'addr-v1' });
    const order = evo.register({
      subject: 'Order',
      kind: 'avro',
      schema: 'order-v1',
      references: [{ name: 'addr', subject: 'Address', version: 1 }],
    });
    // Second registration adds a reference to a subject that DOES exist but a
    // version that doesn't — resolve keeps the resolvable one only.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const withGhost = { ...order, references: [
      { name: 'addr', subject: 'Address', version: 1 },
      { name: 'ghost', subject: 'Address', version: 999 },
    ] } as typeof order;
    const resolved = evo.resolveReferences(withGhost);
    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.subject).toBe('Address');
  });
});
