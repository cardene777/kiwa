import { describe, expect, it } from 'vitest';
import {
  clearAllGlobalShortcuts,
  createGlobalShortcutSession,
  registerGlobalShortcut,
  triggerGlobalShortcut,
  unregisterGlobalShortcut,
} from '../../src/index.js';

describe('global-shortcut axis semantics (v0.3)', () => {
  it('register → trigger → unregister → all-clear full path', () => {
    const s = createGlobalShortcutSession({ target: 'macos', namespace: 'app' });
    registerGlobalShortcut(s, 'CmdOrCtrl+Shift+P');
    registerGlobalShortcut(s, 'CmdOrCtrl+Shift+O');
    triggerGlobalShortcut(s, 'CmdOrCtrl+Shift+P');
    triggerGlobalShortcut(s, 'CmdOrCtrl+Shift+P');
    unregisterGlobalShortcut(s, 'CmdOrCtrl+Shift+O');
    clearAllGlobalShortcuts(s);
    expect(s.state).toBe('all-cleared');
    expect(s.registered).toEqual([]);
    expect(Object.keys(s.triggerCounts)).toHaveLength(0);
  });

  it('rejects duplicate registration', () => {
    const s = createGlobalShortcutSession({ target: 'windows', namespace: 'ns' });
    registerGlobalShortcut(s, 'F1');
    expect(() => registerGlobalShortcut(s, 'F1')).toThrow(/already registered/);
  });

  it('rejects trigger / unregister of unregistered shortcut', () => {
    const s = createGlobalShortcutSession({ target: 'linux', namespace: 'ns' });
    expect(() => triggerGlobalShortcut(s, 'F1')).toThrow(/not registered/);
    expect(() => unregisterGlobalShortcut(s, 'F1')).toThrow(/not registered/);
  });

  it('rejects registration after all-cleared', () => {
    const s = createGlobalShortcutSession({ target: 'macos', namespace: 'ns' });
    registerGlobalShortcut(s, 'F1');
    clearAllGlobalShortcuts(s);
    expect(() => registerGlobalShortcut(s, 'F2')).toThrow(/cleared/);
  });

  it('rejects empty inputs', () => {
    expect(() => createGlobalShortcutSession({ target: 'macos', namespace: '' })).toThrow(/namespace/);
    const s = createGlobalShortcutSession({ target: 'macos', namespace: 'ns' });
    expect(() => registerGlobalShortcut(s, '')).toThrow(/accelerator/);
  });

  it('provider dialect maps per target', () => {
    const s = createGlobalShortcutSession({ target: 'macos', namespace: 'ns' });
    registerGlobalShortcut(s, 'F1');
    expect(s.history[0]?.providerEvent).toContain('macos.RegisterEventHotKey');
    const w = createGlobalShortcutSession({ target: 'windows', namespace: 'ns' });
    registerGlobalShortcut(w, 'F1');
    expect(w.history[0]?.providerEvent).toContain('windows.User32.RegisterHotKey');
    const l = createGlobalShortcutSession({ target: 'linux', namespace: 'ns' });
    registerGlobalShortcut(l, 'F1');
    expect(l.history[0]?.providerEvent).toContain('linux.xdgPortal.GlobalShortcuts');
  });

  it('multiple triggers accumulate', () => {
    const s = createGlobalShortcutSession({ target: 'macos', namespace: 'ns' });
    registerGlobalShortcut(s, 'F1');
    triggerGlobalShortcut(s, 'F1');
    triggerGlobalShortcut(s, 'F1');
    triggerGlobalShortcut(s, 'F1');
    expect(s.triggerCounts['F1']).toBe(3);
  });
});
