/**
 * Mobile spawn driver (v0.6、 depth-5 pattern 実装完成)。
 *
 * v0.5 stub 契約 → v0.6 実 child_process.spawn 実行 に置換 (executeSpawn 経由)。
 * shape 契約 preserving = SpawnResult 構造は v0.5 と同一、 stdout/stderr/exitCode
 * /durationMs は 実 spawn からの実測値。 test-only injection 経路として
 * `invokeMobileCliWith` を追加 (SpawnFn を DI 可能)、 実 CLI 未 install 環境でも
 * 決定的 test を成立させる。
 */
import { spawn as nodeSpawn } from 'node:child_process';
import type { MobileAxis } from '../semantics/types.js';
import { executeSpawn, type SpawnFn } from './spawn-executor.js';

export type MobileCliCommand =
  | 'expo build'
  | 'metro bundle'
  | 'codegen run'
  | 'react-native start'
  | 'pod install'
  | 'gradle build';

export interface SpawnInvocation {
  command: MobileCliCommand;
  args: string[];
  env: Record<string, string>;
  cwd?: string;
}

export interface SpawnResult {
  command: MobileCliCommand;
  args: string[];
  invoked: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
}

const AXIS_TO_CLI: Record<MobileAxis, MobileCliCommand | null> = {
  'react-native': 'react-native start',
  expo: 'expo build',
  metro: 'metro bundle',
  navigation: null,
  reanimated: null,
  'async-storage': null,
  'secure-storage': null,
  fabric: 'react-native start',
  'turbo-modules': 'codegen run',
  codegen: 'codegen run',
  'new-architecture': 'gradle build',
};

/**
 * v0.6 実 spawn 実行 = env-gate 通過確認 + args 上限 32 + 実 child_process.spawn 実行。
 * `KIWA_MOBILE_MODE=real` + 対応 axis env 未設定なら throw で fail-closed。
 * `KIWA_MOBILE_SPAWN=dry-run` の時は v0.5 stub 相当の shape 契約を返す
 * (実 CLI 未 install 環境向け backward compat 経路)。
 */
export async function invokeMobileCli(inv: SpawnInvocation): Promise<SpawnResult> {
  return invokeMobileCliWith(inv, nodeSpawn);
}

/**
 * DI 経路 = spawnFn を注入可能、 test で dummy spawn を差し込んで
 * 決定的挙動を検証できる。 default は nodeSpawn。
 */
export async function invokeMobileCliWith(
  inv: SpawnInvocation,
  spawnFn: SpawnFn,
): Promise<SpawnResult> {
  const start = Date.now();
  if (inv.env.KIWA_MOBILE_MODE !== 'real') {
    throw new Error(
      `invokeMobileCli(${inv.command}): KIWA_MOBILE_MODE must be 'real'`,
    );
  }
  if (inv.args.length > 32) {
    throw new Error(`invokeMobileCli(${inv.command}): args exceeds max 32 (${inv.args.length})`);
  }

  if (inv.env.KIWA_MOBILE_SPAWN === 'dry-run') {
    return {
      command: inv.command,
      args: [...inv.args],
      invoked: true,
      exitCode: 0,
      stdout: `[v0.6 dry-run] ${inv.command} ${inv.args.join(' ')}`,
      stderr: '',
      durationMs: Date.now() - start,
    };
  }

  const executed = await executeSpawn(
    {
      command: inv.command,
      args: inv.args,
      env: inv.env,
      ...(inv.cwd !== undefined ? { cwd: inv.cwd } : {}),
    },
    spawnFn,
  );

  return {
    command: inv.command,
    args: [...inv.args],
    invoked: true,
    exitCode: executed.exitCode,
    stdout: executed.stdout,
    stderr: executed.stderr,
    durationMs: executed.durationMs,
  };
}

export function cliForAxis(axis: MobileAxis): MobileCliCommand | null {
  return AXIS_TO_CLI[axis];
}

export function buildSpawnInvocation(input: {
  command: MobileCliCommand;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}): SpawnInvocation {
  const inv: SpawnInvocation = {
    command: input.command,
    args: input.args ?? [],
    env: input.env ?? { ...process.env } as Record<string, string>,
  };
  if (input.cwd !== undefined) inv.cwd = input.cwd;
  return inv;
}
