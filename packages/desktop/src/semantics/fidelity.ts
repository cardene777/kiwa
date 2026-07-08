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
