import { describe, expect, it } from 'vitest';
import {
  applyOptimisticUpdate,
  assertAnimation,
  beginRscRender,
  captureErrorBoundary,
  completeRscRender,
  completeSelectiveHydration,
  enableProgressiveEnhancement,
  finishElementTransition,
  markFormStatusPending,
  markSuspensePending,
  rejectFormAction,
  resolveFormAction,
  startElementTransition,
  startFormActionSession,
  startRscHarness,
  startStreamingSsr,
  startViewTransitionSession,
  streamHtmlChunk,
} from '../../src/index.js';

describe('v0.3 component edge cases', () => {
  it('RSC completed session rejects stream chunk', () => {
    const session = startRscHarness({ target: 'storybook8', componentId: 'e1' });
    beginRscRender(session);
    completeRscRender(session);
    expect(() => streamHtmlChunk(session, 'late')).toThrow(/cannot stream/);
  });

  it('SSR nonrecoverable error removes only matching boundary', () => {
    const session = startStreamingSsr({ target: 'storybook8', routeId: '/e2' });
    markSuspensePending(session, 'a');
    markSuspensePending(session, 'b');
    captureErrorBoundary(session, { boundaryId: 'a', error: 'boom', recoverable: false });
    expect(session.pendingBoundaries.has('a')).toBe(false);
    expect(session.pendingBoundaries.has('b')).toBe(true);
  });

  it('selective hydration drains pending set', () => {
    const session = startStreamingSsr({ target: 'storybook8', routeId: '/e3' });
    markSuspensePending(session, 'a');
    completeSelectiveHydration(session, 'a');
    expect(session.pendingBoundaries.size).toBe(0);
  });

  it('view transition can assert multiple animations', () => {
    const session = startViewTransitionSession({ target: 'storybook8', transitionId: 'e4' });
    assertAnimation(session, { assertionId: 'a', durationMs: 10 });
    assertAnimation(session, { assertionId: 'b', durationMs: 20, easing: 'ease' });
    expect(session.assertions).toEqual(['a', 'b']);
  });

  it('element transition can restart after finish', () => {
    const session = startViewTransitionSession({ target: 'storybook8', transitionId: 'e5' });
    startElementTransition(session, { elementId: 'a', from: '1', to: '2' });
    finishElementTransition(session, 'a');
    const step = startElementTransition(session, { elementId: 'b', from: '2', to: '3' });
    expect(step.state).toBe('element-transitioning');
  });

  it('form reject can run from pending', () => {
    const session = startFormActionSession({ target: 'storybook8', formId: 'e6', initial: {} });
    markFormStatusPending(session, 'save');
    const step = rejectFormAction(session, new Error('invalid'));
    expect(step.metadata.error).toBe('invalid');
  });

  it('progressive enhancement preserves explicit method', () => {
    const session = startFormActionSession({ target: 'storybook8', formId: 'e7', initial: {} });
    const step = enableProgressiveEnhancement(session, { method: 'get', actionUrl: '/search' });
    expect(step.metadata.method).toBe('get');
  });

  it('resolved form includes result key string', () => {
    const session = startFormActionSession({ target: 'storybook8', formId: 'e8', initial: {} });
    markFormStatusPending(session, 'save');
    const step = resolveFormAction(session, { saved: true, id: '1' });
    expect(step.metadata.resultKeys).toBe('saved,id');
  });

  it('optimistic patch can overwrite existing field', () => {
    const session = startFormActionSession({
      target: 'storybook8',
      formId: 'e9',
      initial: { title: 'Old' },
    });
    markFormStatusPending(session, 'save');
    applyOptimisticUpdate(session, { title: 'New' });
    expect(session.form.title).toBe('New');
  });

  it('captured error boundary stores message', () => {
    const session = startStreamingSsr({ target: 'storybook8', routeId: '/e10' });
    captureErrorBoundary(session, { boundaryId: 'a', error: new Error('boom') });
    expect(session.errors[0]?.message).toBe('boom');
  });
});
