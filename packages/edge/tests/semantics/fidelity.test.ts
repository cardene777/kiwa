import { describe, expect, it } from 'vitest';
import {
  AXIS_TO_EVENTS,
  collectFidelityCoverage,
  type EdgeAxis,
} from '../../src/index.js';

describe('fidelity harness — 3 platform × 8 axis grid', () => {
  it('produces 24 rows (3 platform × 8 axis)', () => {
    const coverage = collectFidelityCoverage(['cloudflare', 'vercel', 'deno']);
    expect(coverage.platforms).toEqual(['cloudflare', 'vercel', 'deno']);
    expect(coverage.axes).toEqual([
      'durable-object',
      'websocket-edge',
      'edge-kv',
      'geo-replicated',
      'cron-trigger',
      'subrequest-limit',
      'cpu-time-limit',
      'streaming-response',
    ]);
    expect(coverage.rows).toHaveLength(24);
  });

  it('every row has neutral events mapped to platform events', () => {
    const coverage = collectFidelityCoverage(['cloudflare', 'vercel', 'deno']);
    for (const row of coverage.rows) {
      expect(row.neutralEvents.length).toBe(AXIS_TO_EVENTS[row.axis].length);
      expect(row.platformEvents.length).toBe(row.neutralEvents.length);
      expect(row.platformEvents.every((e) => typeof e === 'string' && e.length > 0)).toBe(true);
    }
  });

  it('single platform slice returns 8 rows', () => {
    const cloudflareOnly = collectFidelityCoverage(['cloudflare']);
    expect(cloudflareOnly.rows).toHaveLength(8);
    expect(cloudflareOnly.platforms).toEqual(['cloudflare']);
  });

  it('each axis neutral event list matches the AXIS_TO_EVENTS spec', () => {
    const coverage = collectFidelityCoverage(['deno']);
    for (const axis of Object.keys(AXIS_TO_EVENTS) as EdgeAxis[]) {
      const row = coverage.rows.find((r) => r.axis === axis);
      expect(row?.neutralEvents).toEqual(AXIS_TO_EVENTS[axis]);
    }
  });

  it('cloudflare durable-object row uses durable_object platform dialect', () => {
    const coverage = collectFidelityCoverage(['cloudflare']);
    const row = coverage.rows.find((r) => r.axis === 'durable-object');
    expect(row?.platformEvents.some((e) => e.startsWith('durable_object.'))).toBe(true);
    expect(row?.neutralEvents).toContain('durable-object.requested');
  });

  it('vercel durable-object row maps to session-affine edge function analogue', () => {
    const coverage = collectFidelityCoverage(['vercel']);
    const row = coverage.rows.find((r) => r.axis === 'durable-object');
    expect(row?.platformEvents).toContain('edge_function.session_affinity.request');
  });

  it('deno edge-kv row uses deno_kv platform dialect', () => {
    const coverage = collectFidelityCoverage(['deno']);
    const row = coverage.rows.find((r) => r.axis === 'edge-kv');
    expect(row?.platformEvents).toContain('deno_kv.get');
    expect(row?.platformEvents).toContain('deno_kv.set');
  });
});
