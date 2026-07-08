import { describe, expect, it } from 'vitest';
import {
  runAutoUpdaterAxis,
  runElectronAxis,
  runFsPermissionsAxis,
  runFullDesktopWorkflow,
  runFullDesktopWorkflowV02,
  runMenuBarAxis,
  runNotificationAxis,
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
