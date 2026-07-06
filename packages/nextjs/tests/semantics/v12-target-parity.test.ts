import { describe, expect, it } from 'vitest';
import {
  collectFidelityCoverage,
  providerEventName,
  type NextAxis,
  type NextTarget,
} from '../../src/index.js';

const AXES: NextAxis[] = [
  'server-action-advanced',
  'partial-prerendering',
  'interception-routes',
  'parallel-routes-advanced',
];
const TARGETS: NextTarget[] = ['app-router', 'pages-router', 'edge-runtime'];

describe('v1.2 nextjs target parity', () => {
  const coverage = collectFidelityCoverage();

  for (const provider of TARGETS) {
    for (const axis of AXES) {
      it(`${provider} x ${axis}: has non-empty provider events`, () => {
        const row = coverage.rows.find((r) => r.provider === provider && r.axis === axis);
        expect(row).toBeDefined();
        for (const event of row?.providerEvents ?? []) {
          expect(event.length).toBeGreaterThan(0);
          expect(event).not.toMatch(/^(action|ppr|intercept|parallel)\./);
        }
      });
    }
  }

  it('redirect differs by target', () => {
    expect(providerEventName('app-router', 'action.redirected')).toBe('app.navigation.redirect');
    expect(providerEventName('pages-router', 'action.redirected')).toBe('pages.router.redirect');
    expect(providerEventName('edge-runtime', 'action.redirected')).toBe('edge.response.redirect');
  });

  it('PPR streaming boundary differs by target', () => {
    expect(providerEventName('app-router', 'ppr.streaming_boundary_flushed')).toBe(
      'app.ppr.stream-boundary',
    );
    expect(providerEventName('edge-runtime', 'ppr.streaming_boundary_flushed')).toBe(
      'edge.stream.boundary',
    );
  });
});
