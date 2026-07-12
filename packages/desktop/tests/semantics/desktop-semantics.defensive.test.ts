import { describe, expect, it } from 'vitest';
import {
  requestScreenRecordingPermission,
  startScreenRecording,
  captureScreenChunk,
  stopScreenRecording,
} from '../../src/semantics/screen-recording.js';
import {
  startAutoUpdaterCheck,
  recordUpdateDownloaded,
  applyDownloadedUpdate,
  scheduleRelaunch,
} from '../../src/semantics/auto-updater.js';
import {
  requestFsPermission,
  grantFsPermission,
  revokeFsPermission,
  logFsPermissionAudit,
} from '../../src/semantics/fs-permissions.js';
import {
  openClipboard,
  writeClipboard,
  readClipboard,
  notifyClipboardChange,
  clearClipboard,
} from '../../src/semantics/clipboard.js';
import {
  createGlobalShortcutSession,
  registerGlobalShortcut,
  triggerGlobalShortcut,
  unregisterGlobalShortcut,
  clearAllGlobalShortcuts,
} from '../../src/semantics/global-shortcut.js';
import {
  scheduleNotification,
  displayNotification,
  invokeNotificationAction,
  dismissNotification,
} from '../../src/semantics/notification.js';
import { providerEventName } from '../../src/semantics/types.js';

describe('screen-recording defensive branches', () => {
  it('startScreenRecording throws when state !== permission-requested', () => {
    const session = requestScreenRecordingPermission({
      target: 'macos',
      sessionId: 'sess-1',
      displayId: 'display-1',
    });
    startScreenRecording(session, true);
    expect(() => startScreenRecording(session, true)).toThrow(/permission not requested/);
  });

  it('captureScreenChunk throws with negative bytes', () => {
    const session = requestScreenRecordingPermission({
      target: 'macos',
      sessionId: 'sess-2',
      displayId: 'display-2',
    });
    startScreenRecording(session, true);
    expect(() => captureScreenChunk(session, -1)).toThrow(/non-negative/);
  });

  it('stopScreenRecording throws when idle or permission-requested', () => {
    const session = requestScreenRecordingPermission({
      target: 'macos',
      sessionId: 'sess-3',
      displayId: 'display-3',
    });
    expect(() => stopScreenRecording(session)).toThrow(/not started/);
  });

  it('stopScreenRecording throws when already stopped', () => {
    const session = requestScreenRecordingPermission({
      target: 'macos',
      sessionId: 'sess-4',
      displayId: 'display-4',
    });
    startScreenRecording(session, true);
    captureScreenChunk(session, 100);
    stopScreenRecording(session);
    expect(() => stopScreenRecording(session)).toThrow(/already stopped/);
  });
});

describe('auto-updater defensive branches', () => {
  it('recordUpdateDownloaded throws when idle', () => {
    const idleSession = startAutoUpdaterCheck({ target: 'macos', channel: 'stable' });
    idleSession.state = 'idle';
    expect(() => recordUpdateDownloaded(idleSession, { version: '1.0.0', bytes: 100 })).toThrow(
      /check not started/,
    );
  });

  it('recordUpdateDownloaded throws with empty version', () => {
    const session = startAutoUpdaterCheck({ target: 'macos', channel: 'stable' });
    expect(() => recordUpdateDownloaded(session, { version: '', bytes: 100 })).toThrow(
      /version must not be empty/,
    );
  });

  it('recordUpdateDownloaded throws with negative bytes', () => {
    const session = startAutoUpdaterCheck({ target: 'macos', channel: 'stable' });
    expect(() => recordUpdateDownloaded(session, { version: '1.0.0', bytes: -1 })).toThrow(
      /non-negative/,
    );
  });

  it('applyDownloadedUpdate throws when state !== update-downloaded', () => {
    const session = startAutoUpdaterCheck({ target: 'macos', channel: 'stable' });
    expect(() => applyDownloadedUpdate(session)).toThrow(/update not downloaded/);
  });

  it('scheduleRelaunch throws when state !== update-applied', () => {
    const session = startAutoUpdaterCheck({ target: 'macos', channel: 'stable' });
    expect(() => scheduleRelaunch(session, 1000)).toThrow(/update not applied/);
  });

  it('scheduleRelaunch throws with negative delayMs', () => {
    const session = startAutoUpdaterCheck({ target: 'macos', channel: 'stable' });
    recordUpdateDownloaded(session, { version: '1.0.0', bytes: 100 });
    applyDownloadedUpdate(session);
    expect(() => scheduleRelaunch(session, -1)).toThrow(/non-negative/);
  });

  it('applyDownloadedUpdate keeps latestVersion when null', () => {
    const session = startAutoUpdaterCheck({ target: 'macos', channel: 'stable' });
    recordUpdateDownloaded(session, { version: '1.0.0', bytes: 100 });
    const step = applyDownloadedUpdate(session);
    expect(step.metadata.version).toBe('1.0.0');
  });

  it('applyDownloadedUpdate falls back to empty version when latestVersion null', () => {
    const session = startAutoUpdaterCheck({ target: 'macos', channel: 'stable' });
    recordUpdateDownloaded(session, { version: '1.0.0', bytes: 100 });
    session.latestVersion = null;
    const step = applyDownloadedUpdate(session);
    expect(step.metadata.version).toBe('');
  });

  it('scheduleRelaunch falls back to empty version when latestVersion null', () => {
    const session = startAutoUpdaterCheck({ target: 'macos', channel: 'stable' });
    recordUpdateDownloaded(session, { version: '1.0.0', bytes: 100 });
    applyDownloadedUpdate(session);
    session.latestVersion = null;
    const step = scheduleRelaunch(session, 500);
    expect(step.metadata.version).toBe('');
  });
});

describe('fs-permissions defensive branches', () => {
  it('requestFsPermission throws with empty path', () => {
    expect(() => requestFsPermission({ target: 'macos', path: '', scope: 'read' })).toThrow(
      /path must not be empty/,
    );
  });

  it('grantFsPermission throws when idle', () => {
    const session = requestFsPermission({ target: 'macos', path: '/tmp', scope: 'read' });
    session.state = 'idle';
    expect(() => grantFsPermission(session, 'read')).toThrow(/no request pending/);
  });

  it('grantFsPermission does not duplicate already-granted scope', () => {
    const session = requestFsPermission({ target: 'macos', path: '/tmp', scope: 'read' });
    grantFsPermission(session, 'read');
    grantFsPermission(session, 'read');
    expect(session.grantedScopes).toEqual(['read']);
  });

  it('revokeFsPermission throws when scope not granted', () => {
    const session = requestFsPermission({ target: 'macos', path: '/tmp', scope: 'read' });
    grantFsPermission(session, 'read');
    expect(() => revokeFsPermission(session, 'write')).toThrow(/not granted/);
  });

  it('logFsPermissionAudit throws with empty reason', () => {
    const session = requestFsPermission({ target: 'macos', path: '/tmp', scope: 'read' });
    expect(() => logFsPermissionAudit(session, '')).toThrow(/reason must not be empty/);
  });
});

describe('clipboard defensive branches', () => {
  it('openClipboard throws with empty clipboardId', () => {
    expect(() => openClipboard({ target: 'macos', clipboardId: '' })).toThrow(
      /clipboardId must not be empty/,
    );
  });

  it('readClipboard throws when contents null', () => {
    const session = openClipboard({ target: 'macos', clipboardId: 'clip-1' });
    expect(() => readClipboard(session)).toThrow(/empty/);
  });

  it('notifyClipboardChange throws with empty externalContents', () => {
    const session = openClipboard({ target: 'macos', clipboardId: 'clip-1' });
    writeClipboard(session, { contents: 'x', format: 'text' });
    expect(() => notifyClipboardChange(session, '')).toThrow();
  });

  it('clearClipboard second-call throws or is idempotent guard', () => {
    const session = openClipboard({ target: 'macos', clipboardId: 'clip-1' });
    writeClipboard(session, { contents: 'x', format: 'text' });
    clearClipboard(session);
    expect(() => clearClipboard(session)).toThrow();
  });

  it('readClipboard emits contentLength using contents length when format missing', () => {
    const session = openClipboard({ target: 'macos', clipboardId: 'clip-1' });
    writeClipboard(session, { contents: 'hello', format: 'text' });
    const step = readClipboard(session);
    expect(step.metadata.contentLength).toBe(5);
  });

  it('readClipboard falls back to empty format when format null', () => {
    const session = openClipboard({ target: 'macos', clipboardId: 'clip-1' });
    writeClipboard(session, { contents: 'hi', format: 'text' });
    session.format = null;
    const step = readClipboard(session);
    expect(step.metadata.format).toBe('');
  });
});

describe('global-shortcut defensive branches', () => {
  it('createGlobalShortcutSession throws with empty namespace', () => {
    expect(() => createGlobalShortcutSession({ target: 'macos', namespace: '' })).toThrow(
      /namespace must not be empty/,
    );
  });

  it('registerGlobalShortcut throws when session already all-cleared', () => {
    const session = createGlobalShortcutSession({ target: 'macos', namespace: 'ns' });
    registerGlobalShortcut(session, 'Ctrl+A');
    clearAllGlobalShortcuts(session);
    expect(() => registerGlobalShortcut(session, 'Ctrl+B')).toThrow(/session cleared/);
  });

  it('registerGlobalShortcut throws with empty accelerator', () => {
    const session = createGlobalShortcutSession({ target: 'macos', namespace: 'ns' });
    expect(() => registerGlobalShortcut(session, '')).toThrow(/accelerator must not be empty/);
  });

  it('registerGlobalShortcut throws when accelerator already registered', () => {
    const session = createGlobalShortcutSession({ target: 'macos', namespace: 'ns' });
    registerGlobalShortcut(session, 'Ctrl+A');
    expect(() => registerGlobalShortcut(session, 'Ctrl+A')).toThrow(/already registered/);
  });

  it('triggerGlobalShortcut throws when accelerator not registered', () => {
    const session = createGlobalShortcutSession({ target: 'macos', namespace: 'ns' });
    expect(() => triggerGlobalShortcut(session, 'Ctrl+Shift+X')).toThrow(/not registered/);
  });

  it('unregisterGlobalShortcut throws when accelerator not registered', () => {
    const session = createGlobalShortcutSession({ target: 'macos', namespace: 'ns' });
    expect(() => unregisterGlobalShortcut(session, 'Ctrl+Shift+X')).toThrow();
  });

  it('triggerGlobalShortcut increments count from initial 0', () => {
    const session = createGlobalShortcutSession({ target: 'macos', namespace: 'ns' });
    registerGlobalShortcut(session, 'Ctrl+A');
    triggerGlobalShortcut(session, 'Ctrl+A');
    expect(session.triggerCounts['Ctrl+A']).toBe(1);
  });

  it('triggerGlobalShortcut initializes count when triggerCounts entry undefined', () => {
    const session = createGlobalShortcutSession({ target: 'macos', namespace: 'ns' });
    session.registered.push('Ctrl+Alt+X');
    delete session.triggerCounts['Ctrl+Alt+X'];
    triggerGlobalShortcut(session, 'Ctrl+Alt+X');
    expect(session.triggerCounts['Ctrl+Alt+X']).toBe(1);
  });
});

describe('notification defensive branches', () => {
  it('displayNotification throws when state !== scheduled', () => {
    const session = scheduleNotification({
      target: 'macos',
      notificationId: 'n-1',
      title: 't',
      scheduledAtMs:1000,
    });
    displayNotification(session, 2000);
    expect(() => displayNotification(session, 3000)).toThrow(/not scheduled/);
  });

  it('displayNotification throws when displayedAtMs < scheduledAtMs', () => {
    const session = scheduleNotification({
      target: 'macos',
      notificationId: 'n-1',
      title: 't',
      scheduledAtMs:5000,
    });
    expect(() => displayNotification(session, 1000)).toThrow(/>= scheduledAtMs/);
  });

  it('invokeNotificationAction / dismissNotification throw on invalid state', () => {
    const session = scheduleNotification({
      target: 'macos',
      notificationId: 'n-1',
      title: 't',
      scheduledAtMs:1000,
    });
    expect(() => invokeNotificationAction(session, 'accept')).toThrow();
    expect(() => dismissNotification(session)).toThrow();
  });
});

describe('types dialect defensive fallback', () => {
  it('providerEventName falls back to neutral when target has no mapping', () => {
    const result = providerEventName('macos', 'unknown.event' as never);
    expect(result).toBe('unknown.event');
  });

  it('providerEventName returns dialect value when mapping exists', () => {
    const result = providerEventName('macos', 'clipboard.written');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
