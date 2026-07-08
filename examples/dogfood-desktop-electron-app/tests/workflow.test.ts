import { describe, expect, it } from 'vitest';
import {
  runAutoUpdaterAxis,
  runClipboardAxis,
  runDarkModeAxis,
  runElectronAxis,
  runFsPermissionsAxis,
  runFullDesktopWorkflow,
  runFullDesktopWorkflowV02,
  runFullDesktopWorkflowV03,
  runGlobalShortcutAxis,
  runMenuBarAxis,
  runNotificationAxis,
  runScreenRecordingAxis,
  runTauriAxis,
  runTrayIconAxis,
  runWebviewAxis,
} from '../src/workflow.js';

describe('Desktop 3 axis × 3 target workflow (v1.56-2、 pair 第 14 新規 base pair 導入)', () => {
  it('electron axis completes on macos/windows/linux', () => {
    const results = runElectronAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
      expect(r.eventCount).toBeGreaterThan(0);
    }
  });

  it('tauri axis completes on all 3 targets', () => {
    const results = runTauriAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
    }
  });

  it('webview axis asserts isolation on all 3 targets', () => {
    const results = runWebviewAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
    }
  });

  it('runFullDesktopWorkflow emits 9 results (3 axis × 3 target、 v0.1 互換)', () => {
    const results = runFullDesktopWorkflow();
    expect(results).toHaveLength(9);
    for (const r of results) {
      expect(r.completed).toBe(true);
    }
  });

  it('all 3 targets appear in electron axis', () => {
    const targets = runElectronAxis().map((r) => r.target).sort();
    expect(targets).toEqual(['linux', 'macos', 'windows']);
  });

  it('all 3 targets appear in tauri axis', () => {
    const targets = runTauriAxis().map((r) => r.target).sort();
    expect(targets).toEqual(['linux', 'macos', 'windows']);
  });

  it('all 3 targets appear in webview axis', () => {
    const targets = runWebviewAxis().map((r) => r.target).sort();
    expect(targets).toEqual(['linux', 'macos', 'windows']);
  });

  it('unique axes in workflow', () => {
    const results = runFullDesktopWorkflow();
    const axes = new Set(results.map((r) => r.axis));
    expect(axes.size).toBe(3);
  });

  it('electron event count >= 4 (start + window + ipc + quit)', () => {
    for (const r of runElectronAxis()) {
      expect(r.eventCount).toBeGreaterThanOrEqual(4);
    }
  });

  it('tauri event count >= 4', () => {
    for (const r of runTauriAxis()) {
      expect(r.eventCount).toBeGreaterThanOrEqual(4);
    }
  });

  it('webview event count >= 4', () => {
    for (const r of runWebviewAxis()) {
      expect(r.eventCount).toBeGreaterThanOrEqual(4);
    }
  });
});

describe('Desktop v0.2 advanced 5 axis × 3 target workflow (v1.57-2)', () => {
  it('auto-updater axis completes on all 3 targets', () => {
    const results = runAutoUpdaterAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
      expect(r.axis).toBe('auto-updater');
      expect(r.eventCount).toBeGreaterThanOrEqual(4);
    }
  });

  it('fs-permissions axis audits on all 3 targets', () => {
    const results = runFsPermissionsAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
      expect(r.axis).toBe('fs-permissions');
      expect(r.eventCount).toBeGreaterThanOrEqual(5);
    }
  });

  it('notification axis dismisses on all 3 targets', () => {
    const results = runNotificationAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
      expect(r.axis).toBe('notification');
      expect(r.eventCount).toBeGreaterThanOrEqual(4);
    }
  });

  it('menu-bar axis destroys on all 3 targets', () => {
    const results = runMenuBarAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
      expect(r.axis).toBe('menu-bar');
      expect(r.eventCount).toBeGreaterThanOrEqual(4);
    }
  });

  it('tray-icon axis removes on all 3 targets', () => {
    const results = runTrayIconAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
      expect(r.axis).toBe('tray-icon');
      expect(r.eventCount).toBeGreaterThanOrEqual(4);
    }
  });

  it('all 3 targets appear in each v0.2 axis', () => {
    for (const runner of [
      runAutoUpdaterAxis,
      runFsPermissionsAxis,
      runNotificationAxis,
      runMenuBarAxis,
      runTrayIconAxis,
    ]) {
      const targets = runner().map((r) => r.target).sort();
      expect(targets).toEqual(['linux', 'macos', 'windows']);
    }
  });

  it('runFullDesktopWorkflowV02 emits 24 results (8 axis × 3 target)', () => {
    const results = runFullDesktopWorkflowV02();
    expect(results).toHaveLength(24);
    for (const r of results) {
      expect(r.completed).toBe(true);
    }
  });

  it('v02 workflow contains all 8 unique axes', () => {
    const results = runFullDesktopWorkflowV02();
    const axes = new Set(results.map((r) => r.axis));
    expect(axes.size).toBe(8);
    expect(axes).toEqual(
      new Set([
        'electron',
        'tauri',
        'webview',
        'auto-updater',
        'fs-permissions',
        'notification',
        'menu-bar',
        'tray-icon',
      ]),
    );
  });

  it('v01 workflow (3 axis) is subset of v02 workflow (8 axis)', () => {
    const v01Axes = new Set(runFullDesktopWorkflow().map((r) => r.axis));
    const v02Axes = new Set(runFullDesktopWorkflowV02().map((r) => r.axis));
    for (const axis of v01Axes) {
      expect(v02Axes.has(axis)).toBe(true);
    }
  });

  it('v02 workflow adds 15 new results (5 v0.2 axis × 3 target)', () => {
    const total = runFullDesktopWorkflowV02().length;
    const v01Total = runFullDesktopWorkflow().length;
    expect(total - v01Total).toBe(15);
  });
});

describe('Desktop v0.3 advanced III 4 axis × 3 target workflow (v1.58-2)', () => {
  it('screen-recording axis stops on all 3 targets', () => {
    const results = runScreenRecordingAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
      expect(r.axis).toBe('screen-recording');
      expect(r.eventCount).toBeGreaterThanOrEqual(5);
    }
  });

  it('global-shortcut axis all-clears on all 3 targets', () => {
    const results = runGlobalShortcutAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
      expect(r.axis).toBe('global-shortcut');
      expect(r.eventCount).toBeGreaterThanOrEqual(5);
    }
  });

  it('clipboard axis clears on all 3 targets', () => {
    const results = runClipboardAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
      expect(r.axis).toBe('clipboard');
      expect(r.eventCount).toBeGreaterThanOrEqual(4);
    }
  });

  it('dark-mode axis unsubscribes on all 3 targets', () => {
    const results = runDarkModeAxis();
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.completed).toBe(true);
      expect(r.axis).toBe('dark-mode');
      expect(r.eventCount).toBeGreaterThanOrEqual(4);
    }
  });

  it('all 3 targets appear in each v0.3 axis', () => {
    for (const runner of [
      runScreenRecordingAxis,
      runGlobalShortcutAxis,
      runClipboardAxis,
      runDarkModeAxis,
    ]) {
      const targets = runner().map((r) => r.target).sort();
      expect(targets).toEqual(['linux', 'macos', 'windows']);
    }
  });

  it('runFullDesktopWorkflowV03 emits 36 results (12 axis × 3 target)', () => {
    const results = runFullDesktopWorkflowV03();
    expect(results).toHaveLength(36);
    for (const r of results) {
      expect(r.completed).toBe(true);
    }
  });

  it('v03 workflow contains all 12 unique axes', () => {
    const results = runFullDesktopWorkflowV03();
    const axes = new Set(results.map((r) => r.axis));
    expect(axes.size).toBe(12);
    expect(axes).toEqual(
      new Set([
        'electron',
        'tauri',
        'webview',
        'auto-updater',
        'fs-permissions',
        'notification',
        'menu-bar',
        'tray-icon',
        'screen-recording',
        'global-shortcut',
        'clipboard',
        'dark-mode',
      ]),
    );
  });

  it('v02 workflow (8 axis) is subset of v03 workflow (12 axis)', () => {
    const v02Axes = new Set(runFullDesktopWorkflowV02().map((r) => r.axis));
    const v03Axes = new Set(runFullDesktopWorkflowV03().map((r) => r.axis));
    for (const axis of v02Axes) {
      expect(v03Axes.has(axis)).toBe(true);
    }
  });

  it('v03 workflow adds 12 new results (4 v0.3 axis × 3 target)', () => {
    const total = runFullDesktopWorkflowV03().length;
    const v02Total = runFullDesktopWorkflowV02().length;
    expect(total - v02Total).toBe(12);
  });
});
