import { describe, expect, it } from 'vitest';
import {
  captureParallelError,
  completePartialPrerendering,
  flushStreamingBoundary,
  interceptParentSegment,
  navigateSlot,
  openDynamicHole,
  openInterceptedModal,
  redirectAction,
  renderDefaultSlot,
  renderLoadingState,
  renderStaticShell,
  revalidateActionPath,
  startInterceptionRoutes,
  startParallelRoutesAdvanced,
  startPartialPrerendering,
  startServerActionAdvanced,
  submitFormAction,
} from '../../src/index.js';

describe('v1.2 nextjs edge cases', () => {
  it('server action allows multiple path revalidations', () => {
    const session = startServerActionAdvanced({ target: 'app-router', actionId: 'save' });
    submitFormAction(session, {});
    revalidateActionPath(session, '/a');
    const step = revalidateActionPath(session, '/b');
    expect(step.metadata.count).toBe(2);
  });

  it('server action redirect can follow tag/path state', () => {
    const session = startServerActionAdvanced({ target: 'app-router', actionId: 'save' });
    submitFormAction(session, {});
    revalidateActionPath(session, '/a');
    const step = redirectAction(session, '/done');
    expect(step.state).toBe('redirected');
  });

  it('PPR completion without holes is valid static shell path', () => {
    const session = startPartialPrerendering({ target: 'app-router', routeId: '/static' });
    renderStaticShell(session, '<main />');
    const step = completePartialPrerendering(session);
    expect(step.metadata.holeCount).toBe(0);
  });

  it('PPR can overwrite fallback with streamed html', () => {
    const session = startPartialPrerendering({ target: 'app-router', routeId: '/p' });
    renderStaticShell(session, '<main />');
    openDynamicHole(session, { holeId: 'a', fallback: 'loading' });
    flushStreamingBoundary(session, { holeId: 'a', html: 'ready' });
    expect(session.dynamicHoles.get('a')).toBe('ready');
  });

  it('interception modal records latest modal route', () => {
    const session = startInterceptionRoutes({ target: 'app-router', routeId: '/feed' });
    interceptParentSegment(session, '/feed/a', '/photo/1');
    openInterceptedModal(session, '/photo/1');
    expect(session.modalRoute).toBe('/photo/1');
  });

  it('interception match count increments before modal', () => {
    const session = startInterceptionRoutes({ target: 'app-router', routeId: '/feed' });
    interceptParentSegment(session, '/feed/a', '/photo/1');
    interceptParentSegment(session, '/feed/b', '/photo/2');
    const step = openInterceptedModal(session, '/photo/2');
    expect(step.metadata.matchCount).toBe(2);
  });

  it('parallel default slot can be overwritten', () => {
    const session = startParallelRoutesAdvanced({ target: 'app-router', layoutId: 'dash' });
    renderDefaultSlot(session, '@modal', '<a />');
    renderDefaultSlot(session, '@modal', '<b />');
    expect(session.slots.get('@modal')).toBe('<b />');
  });

  it('parallel error captures slot name', () => {
    const session = startParallelRoutesAdvanced({ target: 'app-router', layoutId: 'dash' });
    const step = captureParallelError(session, { slot: '@modal', error: 'boom' });
    expect(step.metadata.slot).toBe('@modal');
  });

  it('parallel navigation removes only matching loading slot', () => {
    const session = startParallelRoutesAdvanced({ target: 'app-router', layoutId: 'dash' });
    renderLoadingState(session, '@a');
    renderLoadingState(session, '@b');
    navigateSlot(session, { slot: '@a', from: '/a', to: '/aa' });
    expect(session.loadingSlots.has('@a')).toBe(false);
    expect(session.loadingSlots.has('@b')).toBe(true);
  });

  it('PPR history includes all four events', () => {
    const session = startPartialPrerendering({ target: 'app-router', routeId: '/p' });
    renderStaticShell(session, '<main />');
    openDynamicHole(session, { holeId: 'a', fallback: 'loading' });
    flushStreamingBoundary(session, { holeId: 'a', html: 'ready' });
    completePartialPrerendering(session);
    expect(session.history).toHaveLength(4);
  });
});
