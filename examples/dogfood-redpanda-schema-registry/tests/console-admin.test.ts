/**
 * T-DRC-* — Redpanda Console admin API client.
 *
 * v1.31-3 introduces a small HTTP client over `/api/subjects` +
 * `/api/config/{subject}` + `/api/schemas/ids/{id}` + `/api/health` +
 * wires it into the mock adapter's `driveConsoleAdmin` via a deterministic
 * fixture fetch. These tests exercise both the client and the mock adapter
 * flow.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  createConsoleAdminClient,
  createFixtureFetch,
} from '../src/console/index.js';

describe('createConsoleAdminClient — endpoint surface', () => {
  it('T-DRC-CL-001 listSubjects decodes { subjects: [...] } envelope', async () => {
    const client = createConsoleAdminClient({
      baseUrl: 'http://console.mock',
      fetchImpl: createFixtureFetch({
        subjects: ['users-value', 'orders-value'],
        configBySubject: { 'users-value': 'BACKWARD' },
        schemaById: { 1: '{}' },
      }),
    });
    const result = await client.listSubjects();
    expect(result.ok).toBe(true);
    expect(result.subjects).toEqual(['users-value', 'orders-value']);
  });

  it('T-DRC-CL-002 getSubjectConfig returns compatibility level or null', async () => {
    const client = createConsoleAdminClient({
      baseUrl: 'http://console.mock',
      fetchImpl: createFixtureFetch({
        subjects: ['users-value'],
        configBySubject: { 'users-value': 'FULL' },
        schemaById: {},
      }),
    });
    const found = await client.getSubjectConfig('users-value');
    expect(found.ok).toBe(true);
    expect(found.compatibilityLevel).toBe('FULL');
    const missing = await client.getSubjectConfig('unknown');
    expect(missing.ok).toBe(false);
    expect(missing.compatibilityLevel).toBeNull();
  });

  it('T-DRC-CL-003 getSchemaById decodes { schema: string } envelope', async () => {
    const client = createConsoleAdminClient({
      baseUrl: 'http://console.mock',
      fetchImpl: createFixtureFetch({
        subjects: [],
        configBySubject: {},
        schemaById: { 42: '{"type":"record","name":"X"}' },
      }),
    });
    const found = await client.getSchemaById(42);
    expect(found.ok).toBe(true);
    expect(found.schema).toContain('record');
    const missing = await client.getSchemaById(99);
    expect(missing.ok).toBe(false);
    expect(missing.schema).toBeNull();
  });

  it('T-DRC-CL-004 health returns { ok, status } from /api/health', async () => {
    const client = createConsoleAdminClient({
      baseUrl: 'http://console.mock',
      fetchImpl: createFixtureFetch({
        subjects: [],
        configBySubject: {},
        schemaById: {},
        healthStatus: 'up',
      }),
    });
    const result = await client.health();
    expect(result.ok).toBe(true);
    expect(result.status).toBe('up');
  });

  it('T-DRC-CL-005 hits() records every endpoint the client hit', async () => {
    const client = createConsoleAdminClient({
      baseUrl: 'http://console.mock',
      fetchImpl: createFixtureFetch({
        subjects: ['users-value'],
        configBySubject: { 'users-value': 'BACKWARD' },
        schemaById: { 1: '{}' },
      }),
    });
    await client.health();
    await client.listSubjects();
    await client.getSubjectConfig('users-value');
    await client.getSchemaById(1);
    const paths = client.hits().map((h) => h.path);
    expect(paths).toEqual([
      '/api/health',
      '/api/subjects',
      '/api/config/users-value',
      '/api/schemas/ids/1',
    ]);
  });

  it('T-DRC-CL-006 reset() clears the hit log', async () => {
    const client = createConsoleAdminClient({
      baseUrl: 'http://console.mock',
      fetchImpl: createFixtureFetch({
        subjects: [],
        configBySubject: {},
        schemaById: {},
      }),
    });
    await client.health();
    expect(client.hits()).toHaveLength(1);
    client.reset();
    expect(client.hits()).toHaveLength(0);
  });

  it('T-DRC-CL-007 fetch errors surface as ok=false hits with status 0', async () => {
    const client = createConsoleAdminClient({
      baseUrl: 'http://console.mock',
      fetchImpl: async () => {
        throw new Error('network');
      },
    });
    const result = await client.health();
    expect(result.ok).toBe(false);
    expect(client.hits()[0]?.status).toBe(0);
  });
});

describe('driveConsoleAdmin — mock adapter integration', () => {
  it('T-DRC-AD-001 records healthOk + subjectsSeen + schemaByIdReachable', async () => {
    const adapter = makeMockAdapter();
    const out = await adapter.driveConsoleAdmin();
    expect(out.healthOk).toBe(true);
    expect(out.subjectsSeen).toBeGreaterThan(0);
    expect(out.schemaByIdReachable).toBe(true);
    await adapter.reset();
  });

  it('T-DRC-AD-002 endpoints list includes the 4 admin paths', async () => {
    const adapter = makeMockAdapter();
    const out = await adapter.driveConsoleAdmin();
    const paths = out.endpoints.map((e) => e.path);
    expect(paths).toContain('/api/subjects');
    expect(paths).toContain('/api/health');
    expect(paths.some((p) => p.startsWith('/api/schemas/ids/'))).toBe(true);
    await adapter.reset();
  });

  it('T-DRC-AD-003 metrics counter consoleAdminCalls advances by the endpoint count', async () => {
    const adapter = makeMockAdapter();
    const before = adapter.metrics().consoleAdminCalls;
    await adapter.driveConsoleAdmin();
    const after = adapter.metrics().consoleAdminCalls;
    expect(after - before).toBeGreaterThanOrEqual(3);
    await adapter.reset();
  });
});
