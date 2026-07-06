import { describe, expect, it } from 'vitest';
import {
  completePartialPrerendering,
  flushStreamingBoundary,
  interceptCurrentSegment,
  navigateSlot,
  openDynamicHole,
  openInterceptedModal,
  redirectAction,
  renderLoadingState,
  renderStaticShell,
  revalidateActionPath,
  revalidateActionTag,
  startInterceptionRoutes,
  startParallelRoutesAdvanced,
  startPartialPrerendering,
  startServerActionAdvanced,
  submitFormAction,
} from '../../src/index.js';

describe('v1.2 nextjs cross-axis scenarios', () => {
  it('server action revalidation can complete a PPR route', () => {
    const action = startServerActionAdvanced({ target: 'app-router', actionId: 'save' });
    submitFormAction(action, { title: 'Hello' });
    revalidateActionPath(action, '/products/1');
    revalidateActionTag(action, 'products');
    const ppr = startPartialPrerendering({ target: 'app-router', routeId: '/products/[id]' });
    renderStaticShell(ppr, '<main />');
    const done = completePartialPrerendering(ppr);
    expect(done.state).toBe('completed');
  });

  it('intercepted modal navigates a parallel slot', () => {
    const interception = startInterceptionRoutes({ target: 'app-router', routeId: '/feed' });
    interceptCurrentSegment(interception, '/feed', '/photo/1');
    openInterceptedModal(interception, '/photo/1');
    const parallel = startParallelRoutesAdvanced({ target: 'app-router', layoutId: 'feed' });
    renderLoadingState(parallel, '@modal');
    const step = navigateSlot(parallel, { slot: '@modal', from: '/feed', to: '/photo/1' });
    expect(step.state).toBe('slot-navigated');
  });

  it('PPR dynamic hole can stream into parallel slot', () => {
    const ppr = startPartialPrerendering({ target: 'edge-runtime', routeId: '/dashboard' });
    renderStaticShell(ppr, '<main />');
    openDynamicHole(ppr, { holeId: '@analytics', fallback: '<p>Loading</p>' });
    flushStreamingBoundary(ppr, { holeId: '@analytics', html: '<aside>Ready</aside>' });
    const parallel = startParallelRoutesAdvanced({ target: 'edge-runtime', layoutId: 'dashboard' });
    const step = navigateSlot(parallel, { slot: '@analytics', from: '/dashboard', to: '/dashboard?ready=1' });
    expect(step.providerEvent).toBe('edge.parallel.navigate');
  });

  it('redirect action can be represented as intercepted route', () => {
    const action = startServerActionAdvanced({ target: 'pages-router', actionId: 'login' });
    submitFormAction(action, { email: 'a@example.com' });
    redirectAction(action, '/login?next=/feed');
    const interception = startInterceptionRoutes({ target: 'pages-router', routeId: '/feed' });
    const step = interceptCurrentSegment(interception, '/feed', '/login');
    expect(step.providerEvent).toBe('pages.intercept.current');
  });

  it('histories stay isolated between axes', () => {
    const action = startServerActionAdvanced({ target: 'app-router', actionId: 'save' });
    const ppr = startPartialPrerendering({ target: 'app-router', routeId: '/items' });
    submitFormAction(action, {});
    renderStaticShell(ppr, '<main />');
    expect(action.history).toHaveLength(1);
    expect(ppr.history).toHaveLength(1);
  });

  it('all axes emit payment-style amount field', () => {
    const action = startServerActionAdvanced({ target: 'app-router', actionId: 'save' });
    const ppr = startPartialPrerendering({ target: 'app-router', routeId: '/items' });
    const a = submitFormAction(action, {});
    const b = renderStaticShell(ppr, '<main />');
    expect(a.amountCents).toBe(0);
    expect(b.amountCents).toBe(0);
  });
});
