import { describe, expect, it } from 'vitest';
import {
  assertContextIsolation,
  bindContextBridge,
  loadPreloadScript,
  postWebviewMessage,
} from '../../src/index.js';

describe('webview axis semantics', () => {
  it('preload → bind → post → isolation asserted', () => {
    const s = loadPreloadScript({ target: 'macos', webviewId: 'main' });
    bindContextBridge(s, 'electronAPI');
    postWebviewMessage(s, { channel: 'ping', payload: 'hi' });
    assertContextIsolation(s, true);
    expect(s.state).toBe('isolation-asserted');
    expect(s.exposedApis).toContain('electronAPI');
    expect(s.postedMessages).toBe(1);
    expect(s.contextIsolated).toBe(true);
  });

  it('rejects operations before preload', () => {
    const s: ReturnType<typeof loadPreloadScript> = {
      target: 'macos',
      webviewId: 'x',
      state: 'idle',
      exposedApis: [],
      postedMessages: 0,
      contextIsolated: false,
      history: [],
    };
    expect(() => bindContextBridge(s, 'x')).toThrow(/preload not loaded/);
    expect(() => postWebviewMessage(s, { channel: 'x', payload: '' })).toThrow(/preload not loaded/);
  });

  it('rejects empty inputs', () => {
    expect(() => loadPreloadScript({ target: 'macos', webviewId: '' })).toThrow(/webviewId/);
    const s = loadPreloadScript({ target: 'macos', webviewId: 'x' });
    expect(() => bindContextBridge(s, '')).toThrow(/apiName/);
    expect(() => postWebviewMessage(s, { channel: '', payload: '' })).toThrow(/channel/);
  });

  it('multiple bindings accumulate', () => {
    const s = loadPreloadScript({ target: 'windows', webviewId: 'x' });
    bindContextBridge(s, 'a');
    bindContextBridge(s, 'b');
    expect(s.exposedApis).toEqual(['a', 'b']);
  });

  it('isolation flag reflects assertion', () => {
    const s = loadPreloadScript({ target: 'linux', webviewId: 'x' });
    assertContextIsolation(s, false);
    expect(s.contextIsolated).toBe(false);
  });
});
