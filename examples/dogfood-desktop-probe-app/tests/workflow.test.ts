import { EventEmitter } from 'node:events';
import { describe, expect, it } from 'vitest';
import type { SpawnFn } from '@kiwa-test/desktop';
import {
  checkSkipForAxis,
  getSkipDecisionsForCurrentPlatform,
  probeAllCliCommands,
  runProbeAwareFidelityCheck,
} from '../src/workflow.js';

class DummyChild extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  kill(_signal?: NodeJS.Signals | number) {}
}

function makeSpawn(stdoutText: string, exitCode: number): SpawnFn {
  return ((_c: string, _a: readonly string[]) => {
    const child = new DummyChild();
    setTimeout(() => {
      if (stdoutText) child.stdout.emit('data', Buffer.from(stdoutText));
      child.emit('close', exitCode, null);
    }, 0);
    return child as unknown as ReturnType<SpawnFn>;
  }) as unknown as SpawnFn;
}

describe('dogfood-desktop-probe-app (v1.63-2、 native binding availability probe + skip 経路 pattern)', () => {
  it('probeAllCliCommands = 8 CLI 全て probe result 返却 (dummy spawn)', async () => {
    const spawnFn = makeSpawn('/usr/bin/dummy', 0);
    const results = await probeAllCliCommands(spawnFn);
    expect(results).toHaveLength(8);
    for (const r of results) {
      expect(r.available).toBe(true);
      expect(r.command).toBeDefined();
      expect(typeof r.durationMs).toBe('number');
    }
  });

  it('probeAllCliCommands で 未 install CLI = available=false', async () => {
    const spawnFn = makeSpawn('', 1);
    const results = await probeAllCliCommands(spawnFn);
    for (const r of results) {
      expect(r.available).toBe(false);
      expect(r.probePath).toBeNull();
    }
  });

  it('getSkipDecisionsForCurrentPlatform = 36 pair matrix', () => {
    const matrix = getSkipDecisionsForCurrentPlatform();
    expect(matrix).toHaveLength(36);
    // semantics-only axis (electron/tauri/webview/dark-mode) は skip=false
    const semanticsCount = matrix.filter((m) =>
      ['electron', 'tauri', 'webview', 'dark-mode'].includes(m.axis) && !m.skip,
    ).length;
    expect(semanticsCount).toBeGreaterThanOrEqual(4); // 現 platform 最低 4 axis × 1 target
  });

  it('runProbeAwareFidelityCheck = diffs + skippedPairs 両方返却', async () => {
    const { diffs, skippedPairs } = await runProbeAwareFidelityCheck();
    expect(Array.isArray(diffs)).toBe(true);
    expect(Array.isArray(skippedPairs)).toBe(true);
    expect(diffs.length + skippedPairs.length).toBe(36);
  });

  it('runProbeAwareFidelityCheck 内 diffs は全 matched (shape 契約 preserving)', async () => {
    const { diffs } = await runProbeAwareFidelityCheck();
    for (const d of diffs) {
      expect(d.matched).toBe(true);
      expect(d.mockCompleted && d.realCompleted).toBe(true);
    }
  });

  it('checkSkipForAxis で electron/tauri/webview/dark-mode = skip=false', () => {
    for (const axis of ['electron', 'tauri', 'webview', 'dark-mode'] as const) {
      for (const target of ['macos', 'windows', 'linux'] as const) {
        const decision = checkSkipForAxis(axis, target);
        expect(decision.skip).toBe(false);
      }
    }
  });

  it('checkSkipForAxis で platform mismatch = skip=true', () => {
    const platform = process.platform;
    if (platform === 'darwin') {
      const decision = checkSkipForAxis('auto-updater', 'linux');
      expect(decision.skip).toBe(true);
    } else if (platform === 'linux') {
      const decision = checkSkipForAxis('auto-updater', 'macos');
      expect(decision.skip).toBe(true);
    }
  });

  it('skippedPair は reason field 持つ', async () => {
    const { skippedPairs } = await runProbeAwareFidelityCheck();
    for (const s of skippedPairs) {
      expect(s.reason).toBeDefined();
      expect(typeof s.reason).toBe('string');
      expect(s.reason.length).toBeGreaterThan(0);
    }
  });

  it('probeAllCliCommands result の durationMs は非負', async () => {
    const results = await probeAllCliCommands(makeSpawn('/usr/bin/dummy', 0));
    for (const r of results) {
      expect(r.durationMs).toBeGreaterThanOrEqual(0);
    }
  });

  it('runProbeAwareFidelityCheck で全 12 axis 網羅 (diffs + skippedPairs union)', async () => {
    const { diffs, skippedPairs } = await runProbeAwareFidelityCheck();
    const allAxes = new Set<string>();
    for (const d of diffs) allAxes.add(d.axis);
    for (const s of skippedPairs) allAxes.add(s.axis);
    expect(allAxes.size).toBe(12);
  });
});
