import { providerEventName, type AxisStep, type DesktopTarget } from './types.js';

/**
 * Clipboard axis (v0.3) — write + read + change + clear の 4 step 遷移。
 * macOS NSPasteboard + Windows OpenClipboard + Linux gtk_clipboard を uniform 扱い。
 */
export type ClipboardState = 'idle' | 'written' | 'read' | 'changed' | 'cleared';

export type ClipboardFormat = 'text' | 'html' | 'image' | 'file-list';

export interface ClipboardSession {
  target: DesktopTarget;
  clipboardId: string;
  state: ClipboardState;
  contents: string | null;
  format: ClipboardFormat | null;
  changeCount: number;
  history: AxisStep<ClipboardState>[];
}

function emit(
  session: ClipboardSession,
  neutralEvent:
    | 'clipboard.written'
    | 'clipboard.read'
    | 'clipboard.changed'
    | 'clipboard.cleared',
  metadata: Record<string, string | number | boolean>,
): AxisStep<ClipboardState> {
  const step: AxisStep<ClipboardState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    metadata: { clipboardId: session.clipboardId, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function openClipboard(input: {
  target: DesktopTarget;
  clipboardId: string;
}): ClipboardSession {
  if (input.clipboardId.length === 0) throw new Error('openClipboard: clipboardId must not be empty');
  return {
    target: input.target,
    clipboardId: input.clipboardId,
    state: 'idle',
    contents: null,
    format: null,
    changeCount: 0,
    history: [],
  };
}

export function writeClipboard(
  session: ClipboardSession,
  input: { contents: string; format: ClipboardFormat },
): AxisStep<ClipboardState> {
  if (input.contents.length === 0) throw new Error('writeClipboard: contents must not be empty');
  session.contents = input.contents;
  session.format = input.format;
  session.changeCount += 1;
  session.state = 'written';
  return emit(session, 'clipboard.written', {
    format: input.format,
    contentLength: input.contents.length,
    changeCount: session.changeCount,
  });
}

export function readClipboard(session: ClipboardSession): AxisStep<ClipboardState> {
  if (session.contents === null) throw new Error('readClipboard: clipboard empty');
  session.state = 'read';
  return emit(session, 'clipboard.read', {
    format: session.format ?? '',
    contentLength: session.contents.length,
  });
}

export function notifyClipboardChange(
  session: ClipboardSession,
  externalContents: string,
): AxisStep<ClipboardState> {
  if (externalContents.length === 0) throw new Error('notifyClipboardChange: externalContents must not be empty');
  session.contents = externalContents;
  session.changeCount += 1;
  session.state = 'changed';
  return emit(session, 'clipboard.changed', {
    contentLength: externalContents.length,
    changeCount: session.changeCount,
  });
}

export function clearClipboard(session: ClipboardSession): AxisStep<ClipboardState> {
  if (session.state === 'cleared') throw new Error('clearClipboard: already cleared');
  session.contents = null;
  session.format = null;
  session.state = 'cleared';
  return emit(session, 'clipboard.cleared', { changeCount: session.changeCount });
}
