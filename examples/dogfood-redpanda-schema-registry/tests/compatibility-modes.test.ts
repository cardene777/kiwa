import { createRedpandaMock } from '@kiwa-lab/streaming';
import { afterEach, describe, expect, it } from 'vitest';
import { createRegistryRun } from '../src/registry/index.js';
import {
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

describe('compatibility modes — BACKWARD / FORWARD / FULL / NONE', () => {
  it('T-DRM-001 BACKWARD accepts optional field addition (v1 -> v2)', async () => {
    const reg = createRegistryRun(makeMock().schemaRegistry);
    await reg.register({ topic: 't-bwd', kind: 'avro', schema: USER_V1_SCHEMA_STRING });
    const check = reg.checkCompatibility({
      topic: 't-bwd',
      kind: 'avro',
      schema: USER_V2_SCHEMA_STRING,
    });
    expect(check.compatible).toBe(true);
    expect(check.mode).toBe('BACKWARD');
  });

  it('T-DRM-002 BACKWARD rejects required field addition (v1 -> v2 BREAK)', async () => {
    const reg = createRegistryRun(makeMock().schemaRegistry);
    await reg.register({ topic: 't-bwd', kind: 'avro', schema: USER_V1_SCHEMA_STRING });
    const check = reg.checkCompatibility({
      topic: 't-bwd',
      kind: 'avro',
      schema: USER_V2_BREAK_SCHEMA_STRING,
    });
    expect(check.compatible).toBe(false);
  });

  it('T-DRM-003 FORWARD rejects required field addition (same as BACKWARD on mock structural rules)', async () => {
    const registry = makeMock().schemaRegistry;
    const reg = createRegistryRun(registry);
    await reg.register({ topic: 't-fwd', kind: 'avro', schema: USER_V1_SCHEMA_STRING });
    await reg.setCompatibility('t-fwd', 'FORWARD');
    const check = reg.checkCompatibility({
      topic: 't-fwd',
      kind: 'avro',
      schema: USER_V2_BREAK_SCHEMA_STRING,
    });
    expect(check.compatible).toBe(false);
    expect(check.mode).toBe('FORWARD');
  });

  it('T-DRM-004 FULL rejects any change that would violate BACKWARD or FORWARD', async () => {
    const registry = makeMock().schemaRegistry;
    const reg = createRegistryRun(registry);
    await reg.register({ topic: 't-full', kind: 'avro', schema: USER_V1_SCHEMA_STRING });
    await reg.setCompatibility('t-full', 'FULL');
    const check = reg.checkCompatibility({
      topic: 't-full',
      kind: 'avro',
      schema: USER_V2_BREAK_SCHEMA_STRING,
    });
    expect(check.compatible).toBe(false);
    expect(check.mode).toBe('FULL');
  });

  it('T-DRM-005 NONE accepts every change including required field addition', async () => {
    const registry = makeMock().schemaRegistry;
    const reg = createRegistryRun(registry);
    await reg.register({ topic: 't-none', kind: 'avro', schema: USER_V1_SCHEMA_STRING });
    await reg.setCompatibility('t-none', 'NONE');
    const check = reg.checkCompatibility({
      topic: 't-none',
      kind: 'avro',
      schema: USER_V2_BREAK_SCHEMA_STRING,
    });
    expect(check.compatible).toBe(true);
    expect(check.mode).toBe('NONE');
  });
});
