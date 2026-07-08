export {
  providerEventName,
  type AxisStep,
  type DesktopAxis,
  type DesktopTarget,
  type NeutralEventName,
} from './types.js';

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

export {
  DESKTOP_AXIS_TO_EVENTS,
  collectFidelityCoverage,
  type FidelityCoverage,
  type FidelityRow,
} from './fidelity.js';
