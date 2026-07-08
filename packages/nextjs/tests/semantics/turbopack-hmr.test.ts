import { describe, expect, it } from 'vitest';
import {
  applyHmrPatch,
  completeFastRefresh,
  findHmrBoundary,
  markModuleUpdated,
  startTurbopackHmr,
} from '../../src/index.js';

describe('v1.49 turbopack-hmr semantics', () => {
  it('completes full HMR chain', () => {
    const s = startTurbopackHmr({ target: 'app-router', sessionId: 'hmr-1' });
    markModuleUpdated(s, 'src/page.tsx');
    findHmrBoundary(s, 'src/layout.tsx');
    applyHmrPatch(s);
    completeFastRefresh(s);
    expect(s.state).toBe('refresh-completed');
    expect(s.history.length).toBeGreaterThanOrEqual(4);
  });

  it('rejects findHmrBoundary before updating', () => {
    const s = startTurbopackHmr({ target: 'pages-router', sessionId: 'hmr-2' });
    expect(() => findHmrBoundary(s, 'x')).toThrow(/is idle/);
  });

  it('rejects applyHmrPatch before boundary-found', () => {
    const s = startTurbopackHmr({ target: 'edge-runtime', sessionId: 'hmr-3' });
    markModuleUpdated(s, 'x');
    expect(() => applyHmrPatch(s)).toThrow(/is updating/);
  });

  it('rejects empty sessionId', () => {
    expect(() => startTurbopackHmr({ target: 'app-router', sessionId: '' })).toThrow(/sessionId/);
  });
});
