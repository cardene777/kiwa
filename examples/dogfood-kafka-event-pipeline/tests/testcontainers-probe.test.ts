/**
 * Testcontainers probe (v1.31-2) behavior — mock adapter returns deterministic
 * endpoints, skipped real adapter returns unreachable + KAFKA_ENV_MISSING
 * trace, connected real adapter reports live endpoints when the env is opted
 * in.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter, MOCK_KAFKA_BOOTSTRAP, MOCK_SCHEMA_REGISTRY_URL } from '../src/adapters/mock.js';
import {
  detectRealEnv,
  KAFKA_ENV_MISSING,
  makeRealAdapter,
  REAL_ADAPTER_NOT_IMPLEMENTED,
  SkippedError,
} from '../src/adapters/real.js';

describe('testcontainers probe — mock mode', () => {
  it('T-DKT-001 mock probe returns deterministic Kafka + Schema Registry endpoints', async () => {
    const adapter = makeMockAdapter();
    const out = await adapter.driveTestcontainersProbe();
    expect(out.bootstrap).toBe(MOCK_KAFKA_BOOTSTRAP);
    expect(out.schemaRegistryUrl).toBe(MOCK_SCHEMA_REGISTRY_URL);
    expect(out.reachable).toBe(true);
    await adapter.reset();
  });

  it('T-DKT-002 mock probe reports the confluent Kafka + Schema Registry image tags', async () => {
    const adapter = makeMockAdapter();
    const out = await adapter.driveTestcontainersProbe();
    expect(out.kafkaImage).toContain('cp-kafka');
    expect(out.schemaRegistryImage).toContain('cp-schema-registry');
    await adapter.reset();
  });

  it('T-DKT-003 metrics.testcontainersProbes increments once per drive', async () => {
    const adapter = makeMockAdapter();
    await adapter.driveTestcontainersProbe();
    await adapter.driveTestcontainersProbe();
    expect(adapter.metrics().testcontainersProbes).toBe(2);
    await adapter.reset();
  });
});

describe('testcontainers probe — real adapter env gate', () => {
  const savedMode = process.env['KIWA_MODE'];
  const savedKey = process.env['KAFKA_KEY'];
  const savedBootstrap = process.env['KAFKA_BOOTSTRAP'];
  const savedRegistry = process.env['KAFKA_SCHEMA_REGISTRY_URL'];

  beforeEach(() => {
    delete process.env['KIWA_MODE'];
    delete process.env['KAFKA_KEY'];
    delete process.env['KAFKA_BOOTSTRAP'];
    delete process.env['KAFKA_SCHEMA_REGISTRY_URL'];
  });

  afterEach(() => {
    if (savedMode === undefined) delete process.env['KIWA_MODE'];
    else process.env['KIWA_MODE'] = savedMode;
    if (savedKey === undefined) delete process.env['KAFKA_KEY'];
    else process.env['KAFKA_KEY'] = savedKey;
    if (savedBootstrap === undefined) delete process.env['KAFKA_BOOTSTRAP'];
    else process.env['KAFKA_BOOTSTRAP'] = savedBootstrap;
    if (savedRegistry === undefined) delete process.env['KAFKA_SCHEMA_REGISTRY_URL'];
    else process.env['KAFKA_SCHEMA_REGISTRY_URL'] = savedRegistry;
  });

  it('T-DKT-ENV-001 detectRealEnv returns null when KIWA_MODE is not real', () => {
    expect(detectRealEnv()).toBeNull();
  });

  it('T-DKT-ENV-002 detectRealEnv returns null when KAFKA_KEY is missing', () => {
    process.env['KIWA_MODE'] = 'real';
    expect(detectRealEnv()).toBeNull();
  });

  it('T-DKT-ENV-003 detectRealEnv returns bootstrap + registry when both gates are open', () => {
    process.env['KIWA_MODE'] = 'real';
    process.env['KAFKA_KEY'] = 'kiwa-real-1';
    process.env['KAFKA_BOOTSTRAP'] = 'localhost:9092';
    process.env['KAFKA_SCHEMA_REGISTRY_URL'] = 'http://localhost:8081';
    const env = detectRealEnv();
    expect(env).toEqual({
      bootstrap: 'localhost:9092',
      schemaRegistryUrl: 'http://localhost:8081',
      clientId: 'dogfood-kafka-event-pipeline',
    });
  });

  it('T-DKT-ENV-004 skipped real adapter records KAFKA_ENV_MISSING on driveProducer', async () => {
    const adapter = await makeRealAdapter();
    await expect(adapter.driveProducer([])).rejects.toBeInstanceOf(SkippedError);
    const entry = adapter.traces().find((t) => t.op === 'driveProducer');
    expect(entry?.errorKind).toBe(KAFKA_ENV_MISSING);
    await adapter.reset();
  });

  it('T-DKT-ENV-005 skipped real probe records unreachable without throwing', async () => {
    const adapter = await makeRealAdapter();
    const out = await adapter.driveTestcontainersProbe();
    expect(out.reachable).toBe(false);
    expect(out.bootstrap).toBe('');
    const probeTrace = adapter.traces().find((t) => t.op === 'driveTestcontainersProbe');
    expect(probeTrace?.errorKind).toBe(KAFKA_ENV_MISSING);
    await adapter.reset();
  });

  it('T-DKT-ENV-006 connected real adapter reports env endpoints from KAFKA_BOOTSTRAP', async () => {
    process.env['KIWA_MODE'] = 'real';
    process.env['KAFKA_KEY'] = 'kiwa-real-1';
    process.env['KAFKA_BOOTSTRAP'] = 'localhost:19092';
    process.env['KAFKA_SCHEMA_REGISTRY_URL'] = 'http://localhost:18081';
    const adapter = await makeRealAdapter();
    // The probe attempts aliveness — it may or may not reach 19092, either
    // way the observation records the configured bootstrap.
    const out = await adapter.driveTestcontainersProbe();
    expect(out.bootstrap).toBe('localhost:19092');
    expect(out.schemaRegistryUrl).toBe('http://localhost:18081');
    await adapter.reset();
  });

  it('T-DKT-ENV-007 connected real adapter reports high-level ops as REAL_ADAPTER_NOT_IMPLEMENTED', async () => {
    process.env['KIWA_MODE'] = 'real';
    process.env['KAFKA_KEY'] = 'kiwa-real-1';
    process.env['KAFKA_BOOTSTRAP'] = 'localhost:19092';
    const adapter = await makeRealAdapter();
    await expect(adapter.driveRawProtocol()).rejects.toThrowError(
      new RegExp(REAL_ADAPTER_NOT_IMPLEMENTED),
    );
    await adapter.reset();
  });
});
