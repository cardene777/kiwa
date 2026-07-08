import { providerEventName, type AxisStep, type DesktopTarget } from './types.js';

/**
 * Electron axis — app.ready + BrowserWindow.create + ipcMain.on + app.quit の 4 step。
 */
export type ElectronState = 'idle' | 'app-ready' | 'window-created' | 'ipc-dispatched' | 'quit';

export interface ElectronSession {
  target: DesktopTarget;
  appId: string;
  state: ElectronState;
  windowIds: string[];
  ipcMessages: number;
  history: AxisStep<ElectronState>[];
}

function emit(
  session: ElectronSession,
  neutralEvent:
    | 'electron.app_ready'
    | 'electron.window_created'
    | 'electron.ipc_message_dispatched'
    | 'electron.app_quit',
  metadata: Record<string, string | number | boolean>,
): AxisStep<ElectronState> {
  const step: AxisStep<ElectronState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    metadata: { appId: session.appId, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function startElectronApp(input: { target: DesktopTarget; appId: string }): ElectronSession {
  if (input.appId.length === 0) throw new Error('startElectronApp: appId must not be empty');
  const session: ElectronSession = {
    target: input.target,
    appId: input.appId,
    state: 'app-ready',
    windowIds: [],
    ipcMessages: 0,
    history: [],
  };
  emit(session, 'electron.app_ready', { target: input.target });
  return session;
}

export function createBrowserWindow(session: ElectronSession, windowId: string): AxisStep<ElectronState> {
  if (session.state === 'quit') throw new Error('createBrowserWindow: app has quit');
  if (windowId.length === 0) throw new Error('createBrowserWindow: windowId must not be empty');
  session.windowIds.push(windowId);
  session.state = 'window-created';
  return emit(session, 'electron.window_created', {
    windowId,
    windowCount: session.windowIds.length,
  });
}

export function dispatchIpcMessage(
  session: ElectronSession,
  input: { channel: string; payload: string },
): AxisStep<ElectronState> {
  if (session.state === 'quit') throw new Error('dispatchIpcMessage: app has quit');
  if (input.channel.length === 0) throw new Error('dispatchIpcMessage: channel must not be empty');
  session.ipcMessages += 1;
  session.state = 'ipc-dispatched';
  return emit(session, 'electron.ipc_message_dispatched', {
    channel: input.channel,
    payloadSize: input.payload.length,
    count: session.ipcMessages,
  });
}

export function quitElectronApp(session: ElectronSession): AxisStep<ElectronState> {
  if (session.state === 'quit') throw new Error('quitElectronApp: already quit');
  session.state = 'quit';
  return emit(session, 'electron.app_quit', {
    windowCount: session.windowIds.length,
    ipcMessages: session.ipcMessages,
  });
}
