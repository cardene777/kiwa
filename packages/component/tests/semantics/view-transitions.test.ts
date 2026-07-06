import { describe, expect, it } from 'vitest';
import {
  assertAnimation,
  finishElementTransition,
  startDocumentTransition,
  startElementTransition,
  startViewTransitionSession,
} from '../../src/index.js';

describe('view-transitions axis', () => {
  it('starts idle', () => {
    const session = startViewTransitionSession({ target: 'storybook8', transitionId: 'tr-1' });
    expect(session.state).toBe('idle');
  });

  it('rejects empty transition id', () => {
    expect(() => startViewTransitionSession({ target: 'storybook8', transitionId: '' })).toThrow(
      /transitionId must not be empty/,
    );
  });

  it('starts element transition', () => {
    const session = startViewTransitionSession({ target: 'storybook8', transitionId: 'tr-2' });
    const step = startElementTransition(session, { elementId: 'card', from: 'list', to: 'detail' });
    expect(step.neutralEvent).toBe('transition.element_started');
    expect(session.activeElements.has('card')).toBe(true);
  });

  it('rejects empty element id', () => {
    const session = startViewTransitionSession({ target: 'storybook8', transitionId: 'tr-3' });
    expect(() => startElementTransition(session, { elementId: '', from: 'a', to: 'b' })).toThrow(
      /elementId must not be empty/,
    );
  });

  it('finishes element transition', () => {
    const session = startViewTransitionSession({ target: 'storybook8', transitionId: 'tr-4' });
    startElementTransition(session, { elementId: 'card', from: 'list', to: 'detail' });
    const step = finishElementTransition(session, 'card');
    expect(step.neutralEvent).toBe('transition.element_finished');
    expect(step.metadata.remaining).toBe(0);
  });

  it('rejects finishing inactive element', () => {
    const session = startViewTransitionSession({ target: 'storybook8', transitionId: 'tr-5' });
    expect(() => finishElementTransition(session, 'card')).toThrow(/not active/);
  });

  it('keeps state transitioning when one element remains', () => {
    const session = startViewTransitionSession({ target: 'storybook8', transitionId: 'tr-6' });
    startElementTransition(session, { elementId: 'a', from: '1', to: '2' });
    startElementTransition(session, { elementId: 'b', from: '1', to: '2' });
    const step = finishElementTransition(session, 'a');
    expect(step.state).toBe('element-transitioning');
  });

  it('starts document transition', () => {
    const session = startViewTransitionSession({ target: 'playwright-ct', transitionId: 'tr-7' });
    const step = startDocumentTransition(session, {
      name: 'route-change',
      fromUrl: '/a',
      toUrl: '/b',
    });
    expect(step.providerEvent).toBe('pwct.transition.document.start');
    expect(session.documentTransition).toBe('route-change');
  });

  it('rejects empty document transition name', () => {
    const session = startViewTransitionSession({ target: 'storybook8', transitionId: 'tr-8' });
    expect(() => startDocumentTransition(session, { name: '', fromUrl: '/a', toUrl: '/b' })).toThrow(
      /name must not be empty/,
    );
  });

  it('asserts animation', () => {
    const session = startViewTransitionSession({ target: 'chromatic', transitionId: 'tr-9' });
    const step = assertAnimation(session, { assertionId: 'fade', durationMs: 150 });
    expect(step.providerEvent).toBe('chromatic.animation.assert');
    expect(step.metadata.easing).toBe('linear');
  });

  it('rejects negative animation duration', () => {
    const session = startViewTransitionSession({ target: 'storybook8', transitionId: 'tr-10' });
    expect(() => assertAnimation(session, { assertionId: 'bad', durationMs: -1 })).toThrow(
      />= 0/,
    );
  });

  it('records history order', () => {
    const session = startViewTransitionSession({ target: 'storybook8', transitionId: 'tr-11' });
    startElementTransition(session, { elementId: 'card', from: 'a', to: 'b' });
    finishElementTransition(session, 'card');
    assertAnimation(session, { assertionId: 'done', durationMs: 0 });
    expect(session.history.map((step) => step.neutralEvent)).toEqual([
      'transition.element_started',
      'transition.element_finished',
      'transition.animation_asserted',
    ]);
  });
});
