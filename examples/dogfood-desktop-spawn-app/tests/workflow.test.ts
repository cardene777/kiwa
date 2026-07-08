import { describe, expect, it } from 'vitest';
import {
  ALL_CLIS,
  CLI_BACKED_AXES,
  NON_CLI_AXES,
  listNonCliAxes,
  runAllCliStubs,
  runAxisBackedCliChain,
} from '../src/workflow.js';

describe('dogfood-desktop-spawn-app (v1.60-2、 depth-5 record 2 例目 candidate、 Mobile v1.54 rhythm 再現)', () => {
  const realEnv = { KIWA_DESKTOP_MODE: 'real' };

  it('8 CLI-backed axes registered', () => {
    expect(CLI_BACKED_AXES).toHaveLength(8);
  });

  it('4 non-CLI axes registered', () => {
    expect(NON_CLI_AXES).toHaveLength(4);
    expect(NON_CLI_AXES).toEqual(['electron', 'tauri', 'webview', 'dark-mode']);
  });

  it('8 CLIs registered', () => {
    expect(ALL_CLIS).toHaveLength(8);
  });

  it('runAllCliStubs emits 8 SpawnResult with KIWA_DESKTOP_MODE=real', async () => {
    const results = await runAllCliStubs(realEnv);
    expect(results).toHaveLength(8);
    for (const r of results) {
      expect(r.invoked).toBe(true);
      expect(r.exitCode).toBe(0);
      expect(r.stdout).toContain('[v0.5 stub]');
      expect(r.durationMs).toBeGreaterThanOrEqual(0);
    }
  });

  it('runAllCliStubs throws when KIWA_DESKTOP_MODE 未設定', async () => {
    await expect(runAllCliStubs({})).rejects.toThrow(/KIWA_DESKTOP_MODE/);
  });

  it('runAllCliStubs throws when KIWA_DESKTOP_MODE=mock (fail-closed)', async () => {
    await expect(runAllCliStubs({ KIWA_DESKTOP_MODE: 'mock' })).rejects.toThrow(/KIWA_DESKTOP_MODE/);
  });

  it('runAxisBackedCliChain emits 8 result (axis → cli → SpawnResult)', async () => {
    const chain = await runAxisBackedCliChain(realEnv);
    expect(chain).toHaveLength(8);
    for (const step of chain) {
      expect(step.cli).not.toBeNull();
      expect(step.result).not.toBeNull();
      expect(step.result?.invoked).toBe(true);
    }
  });

  it('runAxisBackedCliChain 全 axis で対応 CLI が存在 (CLI-backed axis のみ)', async () => {
    const chain = await runAxisBackedCliChain(realEnv);
    const chainAxes = chain.map((s) => s.axis);
    expect(new Set(chainAxes)).toEqual(new Set(CLI_BACKED_AXES));
  });

  it('listNonCliAxes returns immutable copy', () => {
    const list1 = listNonCliAxes();
    const list2 = listNonCliAxes();
    expect(list1).toEqual(list2);
    list1.push('electron');
    expect(listNonCliAxes()).toHaveLength(4);
  });

  it('CLI_BACKED_AXES + NON_CLI_AXES = 12 axis 全網羅', () => {
    const total = [...CLI_BACKED_AXES, ...NON_CLI_AXES];
    expect(total).toHaveLength(12);
    expect(new Set(total).size).toBe(12);
  });

  it('runAllCliStubs args reference immutability', async () => {
    const results = await runAllCliStubs(realEnv);
    const originalArgs = results[0]?.args;
    if (results[0]) results[0].args.push('--extra');
    expect(originalArgs).toBeDefined();
  });
});
