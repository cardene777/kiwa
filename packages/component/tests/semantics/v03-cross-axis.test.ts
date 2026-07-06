import { describe, expect, it } from 'vitest';
import {
  applyOptimisticUpdate,
  assertAnimation,
  beginRscRender,
  completeRscRender,
  completeSelectiveHydration,
  enableProgressiveEnhancement,
  markFormStatusPending,
  markSuspensePending,
  resolveFormAction,
  startDocumentTransition,
  startFormActionSession,
  startProgressiveHydration,
  startRscHarness,
  startStreamingSsr,
  startViewTransitionSession,
  streamHtmlChunk,
} from '../../src/index.js';

describe('v0.3 component cross-axis scenarios', () => {
  it('RSC stream feeds progressive hydration', () => {
    const rsc = startRscHarness({ target: 'storybook8', componentId: 'Dashboard' });
    beginRscRender(rsc);
    streamHtmlChunk(rsc, '<section id="hero">Hero</section>');
    completeRscRender(rsc);
    const ssr = startStreamingSsr({ target: 'storybook8', routeId: '/dashboard' });
    markSuspensePending(ssr, 'hero');
    startProgressiveHydration(ssr, 'hero');
    const step = completeSelectiveHydration(ssr, 'hero');
    expect(step.state).toBe('selective-hydrated');
  });

  it('form optimistic state can be visually asserted', () => {
    const form = startFormActionSession({
      target: 'storybook8',
      formId: 'profile',
      initial: { name: 'Old' },
    });
    markFormStatusPending(form, 'save');
    applyOptimisticUpdate(form, { name: 'Ada' });
    const view = startViewTransitionSession({ target: 'storybook8', transitionId: 'optimistic' });
    const step = assertAnimation(view, { assertionId: 'optimistic-flash', durationMs: 120 });
    expect(step.metadata.assertionId).toBe('optimistic-flash');
  });

  it('enhanced form completion can trigger document transition', () => {
    const form = startFormActionSession({ target: 'playwright-ct', formId: 'save', initial: {} });
    enableProgressiveEnhancement(form, { actionUrl: '/actions/save' });
    resolveFormAction(form, { ok: true });
    const view = startViewTransitionSession({ target: 'playwright-ct', transitionId: 'nav' });
    const step = startDocumentTransition(view, { name: 'redirect', fromUrl: '/edit', toUrl: '/done' });
    expect(step.providerEvent).toBe('pwct.transition.document.start');
  });

  it('target dialect remains stable across axes', () => {
    const target = 'chromatic' as const;
    const rsc = startRscHarness({ target, componentId: 'Card' });
    const form = startFormActionSession({ target, formId: 'card-form', initial: {} });
    const a = beginRscRender(rsc);
    markFormStatusPending(form, 'save');
    const b = applyOptimisticUpdate(form, { saved: 'pending' });
    expect(a.providerEvent.startsWith('chromatic.')).toBe(true);
    expect(b.providerEvent.startsWith('chromatic.')).toBe(true);
  });

  it('axis histories stay isolated', () => {
    const rsc = startRscHarness({ target: 'storybook8', componentId: 'A' });
    const form = startFormActionSession({ target: 'storybook8', formId: 'A', initial: {} });
    beginRscRender(rsc);
    markFormStatusPending(form, 'save');
    expect(rsc.history).toHaveLength(1);
    expect(form.history).toHaveLength(1);
  });

  it('RSC completion and animation assertion produce payment-style envelopes', () => {
    const rsc = startRscHarness({ target: 'storybook8', componentId: 'A' });
    beginRscRender(rsc);
    const complete = completeRscRender(rsc);
    const view = startViewTransitionSession({ target: 'storybook8', transitionId: 'A' });
    const animation = assertAnimation(view, { assertionId: 'stable', durationMs: 0 });
    expect(complete.amountCents).toBe(0);
    expect(animation.amountCents).toBe(0);
  });
});
