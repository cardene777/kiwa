import {
  assertContextIsolation,
  bindContextBridge,
  closeTauriWindow,
  createBrowserWindow,
  dispatchIpcMessage,
  emitTauriEvent,
  invokeTauriCommand,
  loadPreloadScript,
  postWebviewMessage,
  quitElectronApp,
  registerTauriCommand,
  startElectronApp,
  startTauriApp,
  type DesktopTarget,
} from '@kiwa-test/desktop';

export interface WorkflowResult {
  target: DesktopTarget;
  axis: string;
  eventCount: number;
  completed: boolean;
}

const targets: DesktopTarget[] = ['macos', 'windows', 'linux'];

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

export function runFullDesktopWorkflow(): WorkflowResult[] {
  return [
    ...runElectronAxis(),
    ...runTauriAxis(),
    ...runWebviewAxis(),
  ];
}
