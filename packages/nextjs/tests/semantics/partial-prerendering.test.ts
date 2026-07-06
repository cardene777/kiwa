import { describe, expect, it } from 'vitest';
import {
  completePartialPrerendering,
  flushStreamingBoundary,
  openDynamicHole,
  renderStaticShell,
  startPartialPrerendering,
} from '../../src/index.js';

describe('partial-prerendering axis', () => {
  it('starts idle', () => {
    const session = startPartialPrerendering({ target: 'app-router', routeId: '/product/[id]' });
    expect(session.state).toBe('idle');
  });

  it('rejects empty route id', () => {
    expect(() => startPartialPrerendering({ target: 'app-router', routeId: '' })).toThrow(
      /routeId must not be empty/,
    );
  });

  it('renders static shell', () => {
    const session = startPartialPrerendering({ target: 'app-router', routeId: '/p' });
    const step = renderStaticShell(session, '<main>Shell</main>');
    expect(step.neutralEvent).toBe('ppr.static_shell_rendered');
    expect(step.metadata.bytes).toBe(18);
  });

  it('rejects second static shell', () => {
    const session = startPartialPrerendering({ target: 'app-router', routeId: '/p' });
    renderStaticShell(session, '<main />');
    expect(() => renderStaticShell(session, '<main />')).toThrow(/not idle/);
  });

  it('rejects empty static shell html', () => {
    const session = startPartialPrerendering({ target: 'app-router', routeId: '/p' });
    expect(() => renderStaticShell(session, '')).toThrow(/html must not be empty/);
  });

  it('opens dynamic hole after shell', () => {
    const session = startPartialPrerendering({ target: 'pages-router', routeId: '/p' });
    renderStaticShell(session, '<main />');
    const step = openDynamicHole(session, { holeId: 'recommendations', fallback: '<p>...</p>' });
    expect(step.providerEvent).toBe('pages.ssr.dynamic-hole');
    expect(step.metadata.holeCount).toBe(1);
  });

  it('rejects dynamic hole before shell', () => {
    const session = startPartialPrerendering({ target: 'app-router', routeId: '/p' });
    expect(() => openDynamicHole(session, { holeId: 'a', fallback: 'x' })).toThrow(
      /static shell must be rendered/,
    );
  });

  it('rejects empty hole id', () => {
    const session = startPartialPrerendering({ target: 'app-router', routeId: '/p' });
    renderStaticShell(session, '<main />');
    expect(() => openDynamicHole(session, { holeId: '', fallback: 'x' })).toThrow(
      /holeId must not be empty/,
    );
  });

  it('flushes streaming boundary for open hole', () => {
    const session = startPartialPrerendering({ target: 'edge-runtime', routeId: '/p' });
    renderStaticShell(session, '<main />');
    openDynamicHole(session, { holeId: 'a', fallback: 'loading' });
    const step = flushStreamingBoundary(session, { holeId: 'a', html: '<aside>A</aside>' });
    expect(step.providerEvent).toBe('edge.stream.boundary');
    expect(session.streamedBoundaries).toEqual(['a']);
  });

  it('rejects flush for missing hole', () => {
    const session = startPartialPrerendering({ target: 'app-router', routeId: '/p' });
    renderStaticShell(session, '<main />');
    expect(() => flushStreamingBoundary(session, { holeId: 'x', html: '<x />' })).toThrow(
      /not an open dynamic hole/,
    );
  });

  it('rejects empty flush html', () => {
    const session = startPartialPrerendering({ target: 'app-router', routeId: '/p' });
    renderStaticShell(session, '<main />');
    openDynamicHole(session, { holeId: 'x', fallback: 'loading' });
    expect(() => flushStreamingBoundary(session, { holeId: 'x', html: '' })).toThrow(
      /html must not be empty/,
    );
  });

  it('completes partial prerendering', () => {
    const session = startPartialPrerendering({ target: 'app-router', routeId: '/p' });
    renderStaticShell(session, '<main />');
    openDynamicHole(session, { holeId: 'x', fallback: 'loading' });
    flushStreamingBoundary(session, { holeId: 'x', html: '<x />' });
    const step = completePartialPrerendering(session);
    expect(step.neutralEvent).toBe('ppr.completed');
    expect(step.metadata.streamedCount).toBe(1);
  });

  it('rejects completion before shell', () => {
    const session = startPartialPrerendering({ target: 'app-router', routeId: '/p' });
    expect(() => completePartialPrerendering(session)).toThrow(/static shell was not rendered/);
  });
});
