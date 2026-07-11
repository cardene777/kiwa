import { describe, expect, it } from 'vitest';
import {
  NEXT_AXIS_TO_EVENTS,
  collectFidelityCoverage,
  providerEventName,
  type NextAxis,
} from '../../src/index.js';

describe('nextjs fidelity coverage', () => {
  it('collects 3 targets x 6 axes (v1.49 advanced III pair 3 段拡張)', () => {
    const coverage = collectFidelityCoverage();
    expect(coverage.providers).toEqual(['app-router', 'pages-router', 'edge-runtime']);
    expect(coverage.axes).toHaveLength(6);
    expect(coverage.rows).toHaveLength(18);
  });

  it('maps every axis to four neutral events', () => {
    for (const events of Object.values(NEXT_AXIS_TO_EVENTS)) {
      expect(events).toHaveLength(4);
    }
  });

  it('keeps the combined 6-axis story in one grid (v1.49)', () => {
    const axes = Object.keys(NEXT_AXIS_TO_EVENTS) as NextAxis[];
    expect(axes).toEqual([
      'server-action-advanced',
      'partial-prerendering',
      'interception-routes',
      'parallel-routes-advanced',
      'turbopack-hmr',
      'concurrent-transitions',
    ]);
  });

  it('translates app-router and edge-runtime dialects differently', () => {
    expect(providerEventName('app-router', 'action.redirected')).toBe('app.navigation.redirect');
    expect(providerEventName('edge-runtime', 'action.redirected')).toBe('edge.response.redirect');
  });

  it('providerEventName falls back to the neutral name when the per-target dialect has no entry', () => {
    // dialect map is `Partial<Record<...>>` so a future neutral event added to the
    // union without a per-target mapping surfaces with its vendor-neutral name
    // instead of undefined. Reaching this branch from a type-safe caller is not
    // possible today (every union member has an entry on every target), so this
    // pins the runtime branch via a type cast.
    // biome-ignore lint/suspicious/noExplicitAny: exercising a runtime fallback that types forbid
    expect(providerEventName('app-router', 'not-mapped' as any)).toBe('not-mapped');
    // biome-ignore lint/suspicious/noExplicitAny: exercising a runtime fallback that types forbid
    expect(providerEventName('edge-runtime', 'not-mapped' as any)).toBe('not-mapped');
  });

  it('supports subset target collection (6 axis v1.49)', () => {
    const coverage = collectFidelityCoverage(['edge-runtime']);
    expect(coverage.rows).toHaveLength(6);
    expect(coverage.rows.every((row) => row.provider === 'edge-runtime')).toBe(true);
  });

  it('each row has matching neutral and provider event counts', () => {
    const coverage = collectFidelityCoverage();
    for (const row of coverage.rows) {
      expect(row.providerEvents).toHaveLength(row.neutralEvents.length);
    }
  });
});
