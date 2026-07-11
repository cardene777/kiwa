import { describe, expect, it } from 'vitest';
import { createRedpandaSchemaEvolution } from '../../src/index.js';

// Follow-up file — covers latest / setCompatibility / getCompatibility /
// unresolved-reference-version / topic-record-name missing recordName /
// reset() branches that T-RSE-* doesn't reach.

describe('createRedpandaSchemaEvolution state guards', () => {
  it('T-RSE-B-001 latest returns null for an unknown subject', () => {
    const evo = createRedpandaSchemaEvolution();
    expect(evo.latest('Unknown')).toBeNull();
  });

  it('T-RSE-B-002 latest returns the most recent registered version', () => {
    const evo = createRedpandaSchemaEvolution({ defaultCompatibility: 'NONE' });
    evo.register({ subject: 'Order', kind: 'avro', schema: 'v1' });
    evo.register({ subject: 'Order', kind: 'avro', schema: 'v2' });
    const latest = evo.latest('Order');
    expect(latest?.version).toBe(2);
    expect(latest?.schema).toBe('v2');
  });

  it('T-RSE-B-003 setCompatibility overrides the subject compat mode', () => {
    const evo = createRedpandaSchemaEvolution({ defaultCompatibility: 'BACKWARD' });
    evo.setCompatibility('Order', 'NONE');
    expect(evo.getCompatibility('Order')).toBe('NONE');
    // NONE mode accepts any change → REQUIRED_ADD is allowed.
    evo.register({ subject: 'Order', kind: 'avro', schema: 'v1' });
    evo.register({ subject: 'Order', kind: 'avro', schema: 'v2 REQUIRED_ADD:x' });
    expect(evo.versions('Order')).toHaveLength(2);
  });

  it('T-RSE-B-004 getCompatibility falls back to default for unknown subject', () => {
    const evo = createRedpandaSchemaEvolution({ defaultCompatibility: 'FORWARD' });
    expect(evo.getCompatibility('never-registered')).toBe('FORWARD');
  });

  it('T-RSE-B-005 register with unresolved reference version rejects', () => {
    const evo = createRedpandaSchemaEvolution();
    evo.register({ subject: 'Address', kind: 'avro', schema: 'addr-v1' });
    expect(() =>
      evo.register({
        subject: 'Order',
        kind: 'avro',
        schema: 'order-v1',
        references: [{ name: 'address', subject: 'Address', version: 999 }],
      }),
    ).toThrow(/reference version 999 not registered/);
  });

  it('T-RSE-B-006 subjectFor topic-record-name without recordName rejects', () => {
    const evo = createRedpandaSchemaEvolution({ subjectNamingStrategy: 'topic-record-name' });
    expect(() => evo.subjectFor('orders', 'value')).toThrow(/topic-record-name strategy needs a recordName/);
  });

  it('T-RSE-B-007 subjectFor record-name without recordName rejects', () => {
    const evo = createRedpandaSchemaEvolution({ subjectNamingStrategy: 'record-name' });
    expect(() => evo.subjectFor('orders', 'value')).toThrow(/record-name strategy needs a recordName/);
  });

  it('T-RSE-B-008 reset clears subject registry and restarts id sequence', () => {
    const evo = createRedpandaSchemaEvolution();
    evo.register({ subject: 'Order', kind: 'avro', schema: 'v1' });
    evo.reset();
    expect(evo.latest('Order')).toBeNull();
    const reissued = evo.register({ subject: 'Order', kind: 'avro', schema: 'v1-again' });
    expect(reissued.id).toBe(1);
    expect(reissued.version).toBe(1);
  });
});
