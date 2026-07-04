import { describe, expect, it } from 'vitest';
import { createSchemaRegistry, isSchemaRegistry } from '../src/index.js';

describe('createSchemaRegistry (registration)', () => {
  it('T-SR-001 fresh subject accepts the first schema', async () => {
    const reg = createSchemaRegistry();
    expect(isSchemaRegistry(reg)).toBe(true);
    const entry = await reg.register({
      subject: 'events-value',
      kind: 'avro',
      schema: '{"type":"record","name":"E","fields":[{"name":"id","default":0}]}',
    });
    expect(entry.id).toBe(1);
    expect(entry.version).toBe(1);
  });

  it('T-SR-002 duplicate schema returns the existing version', async () => {
    const reg = createSchemaRegistry();
    const first = await reg.register({
      subject: 's',
      kind: 'json',
      schema: '{"type":"object"}',
    });
    const second = await reg.register({
      subject: 's',
      kind: 'json',
      schema: '{"type":"object"}',
    });
    expect(second.id).toBe(first.id);
    expect(second.version).toBe(first.version);
  });

  it('T-SR-003 getById returns the registered entry', async () => {
    const reg = createSchemaRegistry();
    const entry = await reg.register({
      subject: 's',
      kind: 'json',
      schema: '{"type":"object"}',
    });
    const fetched = await reg.getById(entry.id);
    expect(fetched?.subject).toBe('s');
  });

  it('T-SR-004 getLatestVersion returns the newest for the subject', async () => {
    const reg = createSchemaRegistry();
    await reg.register({
      subject: 's',
      kind: 'json',
      schema: '{"type":"object","properties":{}}',
    });
    await reg.register({
      subject: 's',
      kind: 'json',
      schema: '{"type":"object","properties":{"a":{}}}',
    });
    const latest = await reg.getLatestVersion('s');
    expect(latest?.version).toBe(2);
  });

  it('T-SR-005 listVersions returns entries in registration order', async () => {
    const reg = createSchemaRegistry();
    await reg.register({ subject: 's', kind: 'json', schema: '{"v":1}' });
    await reg.register({ subject: 's', kind: 'json', schema: '{"v":2}' });
    const versions = await reg.listVersions('s');
    expect(versions.map((v) => v.version)).toEqual([1, 2]);
  });

  it('T-SR-006 listSubjects enumerates all registered subjects', async () => {
    const reg = createSchemaRegistry();
    await reg.register({ subject: 'a', kind: 'json', schema: '{}' });
    await reg.register({ subject: 'b', kind: 'json', schema: '{}' });
    expect((await reg.listSubjects()).sort()).toEqual(['a', 'b']);
  });
});

describe('createSchemaRegistry (compatibility)', () => {
  it('T-SR-007 BACKWARD compat allows adding an optional field', async () => {
    const reg = createSchemaRegistry();
    await reg.register({
      subject: 's',
      kind: 'avro',
      schema: '{"type":"record","fields":[{"name":"id","default":0}]}',
    });
    const check = reg.checkCompatibility({
      subject: 's',
      kind: 'avro',
      schema: '{"type":"record","fields":[{"name":"id","default":0},{"name":"name","default":""}]}',
    });
    expect(check.compatible).toBe(true);
  });

  it('T-SR-008 BACKWARD compat rejects adding a required field', async () => {
    const reg = createSchemaRegistry();
    await reg.register({
      subject: 's',
      kind: 'avro',
      schema: '{"type":"record","fields":[{"name":"id","default":0}]}',
    });
    const check = reg.checkCompatibility({
      subject: 's',
      kind: 'avro',
      schema: '{"type":"record","fields":[{"name":"id","default":0},{"name":"name"}]}',
    });
    expect(check.compatible).toBe(false);
    expect(check.reasons.some((r) => r.includes('name'))).toBe(true);
  });

  it('T-SR-009 register throws when compat check fails', async () => {
    const reg = createSchemaRegistry();
    await reg.register({
      subject: 's',
      kind: 'avro',
      schema: '{"type":"record","fields":[{"name":"id","default":0}]}',
    });
    await expect(
      reg.register({
        subject: 's',
        kind: 'avro',
        schema: '{"type":"record","fields":[{"name":"id","default":0},{"name":"required-field"}]}',
      }),
    ).rejects.toThrow(/incompatible/);
  });

  it('T-SR-010 NONE mode accepts any change including kind switch', async () => {
    const reg = createSchemaRegistry({ defaultCompatibility: 'NONE' });
    await reg.register({ subject: 's', kind: 'avro', schema: '{"type":"record","fields":[]}' });
    const check = reg.checkCompatibility({
      subject: 's',
      kind: 'json',
      schema: '{"type":"object"}',
    });
    expect(check.compatible).toBe(true);
  });

  it('T-SR-011 kind change breaks BACKWARD compat', async () => {
    const reg = createSchemaRegistry();
    await reg.register({ subject: 's', kind: 'avro', schema: '{"type":"record","fields":[]}' });
    const check = reg.checkCompatibility({
      subject: 's',
      kind: 'json',
      schema: '{"type":"object"}',
    });
    expect(check.compatible).toBe(false);
    expect(check.reasons.some((r) => r.includes('kind'))).toBe(true);
  });

  it('T-SR-012 setCompatibility overrides subject compat mode', async () => {
    const reg = createSchemaRegistry();
    await reg.register({ subject: 's', kind: 'json', schema: '{"required":["a"]}' });
    await reg.setCompatibility('s', 'NONE');
    // Removing required "a" — would break BACKWARD but NONE allows it.
    const check = reg.checkCompatibility({
      subject: 's',
      kind: 'json',
      schema: '{"required":[]}',
    });
    expect(check.compatible).toBe(true);
  });
});

describe('createSchemaRegistry (subject naming)', () => {
  it('T-SR-013 topic-name strategy produces topic-<kind>', () => {
    const reg = createSchemaRegistry({ subjectNamingStrategy: 'topic-name' });
    expect(reg.subjectFor('orders', 'value')).toBe('orders-value');
    expect(reg.subjectFor('orders', 'key')).toBe('orders-key');
  });

  it('T-SR-014 record-name strategy produces topicKey / topicValue', () => {
    const reg = createSchemaRegistry({ subjectNamingStrategy: 'record-name' });
    expect(reg.subjectFor('Orders', 'key')).toBe('OrdersKey');
    expect(reg.subjectFor('Orders', 'value')).toBe('OrdersValue');
  });

  it('T-SR-015 reset() clears all subjects', async () => {
    const reg = createSchemaRegistry();
    await reg.register({ subject: 's', kind: 'json', schema: '{}' });
    reg.reset();
    expect(await reg.listSubjects()).toEqual([]);
  });
});
