/**
 * v1.49-5 docs 補強 — tutorial 107-109 code snippet 検証 (component 側)。
 * 27 milestone 連続 snippet validation streak = v1.23 → v1.49。
 */
import { describe, expect, it } from 'vitest';
import {
  applyReactActionOptimistic,
  assertStaticBoundary,
  beginActionTransition,
  beginIslandHydration,
  bootstrapIslandsRoute,
  initializeReactActions,
  markIslandInteractive,
  registerIsland,
  resolveAction,
} from '../src/index.js';

describe('tutorial 107 — React 19 Actions (component 側 snippet)', () => {
  it('optimistic → resolved', () => {
    const s = initializeReactActions({ target: 'playwright-ct', actionId: 'a1' });
    beginActionTransition(s);
    applyReactActionOptimistic(s, 'draft');
    resolveAction(s, 'final');
    expect(s.state).toBe('resolved');
    expect(s.resolvedValue).toBe('final');
  });
});

describe('tutorial 109 — Islands architecture (component 側 snippet)', () => {
  it('bootstraps + hydrates + verifies static', () => {
    const s = bootstrapIslandsRoute({ target: 'storybook8', routeId: '/home' });
    registerIsland(s, { islandId: 'nav', loadStrategy: 'load', interactiveBoundary: true });
    beginIslandHydration(s, 'nav');
    markIslandInteractive(s, 'nav');
    assertStaticBoundary(s, 'footer');
    expect(s.state).toBe('static-verified');
  });
});
