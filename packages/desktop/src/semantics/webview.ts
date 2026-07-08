import { providerEventName, type AxisStep, type DesktopTarget } from './types.js';

/**
 * Webview axis — preload script + contextBridge.exposeInMainWorld + postMessage + isolation assert。
 */
export type WebviewState = 'idle' | 'preload-loaded' | 'bridge-bound' | 'message-posted' | 'isolation-asserted';

export interface WebviewSession {
  target: DesktopTarget;
  webviewId: string;
  state: WebviewState;
  exposedApis: string[];
  postedMessages: number;
  contextIsolated: boolean;
  history: AxisStep<WebviewState>[];
}

function emit(
  session: WebviewSession,
  neutralEvent:
    | 'webview.preload_loaded'
    | 'webview.bridge_bound'
    | 'webview.message_posted'
    | 'webview.isolation_asserted',
  metadata: Record<string, string | number | boolean>,
): AxisStep<WebviewState> {
  const step: AxisStep<WebviewState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    metadata: { webviewId: session.webviewId, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function loadPreloadScript(input: { target: DesktopTarget; webviewId: string }): WebviewSession {
  if (input.webviewId.length === 0) throw new Error('loadPreloadScript: webviewId must not be empty');
  const session: WebviewSession = {
    target: input.target,
    webviewId: input.webviewId,
    state: 'preload-loaded',
    exposedApis: [],
    postedMessages: 0,
    contextIsolated: false,
    history: [],
  };
  emit(session, 'webview.preload_loaded', { target: input.target });
  return session;
}

export function bindContextBridge(session: WebviewSession, apiName: string): AxisStep<WebviewState> {
  if (session.state === 'idle') throw new Error('bindContextBridge: preload not loaded');
  if (apiName.length === 0) throw new Error('bindContextBridge: apiName must not be empty');
  session.exposedApis.push(apiName);
  session.state = 'bridge-bound';
  return emit(session, 'webview.bridge_bound', {
    apiName,
    apiCount: session.exposedApis.length,
  });
}

export function postWebviewMessage(
  session: WebviewSession,
  input: { channel: string; payload: string },
): AxisStep<WebviewState> {
  if (session.state === 'idle') throw new Error('postWebviewMessage: preload not loaded');
  if (input.channel.length === 0) throw new Error('postWebviewMessage: channel must not be empty');
  session.postedMessages += 1;
  session.state = 'message-posted';
  return emit(session, 'webview.message_posted', {
    channel: input.channel,
    payloadSize: input.payload.length,
    count: session.postedMessages,
  });
}

export function assertContextIsolation(session: WebviewSession, isolated: boolean): AxisStep<WebviewState> {
  session.contextIsolated = isolated;
  session.state = 'isolation-asserted';
  return emit(session, 'webview.isolation_asserted', {
    isolated,
    exposedApiCount: session.exposedApis.length,
  });
}
