import { describe, expect, it } from 'vitest';
import {
  captureParallelError,
  navigateSlot,
  renderDefaultSlot,
  renderLoadingState,
  startParallelRoutesAdvanced,
} from '../../src/index.js';

describe('parallel-routes-advanced axis', () => {
  it('starts idle', () => {
    const session = startParallelRoutesAdvanced({ target: 'app-router', layoutId: 'dashboard' });
    expect(session.state).toBe('idle');
  });

  it('rejects empty layout id', () => {
    expect(() => startParallelRoutesAdvanced({ target: 'app-router', layoutId: '' })).toThrow(
      /layoutId must not be empty/,
    );
  });

  it('renders default slot', () => {
    const session = startParallelRoutesAdvanced({ target: 'app-router', layoutId: 'dashboard' });
    const step = renderDefaultSlot(session, '@modal', '<div />');
    expect(step.neutralEvent).toBe('parallel.default_rendered');
    expect(session.slots.get('@modal')).toBe('<div />');
  });

  it('rejects empty default slot', () => {
    const session = startParallelRoutesAdvanced({ target: 'app-router', layoutId: 'dashboard' });
    expect(() => renderDefaultSlot(session, '', '<div />')).toThrow(/slot must not be empty/);
  });

  it('renders loading state', () => {
    const session = startParallelRoutesAdvanced({ target: 'pages-router', layoutId: 'dashboard' });
    const step = renderLoadingState(session, '@analytics');
    expect(step.providerEvent).toBe('pages.slot.loading');
    expect(step.metadata.loadingCount).toBe(1);
  });

  it('deduplicates loading slots via Set', () => {
    const session = startParallelRoutesAdvanced({ target: 'app-router', layoutId: 'dashboard' });
    renderLoadingState(session, '@analytics');
    const step = renderLoadingState(session, '@analytics');
    expect(step.metadata.loadingCount).toBe(1);
  });

  it('captures error boundary', () => {
    const session = startParallelRoutesAdvanced({ target: 'edge-runtime', layoutId: 'dashboard' });
    const step = captureParallelError(session, { slot: '@modal', error: new Error('boom') });
    expect(step.providerEvent).toBe('edge.parallel.error');
    expect(step.metadata.message).toBe('boom');
  });

  it('captures string error boundary', () => {
    const session = startParallelRoutesAdvanced({ target: 'app-router', layoutId: 'dashboard' });
    const step = captureParallelError(session, { slot: '@modal', error: 'boom' });
    expect(step.metadata.errorCount).toBe(1);
  });

  it('navigates slot and clears loading state', () => {
    const session = startParallelRoutesAdvanced({ target: 'app-router', layoutId: 'dashboard' });
    renderLoadingState(session, '@modal');
    const step = navigateSlot(session, { slot: '@modal', from: '/a', to: '/b' });
    expect(step.neutralEvent).toBe('parallel.slot_navigated');
    expect(session.loadingSlots.has('@modal')).toBe(false);
  });

  it('rejects navigation without slash source', () => {
    const session = startParallelRoutesAdvanced({ target: 'app-router', layoutId: 'dashboard' });
    expect(() => navigateSlot(session, { slot: '@modal', from: 'a', to: '/b' })).toThrow(
      /start with \//,
    );
  });

  it('rejects navigation without slash target', () => {
    const session = startParallelRoutesAdvanced({ target: 'app-router', layoutId: 'dashboard' });
    expect(() => navigateSlot(session, { slot: '@modal', from: '/a', to: 'b' })).toThrow(
      /start with \//,
    );
  });

  it('tracks multiple errors', () => {
    const session = startParallelRoutesAdvanced({ target: 'app-router', layoutId: 'dashboard' });
    captureParallelError(session, { slot: '@a', error: 'a' });
    const step = captureParallelError(session, { slot: '@b', error: 'b' });
    expect(step.metadata.errorCount).toBe(2);
  });

  it('records history order', () => {
    const session = startParallelRoutesAdvanced({ target: 'app-router', layoutId: 'dashboard' });
    renderDefaultSlot(session, '@modal', '<div />');
    renderLoadingState(session, '@modal');
    navigateSlot(session, { slot: '@modal', from: '/a', to: '/b' });
    expect(session.history.map((step) => step.neutralEvent)).toEqual([
      'parallel.default_rendered',
      'parallel.loading_rendered',
      'parallel.slot_navigated',
    ]);
  });
});
