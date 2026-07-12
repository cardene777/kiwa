import { describe, expect, it } from 'vitest';
import { createSchemaRegistry } from '../src/index.js';

// Follow-up file — closes the reachable branches in schema-registry.js that
// schema-registry.test.ts doesn't cover. Missing coverage lives on the
// `topic-record-name` subject strategy, the Protobuf-style `required` keyword
// path in `extractRequiredFields`, and the `getById` null-fallback for
// unknown ids.

describe('createSchemaRegistry defensive guards', () => {
  it('T-SR-B-001 subjectFor topic-record-name strategy uses the topic-Key / topic-Value suffix', () => {
    const reg = createSchemaRegistry({ subjectNamingStrategy: 'topic-record-name' });
    expect(reg.subjectFor('orders', 'key')).toBe('orders-Key');
    expect(reg.subjectFor('orders', 'value')).toBe('orders-Value');
  });

  it('T-SR-B-002 record-name strategy returns kind-specific suffix', () => {
    const reg = createSchemaRegistry({ subjectNamingStrategy: 'record-name' });
    expect(reg.subjectFor('orders', 'key')).toBe('ordersKey');
    expect(reg.subjectFor('orders', 'value')).toBe('ordersValue');
  });

  it('T-SR-B-003 getById returns null for an unknown id', async () => {
    const reg = createSchemaRegistry();
    const missing = await reg.getById(9999);
    expect(missing).toBeNull();
  });

  it('T-SR-B-004 getLatestVersion returns null for unknown / empty subjects', async () => {
    const reg = createSchemaRegistry();
    expect(await reg.getLatestVersion('never-registered')).toBeNull();
  });

  it('T-SR-B-005 listVersions returns empty array for unknown subject', async () => {
    const reg = createSchemaRegistry();
    expect(await reg.listVersions('never-registered')).toEqual([]);
  });

  it('T-SR-B-006 setCompatibility ensures the subject and updates its mode', async () => {
    const reg = createSchemaRegistry({ defaultCompatibility: 'BACKWARD' });
    await reg.setCompatibility('brand-new', 'NONE');
    expect(reg.getCompatibility('brand-new')).toBe('NONE');
    expect(await reg.listSubjects()).toContain('brand-new');
  });

  it('T-SR-B-007 checkCompatibility on an unknown subject reports the default mode as compatible', () => {
    const reg = createSchemaRegistry({ defaultCompatibility: 'FORWARD' });
    const result = reg.checkCompatibility({
      subject: 'brand-new',
      kind: 'avro',
      schema: 'seed',
    });
    expect(result.compatible).toBe(true);
    expect(result.mode).toBe('FORWARD');
  });

  it('T-SR-B-008 extractRequiredFields parses Protobuf-style required keyword', async () => {
    // The Protobuf required regex matches `required <type> <name> = <n>;`.
    // A first-version schema has no baseline; the second version adds a
    // required field via proto2 syntax → BACKWARD compat break.
    const reg = createSchemaRegistry({ defaultCompatibility: 'BACKWARD' });
    await reg.register({
      subject: 'events-value',
      kind: 'protobuf',
      schema: 'message E { required int32 id = 1; }',
    });
    await expect(
      reg.register({
        subject: 'events-value',
        kind: 'protobuf',
        schema: 'message E { required int32 id = 1; required string name = 2; }',
      }),
    ).rejects.toThrow(/required field "name" added \(breaks BACKWARD/);
  });

  it('T-SR-B-009 JSON schema `required` array is honored', async () => {
    const reg = createSchemaRegistry({ defaultCompatibility: 'BACKWARD' });
    await reg.register({
      subject: 'json-value',
      kind: 'json',
      schema: '{"type":"object","required":["id"],"properties":{}}',
    });
    await expect(
      reg.register({
        subject: 'json-value',
        kind: 'json',
        schema: '{"type":"object","required":["id","name"],"properties":{}}',
      }),
    ).rejects.toThrow(/required field "name" added/);
  });

  it('T-SR-B-010 schema kind change is always incompatible', async () => {
    const reg = createSchemaRegistry();
    await reg.register({ subject: 's', kind: 'avro', schema: '{}' });
    await expect(
      reg.register({ subject: 's', kind: 'json', schema: '{}' }),
    ).rejects.toThrow(/schema kind changed from avro to json/);
  });

  it('T-SR-B-011 NONE compat accepts any schema shape change', async () => {
    const reg = createSchemaRegistry({ defaultCompatibility: 'NONE' });
    await reg.register({
      subject: 's',
      kind: 'protobuf',
      schema: 'message E { required int32 id = 1; }',
    });
    const next = await reg.register({
      subject: 's',
      kind: 'protobuf',
      schema: 'message E { required int32 id = 1; required string name = 2; }',
    });
    expect(next.version).toBe(2);
  });

  it('T-SR-B-012 reset restarts the id sequence and clears subjects', async () => {
    const reg = createSchemaRegistry();
    await reg.register({ subject: 's', kind: 'json', schema: '{}' });
    reg.reset();
    expect(await reg.listSubjects()).toEqual([]);
    const reissued = await reg.register({ subject: 's', kind: 'json', schema: '{}' });
    expect(reissued.id).toBe(1);
  });
});
