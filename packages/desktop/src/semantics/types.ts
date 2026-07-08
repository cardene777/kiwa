/**
 * @kiwa-test/desktop — Desktop test harness (v0.2、 new-base pair 第 14 の第 2 段)。
 *
 * v0.1 3 axis (Electron + Tauri + Webview) + v0.2 5 advanced axis
 * (Auto-updater + File-system permissions + Notification + Menu-bar + Tray-icon) を
 * target-neutral state machine で扱う。 target = macos + windows + linux の
 * 3 platform、 provider dialect も 3 target で mapping。
 */
export type DesktopTarget = 'macos' | 'windows' | 'linux';

export type DesktopAxis =
  | 'electron'
  | 'tauri'
  | 'webview'
  | 'auto-updater'
  | 'fs-permissions'
  | 'notification'
  | 'menu-bar'
  | 'tray-icon';

export type NeutralEventName =
  // v0.1 Electron axis (main + renderer + IPC + window)
  | 'electron.app_ready'
  | 'electron.window_created'
  | 'electron.ipc_message_dispatched'
  | 'electron.app_quit'
  // v0.1 Tauri axis (invoke command + event listen + window mgmt)
  | 'tauri.command_registered'
  | 'tauri.command_invoked'
  | 'tauri.event_emitted'
  | 'tauri.window_closed'
  // v0.1 Webview axis (bridge + preload script + context isolation)
  | 'webview.preload_loaded'
  | 'webview.bridge_bound'
  | 'webview.message_posted'
  | 'webview.isolation_asserted'
  // v0.2 Auto-updater axis (check + download + apply + relaunch)
  | 'auto-updater.check_started'
  | 'auto-updater.update_downloaded'
  | 'auto-updater.update_applied'
  | 'auto-updater.relaunch_scheduled'
  // v0.2 File-system permissions axis (request + grant + revoke + audit)
  | 'fs-permissions.request_submitted'
  | 'fs-permissions.permission_granted'
  | 'fs-permissions.permission_revoked'
  | 'fs-permissions.audit_logged'
  // v0.2 Notification axis (schedule + display + action + dismiss)
  | 'notification.scheduled'
  | 'notification.displayed'
  | 'notification.action_invoked'
  | 'notification.dismissed'
  // v0.2 Menu-bar axis (build + item + click + destroy)
  | 'menu-bar.built'
  | 'menu-bar.item_appended'
  | 'menu-bar.item_clicked'
  | 'menu-bar.destroyed'
  // v0.2 Tray-icon axis (created + tooltip + click + removed)
  | 'tray-icon.created'
  | 'tray-icon.tooltip_updated'
  | 'tray-icon.clicked'
  | 'tray-icon.removed';

export interface AxisStep<TState extends string> {
  neutralEvent: NeutralEventName;
  providerEvent: string;
  state: TState;
  metadata: Record<string, string | number | boolean>;
}

const dialect: Record<DesktopTarget, Partial<Record<NeutralEventName, string>>> = {
  macos: {
    // v0.1
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
    // v0.2 Auto-updater — macOS = Squirrel.Mac
    'auto-updater.check_started': 'macos.autoUpdater.checkForUpdates',
    'auto-updater.update_downloaded': 'macos.autoUpdater.update-downloaded',
    'auto-updater.update_applied': 'macos.autoUpdater.quitAndInstall',
    'auto-updater.relaunch_scheduled': 'macos.autoUpdater.relaunchAfterInstall',
    // v0.2 FS permissions — macOS = TCC (Transparency Consent Control)
    'fs-permissions.request_submitted': 'macos.tcc.requestAccess',
    'fs-permissions.permission_granted': 'macos.tcc.granted',
    'fs-permissions.permission_revoked': 'macos.tcc.revoked',
    'fs-permissions.audit_logged': 'macos.tcc.audit.log',
    // v0.2 Notification — macOS = UserNotifications framework
    'notification.scheduled': 'macos.userNotifications.schedule',
    'notification.displayed': 'macos.userNotifications.display',
    'notification.action_invoked': 'macos.userNotifications.action',
    'notification.dismissed': 'macos.userNotifications.dismiss',
    // v0.2 Menu-bar — macOS = NSMenu (app menu)
    'menu-bar.built': 'macos.NSMenu.setMainMenu',
    'menu-bar.item_appended': 'macos.NSMenu.addItem',
    'menu-bar.item_clicked': 'macos.NSMenuItem.action',
    'menu-bar.destroyed': 'macos.NSMenu.removeAllItems',
    // v0.2 Tray-icon — macOS = NSStatusItem (menu bar extra)
    'tray-icon.created': 'macos.NSStatusItem.create',
    'tray-icon.tooltip_updated': 'macos.NSStatusItem.setToolTip',
    'tray-icon.clicked': 'macos.NSStatusItem.action',
    'tray-icon.removed': 'macos.NSStatusItem.remove',
  },
  windows: {
    // v0.1
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
    // v0.2 Auto-updater — Windows = Squirrel.Windows / NSIS
    'auto-updater.check_started': 'windows.autoUpdater.checkForUpdates',
    'auto-updater.update_downloaded': 'windows.autoUpdater.update-downloaded',
    'auto-updater.update_applied': 'windows.autoUpdater.quitAndInstall',
    'auto-updater.relaunch_scheduled': 'windows.autoUpdater.relaunchAfterInstall',
    // v0.2 FS permissions — Windows = UAC + AppContainer
    'fs-permissions.request_submitted': 'windows.uac.request',
    'fs-permissions.permission_granted': 'windows.uac.granted',
    'fs-permissions.permission_revoked': 'windows.uac.revoked',
    'fs-permissions.audit_logged': 'windows.uac.audit.log',
    // v0.2 Notification — Windows = Toast Notification (Windows.UI.Notifications)
    'notification.scheduled': 'windows.toastNotification.schedule',
    'notification.displayed': 'windows.toastNotification.show',
    'notification.action_invoked': 'windows.toastNotification.activated',
    'notification.dismissed': 'windows.toastNotification.dismissed',
    // v0.2 Menu-bar — Windows = System menu (WM_MENU)
    'menu-bar.built': 'windows.menu.SetMenu',
    'menu-bar.item_appended': 'windows.menu.AppendMenu',
    'menu-bar.item_clicked': 'windows.menu.WM_COMMAND',
    'menu-bar.destroyed': 'windows.menu.DestroyMenu',
    // v0.2 Tray-icon — Windows = NotifyIcon (Shell_NotifyIcon)
    'tray-icon.created': 'windows.notifyIcon.NIM_ADD',
    'tray-icon.tooltip_updated': 'windows.notifyIcon.NIM_MODIFY',
    'tray-icon.clicked': 'windows.notifyIcon.WM_LBUTTONUP',
    'tray-icon.removed': 'windows.notifyIcon.NIM_DELETE',
  },
  linux: {
    // v0.1
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
    // v0.2 Auto-updater — Linux = AppImage update / Snap refresh
    'auto-updater.check_started': 'linux.autoUpdater.checkForUpdates',
    'auto-updater.update_downloaded': 'linux.autoUpdater.appimage-download',
    'auto-updater.update_applied': 'linux.autoUpdater.appimage-install',
    'auto-updater.relaunch_scheduled': 'linux.autoUpdater.relaunchAfterInstall',
    // v0.2 FS permissions — Linux = xdg-portal / polkit
    'fs-permissions.request_submitted': 'linux.xdgPortal.request',
    'fs-permissions.permission_granted': 'linux.xdgPortal.granted',
    'fs-permissions.permission_revoked': 'linux.xdgPortal.revoked',
    'fs-permissions.audit_logged': 'linux.xdgPortal.audit.log',
    // v0.2 Notification — Linux = libnotify (Notify OSD)
    'notification.scheduled': 'linux.libnotify.schedule',
    'notification.displayed': 'linux.libnotify.show',
    'notification.action_invoked': 'linux.libnotify.action-invoked',
    'notification.dismissed': 'linux.libnotify.closed',
    // v0.2 Menu-bar — Linux = GtkMenuBar / Global menu (Ayatana)
    'menu-bar.built': 'linux.gtk.menubar.new',
    'menu-bar.item_appended': 'linux.gtk.menu.append',
    'menu-bar.item_clicked': 'linux.gtk.menu.activate',
    'menu-bar.destroyed': 'linux.gtk.menubar.destroy',
    // v0.2 Tray-icon — Linux = StatusNotifierItem (KDE/GNOME)
    'tray-icon.created': 'linux.statusNotifierItem.Register',
    'tray-icon.tooltip_updated': 'linux.statusNotifierItem.SetToolTip',
    'tray-icon.clicked': 'linux.statusNotifierItem.Activate',
    'tray-icon.removed': 'linux.statusNotifierItem.Unregister',
  },
};

export function providerEventName(target: DesktopTarget, neutral: NeutralEventName): string {
  return dialect[target][neutral] ?? neutral;
}
