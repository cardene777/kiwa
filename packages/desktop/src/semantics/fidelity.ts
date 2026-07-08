import { providerEventName, type DesktopAxis, type DesktopTarget, type NeutralEventName } from './types.js';

export interface FidelityRow {
  provider: DesktopTarget;
  axis: DesktopAxis;
  neutralEvents: NeutralEventName[];
  providerEvents: string[];
}

export interface FidelityCoverage {
  providers: DesktopTarget[];
  axes: DesktopAxis[];
  rows: FidelityRow[];
}

export const DESKTOP_AXIS_TO_EVENTS: Record<DesktopAxis, NeutralEventName[]> = {
  // v0.1
  electron: [
    'electron.app_ready',
    'electron.window_created',
    'electron.ipc_message_dispatched',
    'electron.app_quit',
  ],
  tauri: [
    'tauri.command_registered',
    'tauri.command_invoked',
    'tauri.event_emitted',
    'tauri.window_closed',
  ],
  webview: [
    'webview.preload_loaded',
    'webview.bridge_bound',
    'webview.message_posted',
    'webview.isolation_asserted',
  ],
  // v0.2
  'auto-updater': [
    'auto-updater.check_started',
    'auto-updater.update_downloaded',
    'auto-updater.update_applied',
    'auto-updater.relaunch_scheduled',
  ],
  'fs-permissions': [
    'fs-permissions.request_submitted',
    'fs-permissions.permission_granted',
    'fs-permissions.permission_revoked',
    'fs-permissions.audit_logged',
  ],
  notification: [
    'notification.scheduled',
    'notification.displayed',
    'notification.action_invoked',
    'notification.dismissed',
  ],
  'menu-bar': [
    'menu-bar.built',
    'menu-bar.item_appended',
    'menu-bar.item_clicked',
    'menu-bar.destroyed',
  ],
  'tray-icon': [
    'tray-icon.created',
    'tray-icon.tooltip_updated',
    'tray-icon.clicked',
    'tray-icon.removed',
  ],
  // v0.3
  'screen-recording': [
    'screen-recording.permission_requested',
    'screen-recording.started',
    'screen-recording.chunk_captured',
    'screen-recording.stopped',
  ],
  'global-shortcut': [
    'global-shortcut.registered',
    'global-shortcut.triggered',
    'global-shortcut.unregistered',
    'global-shortcut.all_cleared',
  ],
  clipboard: [
    'clipboard.written',
    'clipboard.read',
    'clipboard.changed',
    'clipboard.cleared',
  ],
  'dark-mode': [
    'dark-mode.subscribed',
    'dark-mode.theme_changed',
    'dark-mode.user_preferred',
    'dark-mode.unsubscribed',
  ],
};

export function collectFidelityCoverage(
  providers: DesktopTarget[] = ['macos', 'windows', 'linux'],
): FidelityCoverage {
  const axes = Object.keys(DESKTOP_AXIS_TO_EVENTS) as DesktopAxis[];
  const rows: FidelityRow[] = [];
  for (const provider of providers) {
    for (const axis of axes) {
      const neutralEvents = DESKTOP_AXIS_TO_EVENTS[axis];
      rows.push({
        provider,
        axis,
        neutralEvents,
        providerEvents: neutralEvents.map((event) => providerEventName(provider, event)),
      });
    }
  }
  return { providers, axes, rows };
}
