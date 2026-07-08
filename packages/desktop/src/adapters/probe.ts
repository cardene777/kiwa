/**
 * v0.8 native binding availability probe + skip 経路。
 *
 * 実 CLI / native OS API の存在確認 + platform gate + 12 axis 別 skip strategy で
 * 実 CLI 未 install 環境 (linux で defaults / macos で reg / windows で osascript 等)
 * でも決定的 test 成立。 v1.62 で確立した shape 契約 preserving + behavior diff の
 * 2 layer separation を活かして、 skip layer を第 3 layer として追加。
 *
 * probe = which/where で CLI 存在確認、 process.platform で OS gate、 axis + target
 * の組合せで skip 判定。 shape 契約 preserving 絶対維持 = skip した pair は matched
 * 判定から除外、 skippedPairs metadata で追跡。
 */
import { spawn as nodeSpawn } from 'node:child_process';
import type { DesktopAxis, DesktopTarget } from '../semantics/types.js';
import type { DesktopCliCommand } from './spawn-driver.js';
import type { SpawnFn } from './spawn-executor.js';

export type NodePlatform = 'darwin' | 'linux' | 'win32' | 'other';

export interface ProbeInput {
  command: DesktopCliCommand;
  platform?: NodePlatform;
  spawnFn?: SpawnFn;
}

export interface ProbeResult {
  command: DesktopCliCommand;
  platform: NodePlatform;
  available: boolean;
  probePath: string | null;
  durationMs: number;
}

export interface PlatformGate {
  target: DesktopTarget;
  platform: NodePlatform;
  compatible: boolean;
}

/**
 * DesktopTarget と NodePlatform の互換性 gate。
 * macOS target = darwin のみ、 windows target = win32 のみ、 linux target = linux のみ。
 */
export function platformGate(target: DesktopTarget): PlatformGate {
  const platform = currentPlatform();
  const compatible =
    (target === 'macos' && platform === 'darwin') ||
    (target === 'windows' && platform === 'win32') ||
    (target === 'linux' && platform === 'linux');
  return { target, platform, compatible };
}

function currentPlatform(): NodePlatform {
  const p = process.platform;
  if (p === 'darwin') return 'darwin';
  if (p === 'linux') return 'linux';
  if (p === 'win32') return 'win32';
  return 'other';
}

/**
 * CLI availability probe = which (unix) / where (windows) で CLI 存在確認。
 * DI 経路 = spawnFn 注入で test 環境で decode 可能。
 */
export async function probeCliAvailable(input: ProbeInput): Promise<ProbeResult> {
  const start = Date.now();
  const platform = input.platform ?? currentPlatform();
  const spawnFn = input.spawnFn ?? nodeSpawn;
  const probeCmd = platform === 'win32' ? 'where' : 'which';

  return new Promise<ProbeResult>((resolve) => {
    let child;
    try {
      child = spawnFn(probeCmd, [input.command], {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
      });
    } catch (_err) {
      resolve({
        command: input.command,
        platform,
        available: false,
        probePath: null,
        durationMs: Date.now() - start,
      });
      return;
    }

    const stdoutChunks: Buffer[] = [];
    child.stdout?.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));

    child.on('error', () => {
      resolve({
        command: input.command,
        platform,
        available: false,
        probePath: null,
        durationMs: Date.now() - start,
      });
    });

    child.on('close', (exitCode) => {
      const stdout = Buffer.concat(stdoutChunks).toString('utf-8').trim();
      const available = exitCode === 0 && stdout.length > 0;
      resolve({
        command: input.command,
        platform,
        available,
        probePath: available ? stdout.split('\n')[0] ?? null : null,
        durationMs: Date.now() - start,
      });
    });
  });
}

/**
 * axis + target の組合せで skip 判定。
 * platform-specific CLI (osascript = darwin only / defaults = darwin only / reg = win32 only) は
 * 該当 platform 以外の target で常に skip。
 */
export function shouldSkipAxis(axis: DesktopAxis, target: DesktopTarget): {
  skip: boolean;
  reason: string | null;
} {
  const platform = currentPlatform();

  // native process axis = skip 不要 (semantics-only、 実 API 呼出なし)
  if (axis === 'electron' || axis === 'tauri' || axis === 'webview' || axis === 'dark-mode') {
    return { skip: false, reason: null };
  }

  // Platform mismatch = target と現 OS が違うなら skip
  const gate = platformGate(target);
  if (!gate.compatible) {
    return {
      skip: true,
      reason: `target ${target} incompatible with platform ${gate.platform}`,
    };
  }

  // Axis-specific platform gate
  // fs-permissions = osascript (macOS TCC 系)、 macOS + darwin のみ
  if (axis === 'fs-permissions' && platform !== 'darwin') {
    return { skip: true, reason: 'fs-permissions probe requires darwin (osascript)' };
  }

  // global-shortcut = defaults (macOS accessibility 系)、 macOS + darwin のみ
  if (axis === 'global-shortcut' && platform !== 'darwin') {
    return { skip: true, reason: 'global-shortcut probe requires darwin (defaults)' };
  }

  // notification = notify-send (Linux libnotify)、 linux 以外は skip
  if (axis === 'notification' && platform !== 'linux') {
    return { skip: true, reason: 'notification probe requires linux (notify-send)' };
  }

  // clipboard = xclip (Linux)、 linux 以外は skip
  if (axis === 'clipboard' && platform !== 'linux') {
    return { skip: true, reason: 'clipboard probe requires linux (xclip)' };
  }

  return { skip: false, reason: null };
}

/**
 * 全 12 axis × 3 target の skip decision matrix を計算。
 * v0.8 fidelity harness で skip した pair を追跡するのに使用。
 */
export function computeSkipMatrix(): { axis: DesktopAxis; target: DesktopTarget; skip: boolean; reason: string | null }[] {
  const AXES: DesktopAxis[] = [
    'electron',
    'tauri',
    'webview',
    'auto-updater',
    'fs-permissions',
    'notification',
    'menu-bar',
    'tray-icon',
    'screen-recording',
    'global-shortcut',
    'clipboard',
    'dark-mode',
  ];
  const TARGETS: DesktopTarget[] = ['macos', 'windows', 'linux'];
  const matrix: { axis: DesktopAxis; target: DesktopTarget; skip: boolean; reason: string | null }[] = [];
  for (const axis of AXES) {
    for (const target of TARGETS) {
      const decision = shouldSkipAxis(axis, target);
      matrix.push({ axis, target, skip: decision.skip, reason: decision.reason });
    }
  }
  return matrix;
}
