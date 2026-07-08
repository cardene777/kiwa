import { describe, expect, it } from 'vitest';
import {
  runElectronAxis,
  runFullDesktopWorkflow,
  runTauriAxis,
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

  it('runFullDesktopWorkflow emits 9 results (3 axis × 3 target)', () => {
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
