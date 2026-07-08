import { providerEventName, type AxisStep, type DesktopTarget } from './types.js';

/**
 * Screen-recording axis (v0.3) — permission + start + chunk + stop の 4 step 遷移。
 * macOS ScreenCaptureKit + Windows Windows.Graphics.Capture + Linux xdg-portal ScreenCast を uniform 扱い。
 */
export type ScreenRecordingState =
  | 'idle'
  | 'permission-requested'
  | 'recording'
  | 'chunk-captured'
  | 'stopped';

export interface ScreenRecordingSession {
  target: DesktopTarget;
  sessionId: string;
  displayId: string;
  state: ScreenRecordingState;
  permissionGranted: boolean;
  chunksCaptured: number;
  totalBytes: number;
  history: AxisStep<ScreenRecordingState>[];
}

function emit(
  session: ScreenRecordingSession,
  neutralEvent:
    | 'screen-recording.permission_requested'
    | 'screen-recording.started'
    | 'screen-recording.chunk_captured'
    | 'screen-recording.stopped',
  metadata: Record<string, string | number | boolean>,
): AxisStep<ScreenRecordingState> {
  const step: AxisStep<ScreenRecordingState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    metadata: { sessionId: session.sessionId, displayId: session.displayId, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function requestScreenRecordingPermission(input: {
  target: DesktopTarget;
  sessionId: string;
  displayId: string;
}): ScreenRecordingSession {
  if (input.sessionId.length === 0) throw new Error('requestScreenRecordingPermission: sessionId must not be empty');
  if (input.displayId.length === 0) throw new Error('requestScreenRecordingPermission: displayId must not be empty');
  const session: ScreenRecordingSession = {
    target: input.target,
    sessionId: input.sessionId,
    displayId: input.displayId,
    state: 'permission-requested',
    permissionGranted: false,
    chunksCaptured: 0,
    totalBytes: 0,
    history: [],
  };
  emit(session, 'screen-recording.permission_requested', { target: input.target });
  return session;
}

export function startScreenRecording(
  session: ScreenRecordingSession,
  granted: boolean,
): AxisStep<ScreenRecordingState> {
  if (session.state !== 'permission-requested') {
    throw new Error('startScreenRecording: permission not requested');
  }
  if (!granted) throw new Error('startScreenRecording: permission denied');
  session.permissionGranted = true;
  session.state = 'recording';
  return emit(session, 'screen-recording.started', { permissionGranted: granted });
}

export function captureScreenChunk(
  session: ScreenRecordingSession,
  chunkBytes: number,
): AxisStep<ScreenRecordingState> {
  if (session.state !== 'recording' && session.state !== 'chunk-captured') {
    throw new Error('captureScreenChunk: not recording');
  }
  if (chunkBytes < 0) throw new Error('captureScreenChunk: chunkBytes must be non-negative');
  session.chunksCaptured += 1;
  session.totalBytes += chunkBytes;
  session.state = 'chunk-captured';
  return emit(session, 'screen-recording.chunk_captured', {
    chunkBytes,
    chunkCount: session.chunksCaptured,
    totalBytes: session.totalBytes,
  });
}

export function stopScreenRecording(session: ScreenRecordingSession): AxisStep<ScreenRecordingState> {
  if (session.state === 'idle' || session.state === 'permission-requested') {
    throw new Error('stopScreenRecording: recording not started');
  }
  if (session.state === 'stopped') throw new Error('stopScreenRecording: already stopped');
  session.state = 'stopped';
  return emit(session, 'screen-recording.stopped', {
    chunkCount: session.chunksCaptured,
    totalBytes: session.totalBytes,
  });
}
