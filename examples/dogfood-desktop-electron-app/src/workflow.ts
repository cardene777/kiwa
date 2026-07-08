import {
  appendMenuBarItem,
  applyDownloadedUpdate,
  assertContextIsolation,
  bindContextBridge,
  buildMenuBar,
  clickMenuBarItem,
  clickTrayIcon,
  closeTauriWindow,
  createBrowserWindow,
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
  postWebviewMessage,
  quitElectronApp,
  recordUpdateDownloaded,
  registerTauriCommand,
  removeTrayIcon,
  requestFsPermission,
  revokeFsPermission,
  scheduleNotification,
  scheduleRelaunch,
  startAutoUpdaterCheck,
  startElectronApp,
  startTauriApp,
  updateTrayTooltip,
  type DesktopTarget,
} from '@kiwa-test/desktop';

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

// v0.1 互換維持 = 3 axis のみ (既存 caller が期待する挙動を保持)
export function runFullDesktopWorkflow(): WorkflowResult[] {
  return [
    ...runElectronAxis(),
    ...runTauriAxis(),
    ...runWebviewAxis(),
  ];
}

// v0.2 で新設 = 8 axis 全て走査 (v0.1 3 + v0.2 5)
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
