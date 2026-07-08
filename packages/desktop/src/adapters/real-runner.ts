/**
 * v0.7 real behavior runner — 12 axis 別に real 経路の behavior 差別化 pattern。
 *
 * shape 契約 preserving = neutralEvents 順序 + eventCount は mock と一致、
 * metadata + state のみ differentiate (real 経路の実際の behavior を simulate)。
 * v1.62+ 実 OS API 呼出 (electron-updater / SCStream / NSPasteboard 等) の早期実装、
 * fidelity harness で mock/real の behavior diff を early warning 検知可能に。
 *
 * 実 OS API は Node.js 環境で直接呼出せない (native binding 不要な simulation で
 * behavior 差別化を表現、 実 CLI/native は v1.63+ で置換予定)。
 */
import type { AxisStep, DesktopAxis, DesktopTarget, NeutralEventName } from '../semantics/types.js';
import {
  appendMenuBarItem,
  applyDownloadedUpdate,
  assertContextIsolation,
  bindContextBridge,
  buildMenuBar,
  captureScreenChunk,
  clearAllGlobalShortcuts,
  clearClipboard,
  clickMenuBarItem,
  clickTrayIcon,
  closeTauriWindow,
  createBrowserWindow,
  createGlobalShortcutSession,
  createTrayIcon,
  destroyMenuBar,
  dismissNotification,
  dispatchIpcMessage,
  displayNotification,
  emitTauriEvent,
  grantFsPermission,
  invokeNotificationAction,
  invokeTauriCommand,
  loadPreloadScript,
  logFsPermissionAudit,
  notifyClipboardChange,
  notifyThemeChange,
  openClipboard,
  postWebviewMessage,
  quitElectronApp,
  readClipboard,
  recordUpdateDownloaded,
  recordUserPreference,
  registerGlobalShortcut,
  registerTauriCommand,
  removeTrayIcon,
  requestFsPermission,
  requestScreenRecordingPermission,
  revokeFsPermission,
  scheduleNotification,
  scheduleRelaunch,
  startAutoUpdaterCheck,
  startElectronApp,
  startScreenRecording,
  startTauriApp,
  stopScreenRecording,
  subscribeDarkMode,
  triggerGlobalShortcut,
  unregisterGlobalShortcut,
  unsubscribeDarkMode,
  updateTrayTooltip,
  writeClipboard,
} from '../semantics/index.js';
import type { AdapterInvocation, AdapterResult } from './types.js';

function extractNeutralEvents(steps: AxisStep<string>[]): NeutralEventName[] {
  const seen = new Set<NeutralEventName>();
  const out: NeutralEventName[] = [];
  for (const s of steps) {
    if (!seen.has(s.neutralEvent)) {
      seen.add(s.neutralEvent);
      out.push(s.neutralEvent);
    }
  }
  return out;
}

function makeResult<TState extends string>(
  axis: DesktopAxis,
  target: DesktopTarget,
  history: AxisStep<TState>[],
  completed: boolean,
  start: number,
): AdapterResult {
  const steps = history as unknown as AxisStep<string>[];
  return {
    axis,
    target,
    mode: 'real',
    completed,
    eventCount: steps.length,
    durationMs: Date.now() - start,
    history: steps,
    neutralEvents: extractNeutralEvents(steps),
  };
}

/**
 * Real 経路の behavior 差別化 pattern。
 *
 * mock は 固定値 (metadata + input args) を使うのに対し、 real は
 * axis 別の 実運用 behavior を simulate (network check duration / permission
 * denial simulation / real content payload 等)。 shape 契約は preserving で
 * neutralEvents + eventCount は mock と一致する。
 */

async function runRealElectron(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = startElectronApp({ target: inv.target, appId: `real-app-${inv.target}` });
  // real 経路 = production-style app ID (mock は scan-id ベース)
  createBrowserWindow(s, 'main-window');
  dispatchIpcMessage(s, { channel: 'renderer-ready', payload: '{"pid":12345}' });
  quitElectronApp(s);
  return makeResult('electron', inv.target, s.history, s.state === 'quit', start);
}

async function runRealTauri(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = startTauriApp({ target: inv.target, appName: `real-tauri-${inv.target}` });
  registerTauriCommand(s, 'invoke_native');
  invokeTauriCommand(s, { commandName: 'invoke_native', payload: '{"native":true}' });
  emitTauriEvent(s, { eventName: 'native_ready', payload: '{"success":true}' });
  closeTauriWindow(s, 'main');
  return makeResult('tauri', inv.target, s.history, s.state === 'window-closed', start);
}

async function runRealWebview(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = loadPreloadScript({ target: inv.target, webviewId: 'production-webview' });
  bindContextBridge(s, 'productionAPI');
  postWebviewMessage(s, { channel: 'nav', payload: '{"route":"/dashboard"}' });
  assertContextIsolation(s, true);
  return makeResult('webview', inv.target, s.history, s.state === 'isolation-asserted', start);
}

async function runRealAutoUpdater(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  // real: network check simulation で 実 update size (mock は 42MB 固定)
  const s = startAutoUpdaterCheck({ target: inv.target, channel: 'stable' });
  recordUpdateDownloaded(s, { version: '2.5.0', bytes: 128_000_000 });
  applyDownloadedUpdate(s);
  scheduleRelaunch(s, 5_000);
  return makeResult('auto-updater', inv.target, s.history, s.state === 'relaunch-scheduled', start);
}

async function runRealFsPermissions(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  // real: production path (mock は scan-id path)
  const s = requestFsPermission({
    target: inv.target,
    path: '/Users/production/Documents',
    scope: 'read-write',
  });
  grantFsPermission(s, 'read');
  grantFsPermission(s, 'write');
  revokeFsPermission(s, 'read');
  logFsPermissionAudit(s, 'production-audit-2026-07');
  return makeResult('fs-permissions', inv.target, s.history, s.state === 'audited', start);
}

async function runRealNotification(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = scheduleNotification({
    target: inv.target,
    notificationId: `prod-notif-${inv.target}`,
    title: 'Production release available',
    scheduledAtMs: 0,
  });
  displayNotification(s, 800);
  invokeNotificationAction(s, 'download');
  dismissNotification(s);
  return makeResult('notification', inv.target, s.history, s.state === 'dismissed', start);
}

async function runRealMenuBar(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = buildMenuBar({ target: inv.target, menuId: 'production-menu' });
  appendMenuBarItem(s, { id: 'app', label: 'App', accelerator: null });
  appendMenuBarItem(s, { id: 'help', label: 'Help', accelerator: 'F1' });
  clickMenuBarItem(s, 'help');
  destroyMenuBar(s);
  return makeResult('menu-bar', inv.target, s.history, s.state === 'destroyed', start);
}

async function runRealTrayIcon(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = createTrayIcon({
    target: inv.target,
    trayId: 'production-tray',
    iconPath: '/opt/app/assets/tray-icon@2x.png',
  });
  updateTrayTooltip(s, 'Connected - 3 sessions');
  clickTrayIcon(s);
  removeTrayIcon(s);
  return makeResult('tray-icon', inv.target, s.history, s.state === 'removed', start);
}

async function runRealScreenRecording(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = requestScreenRecordingPermission({
    target: inv.target,
    sessionId: 'production-session',
    displayId: 'display-external-4k',
  });
  startScreenRecording(s, true);
  // real: 4K frame = larger chunks (mock は 1MB + 2MB)
  captureScreenChunk(s, 8_388_608);
  captureScreenChunk(s, 8_388_608);
  stopScreenRecording(s);
  return makeResult('screen-recording', inv.target, s.history, s.state === 'stopped', start);
}

async function runRealGlobalShortcut(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = createGlobalShortcutSession({ target: inv.target, namespace: 'production-app' });
  registerGlobalShortcut(s, 'CmdOrCtrl+Shift+Space');
  registerGlobalShortcut(s, 'CmdOrCtrl+Alt+K');
  triggerGlobalShortcut(s, 'CmdOrCtrl+Shift+Space');
  unregisterGlobalShortcut(s, 'CmdOrCtrl+Alt+K');
  clearAllGlobalShortcuts(s);
  return makeResult('global-shortcut', inv.target, s.history, s.state === 'all-cleared', start);
}

async function runRealClipboard(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = openClipboard({ target: inv.target, clipboardId: 'production-clipboard' });
  // real: production content (mock は "hello adapter")
  writeClipboard(s, {
    contents: 'https://github.com/cardene777/kiwa',
    format: 'text',
  });
  readClipboard(s);
  notifyClipboardChange(s, 'https://cardene777.github.io/kiwa/');
  clearClipboard(s);
  return makeResult('clipboard', inv.target, s.history, s.state === 'cleared', start);
}

async function runRealDarkMode(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  // real: production initial theme = 'no-preference' (mock は 'light')
  const s = subscribeDarkMode({
    target: inv.target,
    observerId: 'production-theme-observer',
    initialTheme: 'no-preference',
  });
  notifyThemeChange(s, 'dark');
  recordUserPreference(s, 'dark');
  unsubscribeDarkMode(s);
  return makeResult('dark-mode', inv.target, s.history, s.state === 'unsubscribed', start);
}

export const REAL_AXIS_RUNNERS: Record<
  DesktopAxis,
  (inv: AdapterInvocation) => Promise<AdapterResult>
> = {
  electron: runRealElectron,
  tauri: runRealTauri,
  webview: runRealWebview,
  'auto-updater': runRealAutoUpdater,
  'fs-permissions': runRealFsPermissions,
  notification: runRealNotification,
  'menu-bar': runRealMenuBar,
  'tray-icon': runRealTrayIcon,
  'screen-recording': runRealScreenRecording,
  'global-shortcut': runRealGlobalShortcut,
  clipboard: runRealClipboard,
  'dark-mode': runRealDarkMode,
};
