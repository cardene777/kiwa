export {
  providerEventName,
  type AxisStep,
  type DesktopAxis,
  type DesktopTarget,
  type NeutralEventName,
} from './types.js';

// v0.1 axis
export {
  createBrowserWindow,
  dispatchIpcMessage,
  quitElectronApp,
  startElectronApp,
  type ElectronSession,
  type ElectronState,
} from './electron.js';

export {
  closeTauriWindow,
  emitTauriEvent,
  invokeTauriCommand,
  registerTauriCommand,
  startTauriApp,
  type TauriSession,
  type TauriState,
} from './tauri.js';

export {
  assertContextIsolation,
  bindContextBridge,
  loadPreloadScript,
  postWebviewMessage,
  type WebviewSession,
  type WebviewState,
} from './webview.js';

// v0.2 axis
export {
  applyDownloadedUpdate,
  recordUpdateDownloaded,
  scheduleRelaunch,
  startAutoUpdaterCheck,
  type AutoUpdaterSession,
  type AutoUpdaterState,
} from './auto-updater.js';

export {
  grantFsPermission,
  logFsPermissionAudit,
  requestFsPermission,
  revokeFsPermission,
  type FsPermissionScope,
  type FsPermissionsSession,
  type FsPermissionsState,
} from './fs-permissions.js';

export {
  dismissNotification,
  displayNotification,
  invokeNotificationAction,
  scheduleNotification,
  type NotificationSession,
  type NotificationState,
} from './notification.js';

export {
  appendMenuBarItem,
  buildMenuBar,
  clickMenuBarItem,
  destroyMenuBar,
  type MenuBarItem,
  type MenuBarSession,
  type MenuBarState,
} from './menu-bar.js';

export {
  clickTrayIcon,
  createTrayIcon,
  removeTrayIcon,
  updateTrayTooltip,
  type TrayIconSession,
  type TrayIconState,
} from './tray-icon.js';

// v0.3 axis
export {
  captureScreenChunk,
  requestScreenRecordingPermission,
  startScreenRecording,
  stopScreenRecording,
  type ScreenRecordingSession,
  type ScreenRecordingState,
} from './screen-recording.js';

export {
  clearAllGlobalShortcuts,
  createGlobalShortcutSession,
  registerGlobalShortcut,
  triggerGlobalShortcut,
  unregisterGlobalShortcut,
  type GlobalShortcutSession,
  type GlobalShortcutState,
} from './global-shortcut.js';

export {
  clearClipboard,
  notifyClipboardChange,
  openClipboard,
  readClipboard,
  writeClipboard,
  type ClipboardFormat,
  type ClipboardSession,
  type ClipboardState,
} from './clipboard.js';

export {
  notifyThemeChange,
  recordUserPreference,
  subscribeDarkMode,
  unsubscribeDarkMode,
  type DarkModeSession,
  type DarkModeState,
  type ThemeMode,
} from './dark-mode.js';

export {
  DESKTOP_AXIS_TO_EVENTS,
  collectFidelityCoverage,
  type FidelityCoverage,
  type FidelityRow,
} from './fidelity.js';
