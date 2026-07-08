/**
 * v1.49-5 docs 補強 — tutorial 107-109 code snippet 検証 (nextjs 側)。
 * 27 milestone 連続 snippet validation streak = v1.23 → v1.49。
 */
import { describe, expect, it } from 'vitest';
import {
  applyHmrPatch,
  commitTransition,
  completeFastRefresh,
  findHmrBoundary,
  interruptTransition,
  markModuleUpdated,
  markTransitionPending,
  redirectAction,
  revalidateActionPath,
  startConcurrentTransition,
  startServerActionAdvanced,
  startTurbopackHmr,
  submitFormAction,
} from '../src/index.js';

describe('tutorial 107 — Server Actions v2 (nextjs 側 snippet)', () => {
  it('submit → revalidate → redirect', () => {
    const s = startServerActionAdvanced({ target: 'app-router', actionId: 'x' });
    submitFormAction(s, { name: 'Ada' });
    revalidateActionPath(s, '/dashboard');
    redirectAction(s, '/thanks');
    expect(s.state).toBe('redirected');
  });
});

describe('tutorial 108 — Concurrent transitions (nextjs 側 snippet)', () => {
  it('interrupt then restart pattern', () => {
    const s = startConcurrentTransition({ target: 'app-router', transitionId: 't1' });
    markTransitionPending(s);
    interruptTransition(s);
    markTransitionPending(s);
    commitTransition(s, 'final');
    expect(s.state).toBe('committed');
    expect(s.interruptions).toBe(1);
  });
});

describe('tutorial 109 — Turbopack HMR (nextjs 側 snippet)', () => {
  it('completes full HMR chain', () => {
    const s = startTurbopackHmr({ target: 'app-router', sessionId: 'hmr-1' });
    markModuleUpdated(s, 'src/page.tsx');
    findHmrBoundary(s, 'src/layout.tsx');
    applyHmrPatch(s);
    completeFastRefresh(s);
    expect(s.state).toBe('refresh-completed');
  });
});
