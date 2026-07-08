/**
 * 12 axis 共通 mock/real adapter factory (v0.4)。
 * 各 axis の semantics function を横断的に呼出す deterministic replay。
 * v1.60+ で real adapter を実 OS API 呼出に置換予定 (現在は mock と同 shape 契約)。
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
import { REAL_AXIS_RUNNERS } from './real-runner.js';
import type { AdapterInvocation, AdapterResult, DesktopAdapter } from './types.js';

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
  mode: 'mock' | 'real',
  history: AxisStep<TState>[],
  completed: boolean,
  start: number,
): AdapterResult {
  const steps = history as unknown as AxisStep<string>[];
  return {
    axis,
    target,
    mode,
    completed,
    eventCount: steps.length,
    durationMs: Date.now() - start,
    history: steps,
    neutralEvents: extractNeutralEvents(steps),
  };
}

async function runElectron(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = startElectronApp({ target: inv.target, appId: `${inv.mode}-${inv.scanId}` });
  createBrowserWindow(s, 'main');
  dispatchIpcMessage(s, { channel: 'ping', payload: 'hi' });
  quitElectronApp(s);
  return makeResult('electron', inv.target, inv.mode, s.history, s.state === 'quit', start);
}

async function runTauri(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = startTauriApp({ target: inv.target, appName: `${inv.mode}-${inv.scanId}` });
  registerTauriCommand(s, 'get_user');
  invokeTauriCommand(s, { commandName: 'get_user', payload: '{"id":1}' });
  emitTauriEvent(s, { eventName: 'user_updated', payload: '{"id":1}' });
  closeTauriWindow(s, 'main');
  return makeResult('tauri', inv.target, inv.mode, s.history, s.state === 'window-closed', start);
}

async function runWebview(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = loadPreloadScript({ target: inv.target, webviewId: `${inv.mode}-${inv.scanId}` });
  bindContextBridge(s, 'appAPI');
  postWebviewMessage(s, { channel: 'ping', payload: 'hi' });
  assertContextIsolation(s, true);
  return makeResult('webview', inv.target, inv.mode, s.history, s.state === 'isolation-asserted', start);
}

async function runAutoUpdater(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = startAutoUpdaterCheck({ target: inv.target, channel: 'stable' });
  recordUpdateDownloaded(s, { version: '1.2.3', bytes: 42_000_000 });
  applyDownloadedUpdate(s);
  scheduleRelaunch(s, 3_000);
  return makeResult('auto-updater', inv.target, inv.mode, s.history, s.state === 'relaunch-scheduled', start);
}

async function runFsPermissions(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = requestFsPermission({
    target: inv.target,
    path: `/${inv.mode}-${inv.scanId}/data`,
    scope: 'read-write',
  });
  grantFsPermission(s, 'read');
  grantFsPermission(s, 'write');
  revokeFsPermission(s, 'read');
  logFsPermissionAudit(s, 'adapter-audit');
  return makeResult('fs-permissions', inv.target, inv.mode, s.history, s.state === 'audited', start);
}

async function runNotification(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = scheduleNotification({
    target: inv.target,
    notificationId: `${inv.mode}-${inv.scanId}`,
    title: 'Update available',
    scheduledAtMs: 1_000,
  });
  displayNotification(s, 1_500);
  invokeNotificationAction(s, 'view');
  dismissNotification(s);
  return makeResult('notification', inv.target, inv.mode, s.history, s.state === 'dismissed', start);
}

async function runMenuBar(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = buildMenuBar({ target: inv.target, menuId: `${inv.mode}-${inv.scanId}` });
  appendMenuBarItem(s, { id: 'file', label: 'File', accelerator: 'Cmd+F' });
  appendMenuBarItem(s, { id: 'edit', label: 'Edit', accelerator: null });
  clickMenuBarItem(s, 'file');
  destroyMenuBar(s);
  return makeResult('menu-bar', inv.target, inv.mode, s.history, s.state === 'destroyed', start);
}

async function runTrayIcon(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = createTrayIcon({
    target: inv.target,
    trayId: `${inv.mode}-${inv.scanId}`,
    iconPath: '/app/icon.png',
  });
  updateTrayTooltip(s, 'Sync in progress');
  clickTrayIcon(s);
  removeTrayIcon(s);
  return makeResult('tray-icon', inv.target, inv.mode, s.history, s.state === 'removed', start);
}

async function runScreenRecording(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = requestScreenRecordingPermission({
    target: inv.target,
    sessionId: `${inv.mode}-${inv.scanId}`,
    displayId: 'display-primary',
  });
  startScreenRecording(s, true);
  captureScreenChunk(s, 1_048_576);
  captureScreenChunk(s, 2_097_152);
  stopScreenRecording(s);
  return makeResult('screen-recording', inv.target, inv.mode, s.history, s.state === 'stopped', start);
}

async function runGlobalShortcut(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = createGlobalShortcutSession({ target: inv.target, namespace: `${inv.mode}-${inv.scanId}` });
  registerGlobalShortcut(s, 'CmdOrCtrl+Shift+P');
  registerGlobalShortcut(s, 'F1');
  triggerGlobalShortcut(s, 'CmdOrCtrl+Shift+P');
  unregisterGlobalShortcut(s, 'F1');
  clearAllGlobalShortcuts(s);
  return makeResult('global-shortcut', inv.target, inv.mode, s.history, s.state === 'all-cleared', start);
}

async function runClipboard(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = openClipboard({ target: inv.target, clipboardId: `${inv.mode}-${inv.scanId}` });
  writeClipboard(s, { contents: 'hello adapter', format: 'text' });
  readClipboard(s);
  notifyClipboardChange(s, 'external value');
  clearClipboard(s);
  return makeResult('clipboard', inv.target, inv.mode, s.history, s.state === 'cleared', start);
}

async function runDarkMode(inv: AdapterInvocation): Promise<AdapterResult> {
  const start = Date.now();
  const s = subscribeDarkMode({
    target: inv.target,
    observerId: `${inv.mode}-${inv.scanId}`,
    initialTheme: 'light',
  });
  notifyThemeChange(s, 'dark');
  recordUserPreference(s, 'dark');
  unsubscribeDarkMode(s);
  return makeResult('dark-mode', inv.target, inv.mode, s.history, s.state === 'unsubscribed', start);
}

const AXIS_RUNNERS: Record<DesktopAxis, (inv: AdapterInvocation) => Promise<AdapterResult>> = {
  electron: runElectron,
  tauri: runTauri,
  webview: runWebview,
  'auto-updater': runAutoUpdater,
  'fs-permissions': runFsPermissions,
  notification: runNotification,
  'menu-bar': runMenuBar,
  'tray-icon': runTrayIcon,
  'screen-recording': runScreenRecording,
  'global-shortcut': runGlobalShortcut,
  clipboard: runClipboard,
  'dark-mode': runDarkMode,
};

export function makeMockAdapter(axis: DesktopAxis): DesktopAdapter {
  return {
    axis,
    async scan(inv) {
      return AXIS_RUNNERS[axis]({ ...inv, mode: 'mock' });
    },
  };
}

export function makeRealAdapter(axis: DesktopAxis): DesktopAdapter {
  return {
    axis,
    async scan(inv) {
      // v0.7 = real 経路は REAL_AXIS_RUNNERS 経由で behavior 差別化
      // shape 契約 preserving (neutralEvents + eventCount 一致) + metadata / state 差別化
      return REAL_AXIS_RUNNERS[axis]({ ...inv, mode: 'real' });
    },
  };
}

const ALL_AXES: DesktopAxis[] = [
  'electron',
  'tauri',
  'webview',
  'auto-updater',
  'fs-permissions',
  'notification',
  'menu-bar',
  'tray-icon',
  'screen-recording',
  'global-shortcut',
  'clipboard',
  'dark-mode',
];

export const MOCK_ADAPTERS: Record<DesktopAxis, DesktopAdapter> = ALL_AXES.reduce(
  (acc, axis) => {
    acc[axis] = makeMockAdapter(axis);
    return acc;
  },
  {} as Record<DesktopAxis, DesktopAdapter>,
);

export const REAL_ADAPTERS: Record<DesktopAxis, DesktopAdapter> = ALL_AXES.reduce(
  (acc, axis) => {
    acc[axis] = makeRealAdapter(axis);
    return acc;
  },
  {} as Record<DesktopAxis, DesktopAdapter>,
);
