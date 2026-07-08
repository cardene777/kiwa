/**
 * Desktop spawn driver (v0.6、 depth-5 pattern 2 例目確定 + depth-6 pattern 新設 candidate、 Mobile v1.55 rhythm 再現)。
 *
 * v0.5 stub 契約 → v0.6 実 child_process.spawn 実行 に置換 (executeSpawn 経由)。
 * shape 契約 preserving = SpawnResult 構造は v0.5 と同一、 stdout/stderr/exitCode/durationMs は
 * 実 spawn からの実測値。 test-only injection 経路として `invokeDesktopCliWith` を追加
 * (SpawnFn を DI 可能)、 実 CLI 未 install 環境でも決定的 test を成立させる。
 * KIWA_DESKTOP_SPAWN=dry-run で v0.5 stub 相当 shape 復元 (backward compat 経路)。
 */
import { spawn as nodeSpawn } from 'node:child_process';
import type { DesktopAxis } from '../semantics/types.js';
import { executeSpawn, type SpawnFn } from './spawn-executor.js';

export type DesktopCliCommand =
  | 'electron-builder'
  | 'electron-updater'
  | 'ffmpeg'
  | 'xclip'
  | 'osascript'
  | 'notify-send'
  | 'defaults'
  | 'reg';

export interface SpawnInvocation {
  command: DesktopCliCommand;
  args: string[];
  env: Record<string, string>;
  cwd?: string;
}

export interface SpawnResult {
  command: DesktopCliCommand;
  args: string[];
  invoked: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
}

const AXIS_TO_CLI: Record<DesktopAxis, DesktopCliCommand | null> = {
  electron: null,
  tauri: null,
  webview: null,
  'auto-updater': 'electron-updater',
  'fs-permissions': 'osascript',
  notification: 'notify-send',
  'menu-bar': 'electron-builder',
  'tray-icon': 'electron-builder',
  'screen-recording': 'ffmpeg',
  'global-shortcut': 'defaults',
  clipboard: 'xclip',
  'dark-mode': null,
};

/**
 * v0.6 実 spawn 実行 = env-gate 通過確認 + args 上限 32 + 実 child_process.spawn 実行。
 * `KIWA_DESKTOP_MODE=real` + 対応 axis env 未設定なら throw で fail-closed。
 * `KIWA_DESKTOP_SPAWN=dry-run` の時は v0.5 stub 相当の shape 契約を返す
 * (実 CLI 未 install 環境向け backward compat 経路)。
 */
export async function invokeDesktopCli(inv: SpawnInvocation): Promise<SpawnResult> {
  return invokeDesktopCliWith(inv, nodeSpawn);
}

/**
 * DI 経路 = spawnFn を注入可能、 test で dummy spawn を差し込んで
 * 決定的挙動を検証できる。 default は nodeSpawn。
 */
export async function invokeDesktopCliWith(
  inv: SpawnInvocation,
  spawnFn: SpawnFn,
): Promise<SpawnResult> {
  const start = Date.now();
  if (inv.env.KIWA_DESKTOP_MODE !== 'real') {
    throw new Error(
      `invokeDesktopCli(${inv.command}): KIWA_DESKTOP_MODE must be 'real'`,
    );
  }
  if (inv.args.length > 32) {
    throw new Error(`invokeDesktopCli(${inv.command}): args exceeds max 32 (${inv.args.length})`);
  }

  if (inv.env.KIWA_DESKTOP_SPAWN === 'dry-run') {
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

export function cliForAxis(axis: DesktopAxis): DesktopCliCommand | null {
  return AXIS_TO_CLI[axis];
}

export function buildSpawnInvocation(input: {
  command: DesktopCliCommand;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}): SpawnInvocation {
  const inv: SpawnInvocation = {
    command: input.command,
    args: input.args ?? [],
    env: input.env ?? ({ ...process.env } as Record<string, string>),
  };
  if (input.cwd !== undefined) inv.cwd = input.cwd;
  return inv;
}
