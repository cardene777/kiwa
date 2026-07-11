import { describe, expect, it } from 'vitest';
import {
  applyMetroHmr,
  completeMetroBundle,
  resolveMetroModule,
  startMetroBundle,
  type MetroSession,
} from '../../src/index.js';

function idleMetroSession(): MetroSession {
  return {
    target: 'ios',
    bundleId: 'idle-bundle',
    state: 'idle',
    resolvedModules: [],
    hmrUpdateCount: 0,
    history: [],
  };
}

describe('metro axis semantics', () => {
  it('start → resolve → hmr → complete', () => {
    const s = startMetroBundle({ target: 'ios', bundleId: 'main' });
    resolveMetroModule(s, 'App.tsx');
    resolveMetroModule(s, 'Home.tsx');
    applyMetroHmr(s, 'Home.tsx');
    completeMetroBundle(s);
    expect(s.state).toBe('completed');
    expect(s.resolvedModules).toHaveLength(2);
    expect(s.hmrUpdateCount).toBe(1);
  });

  it('rejects empty bundleId', () => {
    expect(() => startMetroBundle({ target: 'ios', bundleId: '' })).toThrow(/bundleId/);
  });

  it('multiple HMR updates accumulate', () => {
    const s = startMetroBundle({ target: 'android', bundleId: 'x' });
    applyMetroHmr(s, 'a');
    applyMetroHmr(s, 'b');
    applyMetroHmr(s, 'c');
    expect(s.hmrUpdateCount).toBe(3);
  });

  it('provider dialect differs per target', () => {
    const iosBundle = startMetroBundle({ target: 'ios', bundleId: 'x' });
    const androidBundle = startMetroBundle({ target: 'android', bundleId: 'x' });
    const webBundle = startMetroBundle({ target: 'web', bundleId: 'x' });
    expect(iosBundle.history[0]?.providerEvent).toContain('ios');
    expect(androidBundle.history[0]?.providerEvent).toContain('android');
    expect(webBundle.history[0]?.providerEvent).toContain('web');
  });

  // idle-state guards: existing tests always call startMetroBundle first, so the three throws never ran.
  it('rejects resolveMetroModule when bundle has not been started (state=idle)', () => {
    expect(() => resolveMetroModule(idleMetroSession(), 'x.tsx')).toThrow(/bundle must be started/);
  });

  it('rejects applyMetroHmr when bundle has not been started (state=idle)', () => {
    expect(() => applyMetroHmr(idleMetroSession(), 'x.tsx')).toThrow(/bundle must be started/);
  });

  it('rejects completeMetroBundle when bundle has not been started (state=idle)', () => {
    expect(() => completeMetroBundle(idleMetroSession())).toThrow(/bundle must be started/);
  });
});
