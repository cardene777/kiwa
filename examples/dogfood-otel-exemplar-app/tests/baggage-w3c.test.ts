/**
 * Baggage + W3C Trace Context propagation tests. The observability v2.1
 * otel-advanced axis semantics enforce a few invariants
 * (traceparent format, baggage key/value non-empty) that the dogfood
 * app inherits — these tests exercise both the happy paths and the
 * throw paths to prove the mock adapter re-uses the semantics without
 * loosening the contract.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { OtelExemplarAdapter } from '../src/adapters/interface.js';
import {
  ALL_BAGGAGE_SETS,
  BAGGAGE_FEATURE_FLAG,
  BAGGAGE_SESSION,
  BAGGAGE_TENANT,
  BAGGAGE_USER,
} from '../src/policies/baggage-sets.js';
import {
  ALL_W3C_HEADERS,
  W3C_NOT_SAMPLED_TRACEPARENT,
  W3C_SAMPLED_TRACEPARENT,
  W3C_TRACEPARENT_WITH_STATE,
} from '../src/policies/w3c-headers.js';
import { PIPELINE_TRACES } from '../src/policies/pipelines.js';

function newMock(): OtelExemplarAdapter {
  return makeMockAdapter();
}

describe('dogfood-otel-exemplar-app — baggage propagation', () => {
  it('T-DFOTEL-BG-001 session baggage propagates 1 entry', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    const result = await mock.propagateBaggage({
      bucket: 'traces',
      entries: BAGGAGE_SESSION,
    });
    expect(result.entryCount).toBe(1);
    expect(result.addedKeys).toContain('session.id');
  });

  it('T-DFOTEL-BG-002 user baggage propagates user.id + user.role', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    const result = await mock.propagateBaggage({
      bucket: 'traces',
      entries: BAGGAGE_USER,
    });
    expect(result.entryCount).toBe(2);
    expect(result.addedKeys).toContain('user.id');
    expect(result.addedKeys).toContain('user.role');
  });

  it('T-DFOTEL-BG-003 tenant baggage propagates tenant.id + tenant.tier', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    const result = await mock.propagateBaggage({
      bucket: 'traces',
      entries: BAGGAGE_TENANT,
    });
    expect(result.entryCount).toBe(2);
    expect(result.addedKeys).toContain('tenant.id');
  });

  it('T-DFOTEL-BG-004 feature-flag baggage propagates 2 flag entries', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    const result = await mock.propagateBaggage({
      bucket: 'traces',
      entries: BAGGAGE_FEATURE_FLAG,
    });
    expect(result.entryCount).toBe(2);
    expect(result.addedKeys.some((k) => k.startsWith('feature.flag.'))).toBe(true);
  });

  it('T-DFOTEL-BG-005 propagateBaggage rejects empty key', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    await expect(
      mock.propagateBaggage({ bucket: 'traces', entries: { '': 'v' } }),
    ).rejects.toThrow(/baggage key/);
  });

  it('T-DFOTEL-BG-006 propagateBaggage rejects empty value', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    await expect(
      mock.propagateBaggage({ bucket: 'traces', entries: { k: '' } }),
    ).rejects.toThrow(/baggage value/);
  });

  it('T-DFOTEL-BG-007 baggage entries merge across 4 canonical sets', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    for (const set of ALL_BAGGAGE_SETS) {
      await mock.propagateBaggage({ bucket: 'traces', entries: set });
    }
    // session (1) + user (2) + tenant (2) + feature (2) = 7
    const trace = mock.trace();
    const last = trace.filter((t) => t.op === 'propagateBaggage').pop();
    expect(last?.metadata.entryCount).toBe(7);
  });
});

describe('dogfood-otel-exemplar-app — W3C Trace Context', () => {
  it('T-DFOTEL-W3-001 sampled traceparent yields flags=01', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    const result = await mock.extractW3CContext({
      bucket: 'traces',
      headers: { traceparent: W3C_SAMPLED_TRACEPARENT },
    });
    expect(result.flags).toBe('01');
  });

  it('T-DFOTEL-W3-002 not-sampled traceparent yields flags=00', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    const result = await mock.extractW3CContext({
      bucket: 'traces',
      headers: { traceparent: W3C_NOT_SAMPLED_TRACEPARENT },
    });
    expect(result.flags).toBe('00');
  });

  it('T-DFOTEL-W3-003 traceparent + tracestate sets hasTracestate=true', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    const result = await mock.extractW3CContext({
      bucket: 'traces',
      headers: W3C_TRACEPARENT_WITH_STATE,
    });
    expect(result.hasTracestate).toBe(true);
  });

  it('T-DFOTEL-W3-004 traceparent without tracestate sets hasTracestate=false', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    const result = await mock.extractW3CContext({
      bucket: 'traces',
      headers: { traceparent: W3C_SAMPLED_TRACEPARENT },
    });
    expect(result.hasTracestate).toBe(false);
  });

  it('T-DFOTEL-W3-005 traceId length is exactly 32 hex chars', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    const result = await mock.extractW3CContext({
      bucket: 'traces',
      headers: { traceparent: W3C_SAMPLED_TRACEPARENT },
    });
    expect(result.traceId).toHaveLength(32);
  });

  it('T-DFOTEL-W3-006 spanId length is exactly 16 hex chars', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    const result = await mock.extractW3CContext({
      bucket: 'traces',
      headers: { traceparent: W3C_SAMPLED_TRACEPARENT },
    });
    expect(result.spanId).toHaveLength(16);
  });

  it('T-DFOTEL-W3-007 invalid traceId (wrong length) throws', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    await expect(
      mock.extractW3CContext({
        bucket: 'traces',
        headers: { traceparent: '00-short-00f067aa0ba902b7-01' },
      }),
    ).rejects.toThrow(/traceId must be 32/);
  });

  it('T-DFOTEL-W3-008 invalid spanId (wrong length) throws', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    await expect(
      mock.extractW3CContext({
        bucket: 'traces',
        headers: {
          traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-short-01',
        },
      }),
    ).rejects.toThrow(/spanId must be 16/);
  });

  it('T-DFOTEL-W3-009 all canonical headers extract without error', async () => {
    const mock = newMock();
    await mock.startPipeline(PIPELINE_TRACES);
    for (const headers of ALL_W3C_HEADERS) {
      const result = await mock.extractW3CContext({
        bucket: 'traces',
        headers,
      });
      expect(result.version).toBe('00');
      expect(result.traceId).toHaveLength(32);
      expect(result.spanId).toHaveLength(16);
    }
  });
});
