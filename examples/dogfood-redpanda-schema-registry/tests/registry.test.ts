import { createRedpandaMock } from '@kiwa-lab/streaming';
import { afterEach, describe, expect, it } from 'vitest';
import { createRegistryRun } from '../src/registry/index.js';
import {
  ORDER_V1_SCHEMA_STRING,
  USER_V1_SCHEMA_STRING,
  USER_V2_BREAK_SCHEMA_STRING,
  USER_V2_SCHEMA_STRING,
} from '../src/schemas/index.js';

let rp: ReturnType<typeof createRedpandaMock> | null = null;

afterEach(() => {
  rp?.reset();
  rp = null;
});

function makeMock() {
  rp = createRedpandaMock({
    schemaRegistry: { defaultCompatibility: 'BACKWARD', subjectNamingStrategy: 'topic-name' },
  });
  return rp;
}

describe('registry — subject naming + registration + evolution', () => {
  it('T-DRR-001 register 3 Avro schemas across 2 subjects with topic-name strategy', async () => {
    const registry = makeMock().schemaRegistry;
    const reg = createRegistryRun(registry);
    const user = await reg.register({
      topic: 'users',
      kind: 'avro',
      schema: USER_V1_SCHEMA_STRING,
    });
    const order = await reg.register({
      topic: 'orders',
      kind: 'avro',
      schema: ORDER_V1_SCHEMA_STRING,
    });
    // Re-register the same user schema — dedup returns identical id.
    const userDup = await reg.register({
      topic: 'users',
      kind: 'avro',
      schema: USER_V1_SCHEMA_STRING,
    });
    expect(user.subject).toBe('users-value');
    expect(order.subject).toBe('orders-value');
    expect(user.id).toBe(userDup.id);
    expect(await registry.listSubjects()).toHaveLength(2);
  });

  it('T-DRR-002 evolve User v1 -> v2 (adds optional email) with BACKWARD default', async () => {
    const registry = makeMock().schemaRegistry;
    const reg = createRegistryRun(registry);
    const v1 = await reg.register({
      topic: 'users-evo',
      kind: 'avro',
      schema: USER_V1_SCHEMA_STRING,
    });
    const v2 = await reg.register({
      topic: 'users-evo',
      kind: 'avro',
      schema: USER_V2_SCHEMA_STRING,
    });
    expect(v2.version).toBe(v1.version + 1);
    const versions = await registry.listVersions('users-evo-value');
    expect(versions).toHaveLength(2);
  });

  it('T-DRR-003 BACKWARD rejects User v2 BREAK (adds required email, no default)', async () => {
    const registry = makeMock().schemaRegistry;
    const reg = createRegistryRun(registry);
    await reg.register({
      topic: 'users-brk',
      kind: 'avro',
      schema: USER_V1_SCHEMA_STRING,
    });
    await expect(
      reg.register({
        topic: 'users-brk',
        kind: 'avro',
        schema: USER_V2_BREAK_SCHEMA_STRING,
      }),
    ).rejects.toThrow(/incompatible/);
  });

  it('T-DRR-004 setCompatibility flips the subject to FORWARD then FULL', async () => {
    const registry = makeMock().schemaRegistry;
    const reg = createRegistryRun(registry);
    await reg.register({
      topic: 'users-c',
      kind: 'avro',
      schema: USER_V1_SCHEMA_STRING,
    });
    expect(registry.getCompatibility('users-c-value')).toBe('BACKWARD');
    await reg.setCompatibility('users-c', 'FORWARD');
    expect(registry.getCompatibility('users-c-value')).toBe('FORWARD');
    await reg.setCompatibility('users-c', 'FULL');
    expect(registry.getCompatibility('users-c-value')).toBe('FULL');
  });

  it('T-DRR-005 checkCompatibility surfaces reasons on incompatible v2 BREAK', async () => {
    const registry = makeMock().schemaRegistry;
    const reg = createRegistryRun(registry);
    await reg.register({
      topic: 'users-r',
      kind: 'avro',
      schema: USER_V1_SCHEMA_STRING,
    });
    const check = reg.checkCompatibility({
      topic: 'users-r',
      kind: 'avro',
      schema: USER_V2_BREAK_SCHEMA_STRING,
    });
    expect(check.compatible).toBe(false);
    expect(check.reasons.some((r) => r.includes('email'))).toBe(true);
  });
});
