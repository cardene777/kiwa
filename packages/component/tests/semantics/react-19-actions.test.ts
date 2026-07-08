import { describe, expect, it } from 'vitest';
import {
  applyReactActionOptimistic,
  beginActionTransition,
  initializeReactActions,
  resolveAction,
} from '../../src/index.js';

describe('v1.49 react-19-actions semantics', () => {
  it('initializes with idle state and emits state_initialized event', () => {
    const s = initializeReactActions({ target: 'storybook8', actionId: 'submit-1' });
    expect(s.state).toBe('idle');
    expect(s.history[0]?.neutralEvent).toBe('action.state_initialized');
  });

  it('begins transition + optimistic + resolves cleanly', () => {
    const s = initializeReactActions({ target: 'playwright-ct', actionId: 'a1' });
    beginActionTransition(s);
    expect(s.state).toBe('transition-pending');
    applyReactActionOptimistic(s, 'draft-1');
    expect(s.state).toBe('optimistic-committed');
    expect(s.optimisticValues).toContain('draft-1');
    resolveAction(s, 'final-1');
    expect(s.state).toBe('resolved');
    expect(s.resolvedValue).toBe('final-1');
    expect(s.pendingCount).toBe(0);
  });

  it('transition can resolve without optimistic update', () => {
    const s = initializeReactActions({ target: 'chromatic', actionId: 'a2' });
    beginActionTransition(s);
    resolveAction(s, 'direct-final');
    expect(s.state).toBe('resolved');
  });

  it('throws when beginActionTransition on transition-pending state', () => {
    const s = initializeReactActions({ target: 'storybook8', actionId: 'a3' });
    beginActionTransition(s);
    expect(() => beginActionTransition(s)).toThrow(/is transition-pending/);
  });

  it('applyOptimistic throws when not transition-pending', () => {
    const s = initializeReactActions({ target: 'storybook8', actionId: 'a4' });
    expect(() => applyReactActionOptimistic(s, 'x')).toThrow(/is idle/);
  });

  it('rejects empty actionId', () => {
    expect(() => initializeReactActions({ target: 'storybook8', actionId: '' })).toThrow(/actionId/);
  });
});
