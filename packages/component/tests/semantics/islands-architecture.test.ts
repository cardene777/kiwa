import { describe, expect, it } from 'vitest';
import {
  assertStaticBoundary,
  beginIslandHydration,
  bootstrapIslandsRoute,
  markIslandInteractive,
  registerIsland,
} from '../../src/index.js';

describe('v1.49 islands-architecture semantics', () => {
  it('bootstraps + registers + hydrates + verifies static', () => {
    const s = bootstrapIslandsRoute({ target: 'storybook8', routeId: '/home' });
    registerIsland(s, { islandId: 'header-nav', loadStrategy: 'load', interactiveBoundary: true });
    registerIsland(s, { islandId: 'chat-widget', loadStrategy: 'idle', interactiveBoundary: true });
    registerIsland(s, { islandId: 'footer', loadStrategy: 'only', interactiveBoundary: false });
    beginIslandHydration(s, 'header-nav');
    markIslandInteractive(s, 'header-nav');
    beginIslandHydration(s, 'chat-widget');
    markIslandInteractive(s, 'chat-widget');
    expect(s.state).toBe('interactive');
    assertStaticBoundary(s, 'footer-static');
    expect(s.state).toBe('static-verified');
  });

  it('rejects double-mark interactive', () => {
    const s = bootstrapIslandsRoute({ target: 'chromatic', routeId: '/r' });
    registerIsland(s, { islandId: 'i1', loadStrategy: 'load', interactiveBoundary: true });
    beginIslandHydration(s, 'i1');
    markIslandInteractive(s, 'i1');
    // state == 'interactive'、 再度 hydration するには 'registered' or 'hydrating' 必要
    expect(() => beginIslandHydration(s, 'i1')).toThrow(/session is interactive/);
  });

  it('rejects hydrating an unregistered island', () => {
    const s = bootstrapIslandsRoute({ target: 'playwright-ct', routeId: '/x' });
    expect(() => beginIslandHydration(s, 'ghost')).toThrow(/not registered/);
  });

  it('rejects empty routeId', () => {
    expect(() => bootstrapIslandsRoute({ target: 'storybook8', routeId: '' })).toThrow(/routeId/);
  });

  it('rejects markIslandInteractive when session is not hydrating', () => {
    const s = bootstrapIslandsRoute({ target: 'storybook8', routeId: '/r' });
    // state = 'registered' (initial post-bootstrap), markIslandInteractive requires 'hydrating'
    expect(() => markIslandInteractive(s, 'x')).toThrow(/session is/);
  });

  it('rejects markIslandInteractive when the island is already interactive', () => {
    const s = bootstrapIslandsRoute({ target: 'chromatic', routeId: '/r' });
    registerIsland(s, { islandId: 'i1', loadStrategy: 'load', interactiveBoundary: true });
    registerIsland(s, { islandId: 'i2', loadStrategy: 'load', interactiveBoundary: true });
    beginIslandHydration(s, 'i1');
    markIslandInteractive(s, 'i1');
    // state stays 'hydrating' because i2 is still pending; try to double-mark i1
    expect(() => markIslandInteractive(s, 'i1')).toThrow(/already interactive/);
  });

  it('rejects assertStaticBoundary for an already-asserted boundary', () => {
    const s = bootstrapIslandsRoute({ target: 'playwright-ct', routeId: '/r' });
    assertStaticBoundary(s, 'footer');
    expect(() => assertStaticBoundary(s, 'footer')).toThrow(/already asserted/);
  });
});
