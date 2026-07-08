/**
 * v1.58-3 docs 補強 — tutorial 118 code snippet 検証。
 * 36 milestone 連続 snippet validation streak = v1.23 → v1.58。 kiwa 史上最長記録更新継続。
 * systematic pattern 33 度目適用 (v1.57 の 32 度目 = desktop v0.2 5 axis uniform を継承)。
 */
import { describe, expect, it } from 'vitest';
import {
  captureScreenChunk,
  clearAllGlobalShortcuts,
  clearClipboard,
  createGlobalShortcutSession,
  notifyClipboardChange,
  notifyThemeChange,
  openClipboard,
  readClipboard,
  recordUserPreference,
  registerGlobalShortcut,
  requestScreenRecordingPermission,
  startScreenRecording,
  stopScreenRecording,
  subscribeDarkMode,
  triggerGlobalShortcut,
  unregisterGlobalShortcut,
  unsubscribeDarkMode,
  writeClipboard,
} from '../src/index.js';

describe('tutorial 118 — Screen-recording snippet', () => {
  it('permission → start → chunk → stop', () => {
    const s = requestScreenRecordingPermission({
      target: 'macos',
      sessionId: 'rec-1',
      displayId: 'display-primary',
    });
    startScreenRecording(s, true);
    captureScreenChunk(s, 1_048_576);
    captureScreenChunk(s, 2_097_152);
    stopScreenRecording(s);
    expect(s.state).toBe('stopped');
    expect(s.chunksCaptured).toBe(2);
    expect(s.totalBytes).toBe(3_145_728);
  });
});

describe('tutorial 118 — Global-shortcut snippet', () => {
  it('register → trigger → unregister → clear', () => {
    const s = createGlobalShortcutSession({ target: 'windows', namespace: 'app' });
    registerGlobalShortcut(s, 'CmdOrCtrl+Shift+P');
    registerGlobalShortcut(s, 'F1');
    triggerGlobalShortcut(s, 'CmdOrCtrl+Shift+P');
    unregisterGlobalShortcut(s, 'F1');
    clearAllGlobalShortcuts(s);
    expect(s.state).toBe('all-cleared');
    expect(s.registered).toEqual([]);
  });
});

describe('tutorial 118 — Clipboard snippet', () => {
  it('write → read → change → clear', () => {
    const s = openClipboard({ target: 'linux', clipboardId: 'cb-1' });
    writeClipboard(s, { contents: 'hello', format: 'text' });
    readClipboard(s);
    notifyClipboardChange(s, 'external value');
    clearClipboard(s);
    expect(s.state).toBe('cleared');
    expect(s.changeCount).toBe(2);
  });
});

describe('tutorial 118 — Dark-mode snippet', () => {
  it('subscribe → theme-change → user-preferred → unsubscribe', () => {
    const s = subscribeDarkMode({
      target: 'macos',
      observerId: 'obs-1',
      initialTheme: 'light',
    });
    notifyThemeChange(s, 'dark');
    recordUserPreference(s, 'dark');
    unsubscribeDarkMode(s);
    expect(s.state).toBe('unsubscribed');
    expect(s.currentTheme).toBe('dark');
  });
});
