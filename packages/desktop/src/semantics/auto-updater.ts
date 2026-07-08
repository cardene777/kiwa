import { providerEventName, type AxisStep, type DesktopTarget } from './types.js';

/**
 * Auto-updater axis (v0.2) — check + download + apply + relaunch の 4 step 状態遷移。
 * Squirrel.Mac / Squirrel.Windows / AppImage の 3 target を uniform state machine で扱う。
 */
export type AutoUpdaterState =
  | 'idle'
  | 'check-started'
  | 'update-downloaded'
  | 'update-applied'
  | 'relaunch-scheduled';

export interface AutoUpdaterSession {
  target: DesktopTarget;
  channel: string;
  state: AutoUpdaterState;
  latestVersion: string | null;
  downloadedBytes: number;
  applied: boolean;
  relaunchDelayMs: number;
  history: AxisStep<AutoUpdaterState>[];
}

function emit(
  session: AutoUpdaterSession,
  neutralEvent:
    | 'auto-updater.check_started'
    | 'auto-updater.update_downloaded'
    | 'auto-updater.update_applied'
    | 'auto-updater.relaunch_scheduled',
  metadata: Record<string, string | number | boolean>,
): AxisStep<AutoUpdaterState> {
  const step: AxisStep<AutoUpdaterState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    metadata: { channel: session.channel, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function startAutoUpdaterCheck(input: {
  target: DesktopTarget;
  channel: string;
}): AutoUpdaterSession {
  if (input.channel.length === 0) throw new Error('startAutoUpdaterCheck: channel must not be empty');
  const session: AutoUpdaterSession = {
    target: input.target,
    channel: input.channel,
    state: 'check-started',
    latestVersion: null,
    downloadedBytes: 0,
    applied: false,
    relaunchDelayMs: 0,
    history: [],
  };
  emit(session, 'auto-updater.check_started', { target: input.target });
  return session;
}

export function recordUpdateDownloaded(
  session: AutoUpdaterSession,
  input: { version: string; bytes: number },
): AxisStep<AutoUpdaterState> {
  if (session.state === 'idle') throw new Error('recordUpdateDownloaded: check not started');
  if (input.version.length === 0) throw new Error('recordUpdateDownloaded: version must not be empty');
  if (input.bytes < 0) throw new Error('recordUpdateDownloaded: bytes must be non-negative');
  session.latestVersion = input.version;
  session.downloadedBytes = input.bytes;
  session.state = 'update-downloaded';
  return emit(session, 'auto-updater.update_downloaded', {
    version: input.version,
    bytes: input.bytes,
  });
}

export function applyDownloadedUpdate(session: AutoUpdaterSession): AxisStep<AutoUpdaterState> {
  if (session.state !== 'update-downloaded') {
    throw new Error('applyDownloadedUpdate: update not downloaded');
  }
  session.applied = true;
  session.state = 'update-applied';
  return emit(session, 'auto-updater.update_applied', {
    version: session.latestVersion ?? '',
    bytes: session.downloadedBytes,
  });
}

export function scheduleRelaunch(
  session: AutoUpdaterSession,
  delayMs: number,
): AxisStep<AutoUpdaterState> {
  if (session.state !== 'update-applied') {
    throw new Error('scheduleRelaunch: update not applied');
  }
  if (delayMs < 0) throw new Error('scheduleRelaunch: delayMs must be non-negative');
  session.relaunchDelayMs = delayMs;
  session.state = 'relaunch-scheduled';
  return emit(session, 'auto-updater.relaunch_scheduled', {
    delayMs,
    version: session.latestVersion ?? '',
  });
}
