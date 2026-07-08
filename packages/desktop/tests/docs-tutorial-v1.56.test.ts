/**
 * v1.56-3 docs 補強 — tutorial 116 code snippet 検証。
 * 34 milestone 連続 snippet validation streak = v1.23 → v1.56。 kiwa 史上最長記録更新継続。
 */
import { describe, expect, it } from 'vitest';
import {
  assertContextIsolation,
  bindContextBridge,
  closeTauriWindow,
  createBrowserWindow,
  dispatchIpcMessage,
  emitTauriEvent,
  invokeTauriCommand,
  loadPreloadScript,
  postWebviewMessage,
  quitElectronApp,
  registerTauriCommand,
  startElectronApp,
  startTauriApp,
} from '../src/index.js';

describe('tutorial 116 — Electron lifecycle snippet', () => {
  it('start → window → ipc → quit', () => {
    const s = startElectronApp({ target: 'macos', appId: 'com.example.app' });
    createBrowserWindow(s, 'main');
    dispatchIpcMessage(s, { channel: 'ping', payload: 'hello' });
    quitElectronApp(s);
    expect(s.state).toBe('quit');
    expect(s.ipcMessages).toBe(1);
  });
});

describe('tutorial 116 — Tauri invoke flow snippet', () => {
  it('register → invoke → emit → close', () => {
    const s = startTauriApp({ target: 'windows', appName: 'myapp' });
    registerTauriCommand(s, 'get_user');
    invokeTauriCommand(s, { commandName: 'get_user', payload: '{"id":1}' });
    emitTauriEvent(s, { eventName: 'user_updated', payload: '{"id":1}' });
    closeTauriWindow(s, 'main');
    expect(s.state).toBe('window-closed');
  });
});

describe('tutorial 116 — Webview bridge flow snippet', () => {
  it('preload → bind → post → isolation asserted', () => {
    const s = loadPreloadScript({ target: 'linux', webviewId: 'main' });
    bindContextBridge(s, 'appAPI');
    postWebviewMessage(s, { channel: 'ping', payload: 'hi' });
    assertContextIsolation(s, true);
    expect(s.state).toBe('isolation-asserted');
    expect(s.contextIsolated).toBe(true);
  });
});
