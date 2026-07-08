import { describe, expect, it } from 'vitest';
import {
  buildSpawnInvocation,
  cliForAxis,
  invokeMobileCli,
  type MobileCliCommand,
} from '../../src/index.js';

const ALL_CLIS: MobileCliCommand[] = [
  'expo build',
  'metro bundle',
  'codegen run',
  'react-native start',
  'pod install',
  'gradle build',
];

describe('v1.54-1 spawn-driver stub (pair 深度 5 段拡張 1 例目 candidate)', () => {
  it('rejects when KIWA_MOBILE_MODE not real', async () => {
    await expect(
      invokeMobileCli({
        command: 'expo build',
        args: [],
        env: { KIWA_MOBILE_MODE: 'mock' },
      }),
    ).rejects.toThrow(/KIWA_MOBILE_MODE must be 'real'/);
  });

  it('rejects when args > 32', async () => {
    await expect(
      invokeMobileCli({
        command: 'metro bundle',
        args: new Array(33).fill('x'),
        env: { KIWA_MOBILE_MODE: 'real', KIWA_MOBILE_SPAWN: 'dry-run' },
      }),
    ).rejects.toThrow(/args exceeds max 32/);
  });

  it('returns spawn shape stub when env=real', async () => {
    const r = await invokeMobileCli({
      command: 'expo build',
      args: ['--platform', 'ios'],
      env: { KIWA_MOBILE_MODE: 'real', KIWA_MOBILE_SPAWN: 'dry-run' },
    });
    expect(r.invoked).toBe(true);
    expect(r.command).toBe('expo build');
    expect(r.args).toEqual(['--platform', 'ios']);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('v0.6 dry-run');
    expect(r.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('supports all 6 CLI commands', async () => {
    for (const cmd of ALL_CLIS) {
      const r = await invokeMobileCli({
        command: cmd,
        args: [],
        env: { KIWA_MOBILE_MODE: 'real', KIWA_MOBILE_SPAWN: 'dry-run' },
      });
      expect(r.command).toBe(cmd);
      expect(r.invoked).toBe(true);
    }
  });

  it('cliForAxis maps axes to CLI (or null for non-CLI-backed axes)', () => {
    expect(cliForAxis('react-native')).toBe('react-native start');
    expect(cliForAxis('expo')).toBe('expo build');
    expect(cliForAxis('metro')).toBe('metro bundle');
    expect(cliForAxis('fabric')).toBe('react-native start');
    expect(cliForAxis('turbo-modules')).toBe('codegen run');
    expect(cliForAxis('codegen')).toBe('codegen run');
    expect(cliForAxis('new-architecture')).toBe('gradle build');
    // Non-CLI-backed axes return null
    expect(cliForAxis('navigation')).toBeNull();
    expect(cliForAxis('reanimated')).toBeNull();
    expect(cliForAxis('async-storage')).toBeNull();
    expect(cliForAxis('secure-storage')).toBeNull();
  });

  it('buildSpawnInvocation defaults args to [] and env to process.env', () => {
    const inv = buildSpawnInvocation({ command: 'metro bundle' });
    expect(inv.command).toBe('metro bundle');
    expect(inv.args).toEqual([]);
    expect(inv.env).toBeDefined();
  });

  it('buildSpawnInvocation preserves cwd', () => {
    const inv = buildSpawnInvocation({ command: 'gradle build', cwd: '/app' });
    expect(inv.cwd).toBe('/app');
  });
});
