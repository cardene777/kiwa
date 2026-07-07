import { describe, expect, it } from 'vitest';
import {
  AXIS_TO_EVENTS,
  collectFidelityCoverage,
  type EdgeAxis,
} from '../../src/index.js';

describe('fidelity harness — 3 platform × 16 axis grid', () => {
  it('produces 48 rows (3 platform × 16 axis) — v0.2 8 + v1.2 advanced 8', () => {
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
      'cold-start',
      'middleware-chain',
      'kv-eventual-consistency',
      'r2-multipart',
      'd1-read-replica',
      'do-state-migration',
      'websocket-hibernation',
      'global-routing',
    ]);
    expect(coverage.rows).toHaveLength(48);
  });

  it('every row has neutral events mapped to platform events', () => {
    const coverage = collectFidelityCoverage(['cloudflare', 'vercel', 'deno']);
    for (const row of coverage.rows) {
      expect(row.neutralEvents.length).toBe(AXIS_TO_EVENTS[row.axis].length);
      expect(row.platformEvents.length).toBe(row.neutralEvents.length);
      expect(row.platformEvents.every((e) => typeof e === 'string' && e.length > 0)).toBe(true);
    }
  });

  it('single platform slice returns 16 rows', () => {
    const cloudflareOnly = collectFidelityCoverage(['cloudflare']);
    expect(cloudflareOnly.rows).toHaveLength(16);
    expect(cloudflareOnly.platforms).toEqual(['cloudflare']);
  });

  it('v1.2 advanced axes are present in coverage grid', () => {
    const coverage = collectFidelityCoverage(['cloudflare']);
    const advancedAxes = [
      'cold-start',
      'middleware-chain',
      'kv-eventual-consistency',
      'r2-multipart',
      'd1-read-replica',
      'do-state-migration',
      'websocket-hibernation',
      'global-routing',
    ];
    for (const axis of advancedAxes) {
      const row = coverage.rows.find((r) => r.axis === axis);
      expect(row).toBeDefined();
      expect(row?.neutralEvents.length).toBeGreaterThan(0);
    }
  });

  it('v1.2 platform dialect mapping is unique per platform', () => {
    const cf = collectFidelityCoverage(['cloudflare']).rows.find(
      (r) => r.axis === 'cold-start',
    );
    const vc = collectFidelityCoverage(['vercel']).rows.find(
      (r) => r.axis === 'cold-start',
    );
    const dn = collectFidelityCoverage(['deno']).rows.find(
      (r) => r.axis === 'cold-start',
    );
    expect(cf?.platformEvents[0]).toContain('worker.');
    expect(vc?.platformEvents[0]).toContain('serverless.');
    expect(dn?.platformEvents[0]).toContain('deploy.');
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
