import { describe, expect, it } from 'vitest';
import {
  NEXT_AXIS_TO_EVENTS,
  collectFidelityCoverage,
  providerEventName,
  type NextAxis,
} from '../../src/index.js';

describe('nextjs fidelity coverage', () => {
  it('collects 3 targets x 4 axes', () => {
    const coverage = collectFidelityCoverage();
    expect(coverage.providers).toEqual(['app-router', 'pages-router', 'edge-runtime']);
    expect(coverage.axes).toHaveLength(4);
    expect(coverage.rows).toHaveLength(12);
  });

  it('maps every axis to four neutral events', () => {
    for (const events of Object.values(NEXT_AXIS_TO_EVENTS)) {
      expect(events).toHaveLength(4);
    }
  });

  it('keeps the combined 4-axis story in one grid', () => {
    const axes = Object.keys(NEXT_AXIS_TO_EVENTS) as NextAxis[];
    expect(axes).toEqual([
      'server-action-advanced',
      'partial-prerendering',
      'interception-routes',
      'parallel-routes-advanced',
    ]);
  });

  it('translates app-router and edge-runtime dialects differently', () => {
    expect(providerEventName('app-router', 'action.redirected')).toBe('app.navigation.redirect');
    expect(providerEventName('edge-runtime', 'action.redirected')).toBe('edge.response.redirect');
  });

  it('supports subset target collection', () => {
    const coverage = collectFidelityCoverage(['edge-runtime']);
    expect(coverage.rows).toHaveLength(4);
    expect(coverage.rows.every((row) => row.provider === 'edge-runtime')).toBe(true);
  });

  it('each row has matching neutral and provider event counts', () => {
    const coverage = collectFidelityCoverage();
    for (const row of coverage.rows) {
      expect(row.providerEvents).toHaveLength(row.neutralEvents.length);
    }
  });
});
