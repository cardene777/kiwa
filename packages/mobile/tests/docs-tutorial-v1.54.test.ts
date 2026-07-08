/**
 * v1.54-3 docs 補強 — tutorial 114 code snippet 検証。
 * **32 milestone 連続 snippet validation streak** = v1.23 → v1.54。 kiwa 史上最長記録更新継続。
 */
import { describe, expect, it } from 'vitest';
import {
  cliForAxis,
  invokeMobileCli,
  type MobileAxis,
  type MobileCliCommand,
} from '../src/index.js';

describe('tutorial 114 — spawn stub env-gate snippet', () => {
  it('rejects when KIWA_MOBILE_MODE not real', async () => {
    await expect(
      invokeMobileCli({
        command: 'expo build',
        args: [],
        env: { KIWA_MOBILE_MODE: 'mock' },
      }),
    ).rejects.toThrow(/KIWA_MOBILE_MODE must be 'real'/);
  });

  it('returns spawn shape when env=real (dry-run for tutorial)', async () => {
    const r = await invokeMobileCli({
      command: 'expo build',
      args: ['--platform', 'ios'],
      env: { KIWA_MOBILE_MODE: 'real', KIWA_MOBILE_SPAWN: 'dry-run' },
    });
    expect(r.invoked).toBe(true);
    expect(r.exitCode).toBe(0);
  });
});

describe('tutorial 114 — axis-CLI mapping snippet', () => {
  it('CLI-backed axes return command', () => {
    expect(cliForAxis('react-native')).toBe('react-native start');
    expect(cliForAxis('expo')).toBe('expo build');
    expect(cliForAxis('metro')).toBe('metro bundle');
    expect(cliForAxis('turbo-modules')).toBe('codegen run');
  });

  it('non-CLI axes return null', () => {
    const nonCli: MobileAxis[] = ['navigation', 'reanimated', 'async-storage', 'secure-storage'];
    for (const a of nonCli) {
      expect(cliForAxis(a)).toBeNull();
    }
  });
});

describe('tutorial 114 — all 6 CLI stubs snippet', () => {
  it('every CLI returns valid SpawnResult', async () => {
    const ALL_CLIS: MobileCliCommand[] = [
      'expo build', 'metro bundle', 'codegen run',
      'react-native start', 'pod install', 'gradle build',
    ];
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
});
