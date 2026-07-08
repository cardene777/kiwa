/**
 * @kiwa-test/desktop — Desktop test harness (v0.1、 new-base pair 第 14)。
 *
 * 3 axis (Electron + Tauri + Webview) を target-neutral state machine で扱う。
 * target = macos + windows + linux の 3 platform、 provider dialect も
 * 3 target で mapping。
 */
export type DesktopTarget = 'macos' | 'windows' | 'linux';

export type DesktopAxis = 'electron' | 'tauri' | 'webview';

export type NeutralEventName =
  // Electron axis (main + renderer + IPC + window)
  | 'electron.app_ready'
  | 'electron.window_created'
  | 'electron.ipc_message_dispatched'
  | 'electron.app_quit'
  // Tauri axis (invoke command + event listen + window mgmt)
  | 'tauri.command_registered'
  | 'tauri.command_invoked'
  | 'tauri.event_emitted'
  | 'tauri.window_closed'
  // Webview axis (bridge + preload script + context isolation)
  | 'webview.preload_loaded'
  | 'webview.bridge_bound'
  | 'webview.message_posted'
  | 'webview.isolation_asserted';

export interface AxisStep<TState extends string> {
  neutralEvent: NeutralEventName;
  providerEvent: string;
  state: TState;
  metadata: Record<string, string | number | boolean>;
}

const dialect: Record<DesktopTarget, Partial<Record<NeutralEventName, string>>> = {
  macos: {
    'electron.app_ready': 'macos.electron.app.ready',
    'electron.window_created': 'macos.electron.BrowserWindow.create',
    'electron.ipc_message_dispatched': 'macos.electron.ipcMain.on',
    'electron.app_quit': 'macos.electron.app.quit',
    'tauri.command_registered': 'macos.tauri.invoke_handler.register',
    'tauri.command_invoked': 'macos.tauri.invoke',
    'tauri.event_emitted': 'macos.tauri.emit',
    'tauri.window_closed': 'macos.tauri.window.close',
    'webview.preload_loaded': 'macos.webview.preload',
    'webview.bridge_bound': 'macos.webview.contextBridge.exposeInMainWorld',
    'webview.message_posted': 'macos.webview.postMessage',
    'webview.isolation_asserted': 'macos.webview.contextIsolation',
  },
  windows: {
    'electron.app_ready': 'windows.electron.app.ready',
    'electron.window_created': 'windows.electron.BrowserWindow.create',
    'electron.ipc_message_dispatched': 'windows.electron.ipcMain.on',
    'electron.app_quit': 'windows.electron.app.quit',
    'tauri.command_registered': 'windows.tauri.invoke_handler.register',
    'tauri.command_invoked': 'windows.tauri.invoke',
    'tauri.event_emitted': 'windows.tauri.emit',
    'tauri.window_closed': 'windows.tauri.window.close',
    'webview.preload_loaded': 'windows.webview2.preload',
    'webview.bridge_bound': 'windows.webview2.contextBridge.exposeInMainWorld',
    'webview.message_posted': 'windows.webview2.postMessage',
    'webview.isolation_asserted': 'windows.webview2.contextIsolation',
  },
  linux: {
    'electron.app_ready': 'linux.electron.app.ready',
    'electron.window_created': 'linux.electron.BrowserWindow.create',
    'electron.ipc_message_dispatched': 'linux.electron.ipcMain.on',
    'electron.app_quit': 'linux.electron.app.quit',
    'tauri.command_registered': 'linux.tauri.invoke_handler.register',
    'tauri.command_invoked': 'linux.tauri.invoke',
    'tauri.event_emitted': 'linux.tauri.emit',
    'tauri.window_closed': 'linux.tauri.window.close',
    'webview.preload_loaded': 'linux.webkit.preload',
    'webview.bridge_bound': 'linux.webkit.contextBridge.exposeInMainWorld',
    'webview.message_posted': 'linux.webkit.postMessage',
    'webview.isolation_asserted': 'linux.webkit.contextIsolation',
  },
};

export function providerEventName(target: DesktopTarget, neutral: NeutralEventName): string {
  return dialect[target][neutral] ?? neutral;
}
