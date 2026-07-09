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
  type DesktopTarget,
} from '@kiwa-lab/desktop';

export interface WorkflowResult {
  target: DesktopTarget;
  axis: string;
  eventCount: number;
  completed: boolean;
}

const targets: DesktopTarget[] = ['macos', 'windows', 'linux'];

// v0.1 axis (backward compat 絶対維持)
export function runElectronAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = startElectronApp({ target: t, appId: `com.demo.${t}` });
    createBrowserWindow(s, 'main');
    dispatchIpcMessage(s, { channel: 'ping', payload: 'hi' });
    quitElectronApp(s);
    return {
      target: t,
      axis: 'electron',
      eventCount: s.history.length,
      completed: s.state === 'quit',
    };
  });
}

export function runTauriAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = startTauriApp({ target: t, appName: `app-${t}` });
    registerTauriCommand(s, 'get_user');
    invokeTauriCommand(s, { commandName: 'get_user', payload: '{"id":1}' });
    emitTauriEvent(s, { eventName: 'user_updated', payload: '{"id":1}' });
    closeTauriWindow(s, 'main');
    return {
      target: t,
      axis: 'tauri',
      eventCount: s.history.length,
      completed: s.state === 'window-closed',
    };
  });
}

export function runWebviewAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = loadPreloadScript({ target: t, webviewId: 'main' });
    bindContextBridge(s, 'appAPI');
    postWebviewMessage(s, { channel: 'ping', payload: 'hi' });
    assertContextIsolation(s, true);
    return {
      target: t,
      axis: 'webview',
      eventCount: s.history.length,
      completed: s.state === 'isolation-asserted',
    };
  });
}

// v0.2 5 advanced axis
export function runAutoUpdaterAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = startAutoUpdaterCheck({ target: t, channel: 'stable' });
    recordUpdateDownloaded(s, { version: '1.2.3', bytes: 42_000_000 });
    applyDownloadedUpdate(s);
    scheduleRelaunch(s, 3_000);
    return {
      target: t,
      axis: 'auto-updater',
      eventCount: s.history.length,
      completed: s.state === 'relaunch-scheduled',
    };
  });
}

export function runFsPermissionsAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = requestFsPermission({ target: t, path: `/home/${t}/data`, scope: 'read-write' });
    grantFsPermission(s, 'read');
    grantFsPermission(s, 'write');
    revokeFsPermission(s, 'read');
    logFsPermissionAudit(s, 'workflow-audit');
    return {
      target: t,
      axis: 'fs-permissions',
      eventCount: s.history.length,
      completed: s.state === 'audited',
    };
  });
}

export function runNotificationAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = scheduleNotification({
      target: t,
      notificationId: `notif-${t}`,
      title: 'Update available',
      scheduledAtMs: 1_000,
    });
    displayNotification(s, 1_500);
    invokeNotificationAction(s, 'view');
    dismissNotification(s);
    return {
      target: t,
      axis: 'notification',
      eventCount: s.history.length,
      completed: s.state === 'dismissed',
    };
  });
}

export function runMenuBarAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = buildMenuBar({ target: t, menuId: `menu-${t}` });
    appendMenuBarItem(s, { id: 'file', label: 'File', accelerator: 'Cmd+F' });
    appendMenuBarItem(s, { id: 'edit', label: 'Edit', accelerator: null });
    clickMenuBarItem(s, 'file');
    destroyMenuBar(s);
    return {
      target: t,
      axis: 'menu-bar',
      eventCount: s.history.length,
      completed: s.state === 'destroyed',
    };
  });
}

export function runTrayIconAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = createTrayIcon({ target: t, trayId: `tray-${t}`, iconPath: '/app/icon.png' });
    updateTrayTooltip(s, 'Sync in progress');
    clickTrayIcon(s);
    removeTrayIcon(s);
    return {
      target: t,
      axis: 'tray-icon',
      eventCount: s.history.length,
      completed: s.state === 'removed',
    };
  });
}

// v0.3 4 advanced III axis
export function runScreenRecordingAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = requestScreenRecordingPermission({
      target: t,
      sessionId: `rec-${t}`,
      displayId: 'display-primary',
    });
    startScreenRecording(s, true);
    captureScreenChunk(s, 1_048_576);
    captureScreenChunk(s, 2_097_152);
    stopScreenRecording(s);
    return {
      target: t,
      axis: 'screen-recording',
      eventCount: s.history.length,
      completed: s.state === 'stopped',
    };
  });
}

export function runGlobalShortcutAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = createGlobalShortcutSession({ target: t, namespace: `app-${t}` });
    registerGlobalShortcut(s, 'CmdOrCtrl+Shift+P');
    registerGlobalShortcut(s, 'CmdOrCtrl+Shift+O');
    triggerGlobalShortcut(s, 'CmdOrCtrl+Shift+P');
    unregisterGlobalShortcut(s, 'CmdOrCtrl+Shift+O');
    clearAllGlobalShortcuts(s);
    return {
      target: t,
      axis: 'global-shortcut',
      eventCount: s.history.length,
      completed: s.state === 'all-cleared',
    };
  });
}

export function runClipboardAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = openClipboard({ target: t, clipboardId: `cb-${t}` });
    writeClipboard(s, { contents: 'hello workflow', format: 'text' });
    readClipboard(s);
    notifyClipboardChange(s, 'external value');
    clearClipboard(s);
    return {
      target: t,
      axis: 'clipboard',
      eventCount: s.history.length,
      completed: s.state === 'cleared',
    };
  });
}

export function runDarkModeAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = subscribeDarkMode({
      target: t,
      observerId: `obs-${t}`,
      initialTheme: 'light',
    });
    notifyThemeChange(s, 'dark');
    recordUserPreference(s, 'dark');
    unsubscribeDarkMode(s);
    return {
      target: t,
      axis: 'dark-mode',
      eventCount: s.history.length,
      completed: s.state === 'unsubscribed',
    };
  });
}

// v0.1 互換維持 = 3 axis のみ (既存 caller が期待する挙動を保持)
export function runFullDesktopWorkflow(): WorkflowResult[] {
  return [
    ...runElectronAxis(),
    ...runTauriAxis(),
    ...runWebviewAxis(),
  ];
}

// v0.2 = 8 axis 全て走査 (v0.1 3 + v0.2 5)
export function runFullDesktopWorkflowV02(): WorkflowResult[] {
  return [
    ...runElectronAxis(),
    ...runTauriAxis(),
    ...runWebviewAxis(),
    ...runAutoUpdaterAxis(),
    ...runFsPermissionsAxis(),
    ...runNotificationAxis(),
    ...runMenuBarAxis(),
    ...runTrayIconAxis(),
  ];
}

// v0.3 で新設 = 12 axis 全て走査 (v0.1 3 + v0.2 5 + v0.3 4)
export function runFullDesktopWorkflowV03(): WorkflowResult[] {
  return [
    ...runElectronAxis(),
    ...runTauriAxis(),
    ...runWebviewAxis(),
    ...runAutoUpdaterAxis(),
    ...runFsPermissionsAxis(),
    ...runNotificationAxis(),
    ...runMenuBarAxis(),
    ...runTrayIconAxis(),
    ...runScreenRecordingAxis(),
    ...runGlobalShortcutAxis(),
    ...runClipboardAxis(),
    ...runDarkModeAxis(),
  ];
}
