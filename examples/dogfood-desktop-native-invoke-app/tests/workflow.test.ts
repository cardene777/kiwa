import { EventEmitter } from 'node:events';
import { describe, expect, it } from 'vitest';
import type { SpawnFn } from '@kiwa-test/desktop';
import {
  extractInvokedSpawnResults,
  generateStatusReport,
  invokeAllAxes,
  invokeSingleAxis,
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

describe('dogfood-desktop-native-invoke-app (v1.64-2、 実 native binding 呼出 pattern)', () => {
  it('invokeSingleAxis で semantics-only axis (electron) = no-cli-mapping', async () => {
    const result = await invokeSingleAxis({
      axis: 'electron',
      target: 'macos',
      spawnFn: makeSpawn('/usr/bin/dummy', 0),
    });
    expect(result.status).toBe('no-cli-mapping');
    expect(result.spawnResult).toBeNull();
  });

  it('invokeSingleAxis で platform mismatch = axis-skipped', async () => {
    const platform = process.platform;
    const otherTarget = platform === 'darwin' ? 'linux' : 'macos';
    const result = await invokeSingleAxis({
      axis: 'auto-updater',
      target: otherTarget,
    });
    expect(result.status).toBe('axis-skipped');
  });

  it('invokeAllAxes で 36 pair 全走査', async () => {
    const summary = await invokeAllAxes(makeSpawn('/usr/bin/dummy', 0));
    expect(summary.total).toBe(36);
    const bucketTotal =
      summary.invoked.length +
      summary.cliUnavailable.length +
      summary.axisSkipped.length +
      summary.noCliMapping.length;
    expect(bucketTotal).toBe(36);
  });

  it('generateStatusReport で 4 status count 全 field', async () => {
    const report = await generateStatusReport(makeSpawn('/usr/bin/dummy', 0));
    expect(report.totalCount).toBe(36);
    expect(typeof report.invokedCount).toBe('number');
    expect(typeof report.cliUnavailableCount).toBe('number');
    expect(typeof report.axisSkippedCount).toBe('number');
    expect(typeof report.noCliMappingCount).toBe('number');
    const sum =
      report.invokedCount +
      report.cliUnavailableCount +
      report.axisSkippedCount +
      report.noCliMappingCount;
    expect(sum).toBe(36);
  });

  it('semantics-only 4 axis × 3 target = 12 の no-cli-mapping', async () => {
    const report = await generateStatusReport(makeSpawn('/usr/bin/dummy', 0));
    expect(report.noCliMappingCount).toBe(12);
  });

  it('extractInvokedSpawnResults で invoked のみ 抽出', async () => {
    const spawnFn = makeSpawn('production stdout', 0);
    const invokedResults = await extractInvokedSpawnResults(spawnFn);
    for (const r of invokedResults) {
      expect(r.axis).toBeDefined();
      expect(r.target).toBeDefined();
      expect(typeof r.stdout).toBe('string');
    }
  });

  it('CLI 未 install シミュレーション で cli-unavailable が増加', async () => {
    const report = await generateStatusReport(makeSpawn('', 1));
    expect(report.cliUnavailableCount).toBeGreaterThan(0);
  });

  it('shape 契約 preserving = invoked pair の spawnResult は SpawnResult shape', async () => {
    const summary = await invokeAllAxes(makeSpawn('/usr/bin/dummy', 0));
    for (const r of summary.invoked) {
      expect(r.spawnResult).not.toBeNull();
      expect(r.spawnResult?.command).toBeDefined();
      expect(r.spawnResult?.invoked).toBeDefined();
    }
  });

  it('shape 契約 preserving = skip 系 3 status の spawnResult = null', async () => {
    const summary = await invokeAllAxes(makeSpawn('', 1));
    for (const r of [...summary.cliUnavailable, ...summary.axisSkipped, ...summary.noCliMapping]) {
      expect(r.spawnResult).toBeNull();
    }
  });

  it('4 InvokeStatus 全 経路で reason field が正しく設定', async () => {
    const summary = await invokeAllAxes(makeSpawn('', 1));
    // no-cli-mapping = "semantics-only" reason
    for (const r of summary.noCliMapping) {
      expect(r.reason).toContain('semantics-only');
    }
    // cli-unavailable = "not installed" reason
    for (const r of summary.cliUnavailable) {
      expect(r.reason).toContain('not installed');
    }
  });
});
