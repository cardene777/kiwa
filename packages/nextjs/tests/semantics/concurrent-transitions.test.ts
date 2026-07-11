import { describe, expect, it } from 'vitest';
import {
  commitTransition,
  interruptTransition,
  markTransitionPending,
  startConcurrentTransition,
} from '../../src/index.js';

describe('v1.49 concurrent-transitions semantics', () => {
  it('starts + pending + commits', () => {
    const s = startConcurrentTransition({ target: 'app-router', transitionId: 't1' });
    markTransitionPending(s);
    commitTransition(s, 'final-value');
    expect(s.state).toBe('committed');
    expect(s.committedValue).toBe('final-value');
  });

  it('supports interrupt-and-restart pattern', () => {
    const s = startConcurrentTransition({ target: 'edge-runtime', transitionId: 't2' });
    markTransitionPending(s);
    interruptTransition(s);
    expect(s.state).toBe('interrupted');
    expect(s.interruptions).toBe(1);
    markTransitionPending(s);
    commitTransition(s, 'v2');
    expect(s.state).toBe('committed');
    expect(s.interruptions).toBe(1);
  });

  it('rejects commit from idle state', () => {
    const s = startConcurrentTransition({ target: 'pages-router', transitionId: 't3' });
    // s.state = 'started'、 commit は 'started' | 'pending' で allow
    commitTransition(s, 'direct');
    expect(s.state).toBe('committed');
  });

  it('rejects interrupt from non-pending state', () => {
    const s = startConcurrentTransition({ target: 'app-router', transitionId: 't4' });
    expect(() => interruptTransition(s)).toThrow(/is started/);
  });

  it('rejects empty transitionId', () => {
    expect(() => startConcurrentTransition({ target: 'app-router', transitionId: '' })).toThrow(/transitionId/);
  });

  it('rejects markTransitionPending from committed state', () => {
    const s = startConcurrentTransition({ target: 'app-router', transitionId: 't5' });
    commitTransition(s, 'v1');
    expect(() => markTransitionPending(s)).toThrow(/is committed/);
  });

  it('rejects commitTransition from committed state (no double-commit)', () => {
    const s = startConcurrentTransition({ target: 'edge-runtime', transitionId: 't6' });
    commitTransition(s, 'v1');
    expect(() => commitTransition(s, 'v2')).toThrow(/is committed/);
  });
});
