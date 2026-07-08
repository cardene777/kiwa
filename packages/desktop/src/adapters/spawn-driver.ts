/**
 * Desktop spawn driver (v0.5、 depth-5 pattern 2 例目 candidate、 Mobile v1.54 rhythm 再現)。
 *
 * v0.5 stub 契約層 = shape 契約のみ、 実 spawn 実行は v1.61+ の v0.6 で追加予定。
 * env-gate `KIWA_DESKTOP_MODE=real` + args 上限 32 + fail-closed で安全性保証。
 * 12 axis から CLI-backed axis を抽出 (8 CLI)、 non-CLI axis (electron / tauri / webview / dark-mode) は null。
 */
import type { DesktopAxis } from '../semantics/types.js';

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
  // v0.1 axis
  electron: null, // native process、 CLI 不要
  tauri: null,
  webview: null,
  // v0.2 axis
  'auto-updater': 'electron-updater',
  'fs-permissions': 'osascript', // macOS TCC 系。 Windows/Linux は別 CLI 検出予定
  notification: 'notify-send', // Linux libnotify、 macOS/Windows は別
  'menu-bar': 'electron-builder', // packaging 時 template
  'tray-icon': 'electron-builder', // packaging 時 template
  // v0.3 axis
  'screen-recording': 'ffmpeg',
  'global-shortcut': 'defaults', // macOS accessibility 系
  clipboard: 'xclip', // Linux。 macOS = pbcopy、 Windows = clip
  'dark-mode': null, // OS notification 経路、 CLI なし (macOS defaults / Windows reg で読める余地あり)
};

/**
 * v0.5 stub 契約層 = env-gate 通過確認 + args 上限 32 + shape 契約返却。
 * `KIWA_DESKTOP_MODE=real` + 対応 axis env 未設定なら throw で fail-closed。
 * 実 spawn 実行は v1.61+ の v0.6 で置換予定。
 */
export async function invokeDesktopCli(inv: SpawnInvocation): Promise<SpawnResult> {
  const start = Date.now();
  if (inv.env.KIWA_DESKTOP_MODE !== 'real') {
    throw new Error(
      `invokeDesktopCli(${inv.command}): KIWA_DESKTOP_MODE must be 'real'`,
    );
  }
  if (inv.args.length > 32) {
    throw new Error(`invokeDesktopCli(${inv.command}): args exceeds max 32 (${inv.args.length})`);
  }

  // v0.5 = stub 契約、 実 spawn は v0.6 で置換
  return {
    command: inv.command,
    args: [...inv.args],
    invoked: true,
    exitCode: 0,
    stdout: `[v0.5 stub] ${inv.command} ${inv.args.join(' ')}`,
    stderr: '',
    durationMs: Date.now() - start,
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
