import { describe, expect, it } from 'vitest';
import {
  closeTauriWindow,
  emitTauriEvent,
  invokeTauriCommand,
  registerTauriCommand,
  startTauriApp,
} from '../../src/index.js';

describe('tauri axis semantics', () => {
  it('register → invoke → emit → close', () => {
    const s = startTauriApp({ target: 'macos', appName: 'app' });
    registerTauriCommand(s, 'get_user');
    invokeTauriCommand(s, { commandName: 'get_user', payload: '{"id":1}' });
    emitTauriEvent(s, { eventName: 'user_updated', payload: '{"id":1}' });
    closeTauriWindow(s, 'main');
    expect(s.state).toBe('window-closed');
    expect(s.registeredCommands).toContain('get_user');
    expect(s.invocations).toBe(1);
    expect(s.emittedEvents).toBe(1);
  });

  it('rejects invoke of unregistered command', () => {
    const s = startTauriApp({ target: 'windows', appName: 'x' });
    expect(() =>
      invokeTauriCommand(s, { commandName: 'ghost', payload: '' }),
    ).toThrow(/not registered/);
  });

  it('rejects empty inputs', () => {
    expect(() => startTauriApp({ target: 'macos', appName: '' })).toThrow(/appName/);
    const s = startTauriApp({ target: 'macos', appName: 'x' });
    expect(() => registerTauriCommand(s, '')).toThrow(/commandName/);
    expect(() => emitTauriEvent(s, { eventName: '', payload: '' })).toThrow(/eventName/);
    expect(() => closeTauriWindow(s, '')).toThrow(/windowLabel/);
  });

  it('multiple registrations accumulate', () => {
    const s = startTauriApp({ target: 'linux', appName: 'x' });
    registerTauriCommand(s, 'a');
    registerTauriCommand(s, 'b');
    registerTauriCommand(s, 'c');
    expect(s.registeredCommands).toEqual(['a', 'b', 'c']);
  });
});
