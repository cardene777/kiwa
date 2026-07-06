import { describe, expect, it } from 'vitest';
import {
  createRedpandaSchemaEvolution,
  isRedpandaSchemaEvolution,
} from '../../src/index.js';

describe('createRedpandaSchemaEvolution', () => {
  it('T-RSE-001 register assigns monotonic id + version', () => {
    const evo = createRedpandaSchemaEvolution();
    expect(isRedpandaSchemaEvolution(evo)).toBe(true);
    const v1 = evo.register({ subject: 'Order', kind: 'avro', schema: 'v1' });
    const v2 = evo.register({ subject: 'Order', kind: 'avro', schema: 'v1 OPTIONAL_ADD:tag' });
    expect(v1.id).toBe(1);
    expect(v1.version).toBe(1);
    expect(v2.id).toBe(2);
    expect(v2.version).toBe(2);
  });

  it('T-RSE-002 BACKWARD rejects added required fields', () => {
    const evo = createRedpandaSchemaEvolution({ defaultCompatibility: 'BACKWARD' });
    evo.register({ subject: 'Order', kind: 'avro', schema: 'base' });
    expect(() =>
      evo.register({ subject: 'Order', kind: 'avro', schema: 'base REQUIRED_ADD:currency' }),
    ).toThrow(/breaks BACKWARD/);
  });

  it('T-RSE-003 FORWARD rejects removed required fields', () => {
    const evo = createRedpandaSchemaEvolution({ defaultCompatibility: 'FORWARD' });
    evo.register({ subject: 'Order', kind: 'avro', schema: 'base REQUIRED_ADD:currency' });
    expect(() =>
      evo.register({ subject: 'Order', kind: 'avro', schema: 'base REQUIRED_REMOVE:currency' }),
    ).toThrow(/breaks FORWARD/);
  });

  it('T-RSE-004 NONE mode accepts any change', () => {
    const evo = createRedpandaSchemaEvolution({ defaultCompatibility: 'NONE' });
    evo.register({ subject: 'Order', kind: 'avro', schema: 'v1' });
    evo.register({ subject: 'Order', kind: 'avro', schema: 'v2 TYPE_CHANGE:total REQUIRED_ADD:x' });
    expect(evo.versions('Order')).toHaveLength(2);
  });

  it('T-RSE-005 references must resolve to registered subject-versions', () => {
    const evo = createRedpandaSchemaEvolution();
    evo.register({ subject: 'Address', kind: 'avro', schema: 'addr-v1' });
    const order = evo.register({
      subject: 'Order',
      kind: 'avro',
      schema: 'order-v1',
      references: [{ name: 'address', subject: 'Address', version: 1 }],
    });
    expect(order.references).toHaveLength(1);
    expect(() =>
      evo.register({
        subject: 'Order',
        kind: 'avro',
        schema: 'order-v2',
        references: [{ name: 'address', subject: 'Missing', version: 1 }],
      }),
    ).toThrow(/unknown reference subject/);
  });

  it('T-RSE-006 subjectFor derives subject from topic + strategy', () => {
    const topic = createRedpandaSchemaEvolution({ subjectNamingStrategy: 'topic-name' });
    expect(topic.subjectFor('orders', 'value')).toBe('orders-value');
    const record = createRedpandaSchemaEvolution({ subjectNamingStrategy: 'record-name' });
    expect(record.subjectFor('orders', 'value', 'com.acme.Order')).toBe('com.acme.Order');
    const both = createRedpandaSchemaEvolution({ subjectNamingStrategy: 'topic-record-name' });
    expect(both.subjectFor('orders', 'value', 'com.acme.Order')).toBe('orders-com.acme.Order');
  });

  it('T-RSE-007 resolveReferences returns the referenced schemas', () => {
    const evo = createRedpandaSchemaEvolution();
    evo.register({ subject: 'Address', kind: 'avro', schema: 'addr-v1' });
    const order = evo.register({
      subject: 'Order',
      kind: 'avro',
      schema: 'order-v1',
      references: [{ name: 'address', subject: 'Address', version: 1 }],
    });
    const resolved = evo.resolveReferences(order);
    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.subject).toBe('Address');
  });
});
