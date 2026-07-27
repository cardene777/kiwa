import { expect, test } from 'vitest';
import {
  assertContextIsolation,
  bindContextBridge,
  createBrowserWindow,
  dispatchIpcMessage,
  invokeTauriCommand,
  loadPreloadScript,
  postWebviewMessage,
  quitElectronApp,
  registerTauriCommand,
  startElectronApp,
  startTauriApp,
} from '../src/index.js';

test('the quickstart records the Electron lifecycle rather than opening a native window', () => {
  const session = startElectronApp({ target: 'macos', appId: 'com.example.desktop' });
  expect(createBrowserWindow(session, 'main').neutralEvent).toBe('electron.window_created');
  expect(dispatchIpcMessage(session, { channel: 'settings:save', payload: '{"theme":"dark"}' }).metadata.channel).toBe('settings:save');
  expect(quitElectronApp(session).state).toBe('quit');
  expect(session.history.map((step) => step.neutralEvent)).toEqual([
    'electron.app_ready',
    'electron.window_created',
    'electron.ipc_message_dispatched',
    'electron.app_quit',
  ]);
});

test('the how-to separates Tauri registration from a preload-dependent webview bridge', () => {
  const tauri = startTauriApp({ target: 'windows', appName: 'settings-app' });
  registerTauriCommand(tauri, 'save_preferences');
  expect(invokeTauriCommand(tauri, { commandName: 'save_preferences', payload: '{"theme":"dark"}' }).neutralEvent).toBe('tauri.command_invoked');
  expect(() => invokeTauriCommand(tauri, { commandName: 'missing', payload: '{}' })).toThrow(/not registered/);

  const webview = loadPreloadScript({ target: 'linux', webviewId: 'settings' });
  bindContextBridge(webview, 'desktopApi');
  postWebviewMessage(webview, { channel: 'settings:open', payload: '{}' });
  expect(assertContextIsolation(webview, true).metadata.isolated).toBe(true);
});
