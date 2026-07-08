import { providerEventName, type AxisStep, type DesktopTarget } from './types.js';

/**
 * Tray-icon axis (v0.2) — created + tooltip + click + removed の 4 step 遷移。
 * macOS NSStatusItem + Windows NotifyIcon + Linux StatusNotifierItem の 3 target を uniform 扱い。
 */
export type TrayIconState = 'idle' | 'created' | 'tooltip-updated' | 'clicked' | 'removed';

export interface TrayIconSession {
  target: DesktopTarget;
  trayId: string;
  iconPath: string;
  tooltip: string;
  state: TrayIconState;
  clickCount: number;
  removed: boolean;
  history: AxisStep<TrayIconState>[];
}

function emit(
  session: TrayIconSession,
  neutralEvent:
    | 'tray-icon.created'
    | 'tray-icon.tooltip_updated'
    | 'tray-icon.clicked'
    | 'tray-icon.removed',
  metadata: Record<string, string | number | boolean>,
): AxisStep<TrayIconState> {
  const step: AxisStep<TrayIconState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    metadata: { trayId: session.trayId, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function createTrayIcon(input: {
  target: DesktopTarget;
  trayId: string;
  iconPath: string;
}): TrayIconSession {
  if (input.trayId.length === 0) throw new Error('createTrayIcon: trayId must not be empty');
  if (input.iconPath.length === 0) throw new Error('createTrayIcon: iconPath must not be empty');
  const session: TrayIconSession = {
    target: input.target,
    trayId: input.trayId,
    iconPath: input.iconPath,
    tooltip: '',
    state: 'created',
    clickCount: 0,
    removed: false,
    history: [],
  };
  emit(session, 'tray-icon.created', {
    iconPath: input.iconPath,
    target: input.target,
  });
  return session;
}

export function updateTrayTooltip(
  session: TrayIconSession,
  tooltip: string,
): AxisStep<TrayIconState> {
  if (session.removed) throw new Error('updateTrayTooltip: tray removed');
  if (tooltip.length === 0) throw new Error('updateTrayTooltip: tooltip must not be empty');
  session.tooltip = tooltip;
  session.state = 'tooltip-updated';
  return emit(session, 'tray-icon.tooltip_updated', {
    tooltip,
    tooltipLength: tooltip.length,
  });
}

export function clickTrayIcon(session: TrayIconSession): AxisStep<TrayIconState> {
  if (session.removed) throw new Error('clickTrayIcon: tray removed');
  session.clickCount += 1;
  session.state = 'clicked';
  return emit(session, 'tray-icon.clicked', {
    clickCount: session.clickCount,
    tooltip: session.tooltip,
  });
}

export function removeTrayIcon(session: TrayIconSession): AxisStep<TrayIconState> {
  if (session.removed) throw new Error('removeTrayIcon: already removed');
  session.removed = true;
  session.state = 'removed';
  return emit(session, 'tray-icon.removed', {
    clickCount: session.clickCount,
    tooltip: session.tooltip,
  });
}
