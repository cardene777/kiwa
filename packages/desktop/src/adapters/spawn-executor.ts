/**
 * v0.6 spawn executor — 実 child_process.spawn 実行 helper (Mobile v0.6 pattern 転用)。
 *
 * v0.5 stub 経路 → v0.6 実 spawn 実行、 v0.5 shape 契約 preserving。
 * safety = per-command env allowlist + timeout + buffer 上限 + shell:false + detached:false、
 * test-only injection 経路も spawnFn パラメータで DI 可能。
 */
import { spawn as nodeSpawn, type SpawnOptions } from 'node:child_process';
import type { DesktopCliCommand } from './spawn-driver.js';

export interface SpawnExecutorResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  durationMs: number;
}

export interface SpawnExecutorInput {
  command: DesktopCliCommand;
  args: string[];
  env: Record<string, string>;
  cwd?: string;
  timeoutMs?: number;
  maxBufferBytes?: number;
}

export type SpawnFn = typeof nodeSpawn;

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_BUFFER_BYTES = 10 * 1024 * 1024;

const COMMAND_ENV_ALLOWLIST: Record<DesktopCliCommand, readonly string[]> = {
  'electron-builder': ['PATH', 'HOME', 'NODE_ENV', 'ELECTRON_MIRROR', 'BUILD_TARGET', 'CSC_LINK', 'CSC_KEY_PASSWORD'],
  'electron-updater': ['PATH', 'HOME', 'NODE_ENV', 'GH_TOKEN', 'ELECTRON_UPDATER_CACHE'],
  ffmpeg: ['PATH', 'HOME', 'FFMPEG_PATH', 'FFREPORT'],
  xclip: ['PATH', 'HOME', 'DISPLAY', 'WAYLAND_DISPLAY'],
  osascript: ['PATH', 'HOME', 'LANG', 'USER'],
  'notify-send': ['PATH', 'HOME', 'DISPLAY', 'DBUS_SESSION_BUS_ADDRESS', 'XDG_RUNTIME_DIR'],
  defaults: ['PATH', 'HOME', 'USER'],
  reg: ['PATH', 'HOME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA'],
};

export function sanitizeEnv(command: DesktopCliCommand, env: Record<string, string>): Record<string, string> {
  const allowlist = new Set(COMMAND_ENV_ALLOWLIST[command] ?? ['PATH']);
  const out: Record<string, string> = {};
  for (const key of allowlist) {
    const value = env[key];
    if (typeof value === 'string' && value.length > 0) {
      out[key] = value;
    }
  }
  return out;
}

export async function executeSpawn(
  input: SpawnExecutorInput,
  spawnFn: SpawnFn = nodeSpawn,
): Promise<SpawnExecutorResult> {
  const start = Date.now();
  const sanitizedEnv = sanitizeEnv(input.command, input.env);
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBufferBytes = input.maxBufferBytes ?? DEFAULT_MAX_BUFFER_BYTES;

  const options: SpawnOptions = {
    env: sanitizedEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    detached: false,
  };
  if (input.cwd !== undefined) options.cwd = input.cwd;

  return new Promise<SpawnExecutorResult>((resolve, reject) => {
    let child;
    try {
      child = spawnFn(input.command, input.args, options);
    } catch (err) {
      reject(err);
      return;
    }

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let bufferExceeded = false;
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    child.stdout?.on('data', (chunk: Buffer) => {
      stdoutBytes += chunk.length;
      if (stdoutBytes > maxBufferBytes) {
        bufferExceeded = true;
        child.kill('SIGKILL');
        return;
      }
      stdoutChunks.push(chunk);
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      stderrBytes += chunk.length;
      if (stderrBytes > maxBufferBytes) {
        bufferExceeded = true;
        child.kill('SIGKILL');
        return;
      }
      stderrChunks.push(chunk);
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on('close', (exitCode, signal) => {
      clearTimeout(timer);
      const stdout = Buffer.concat(stdoutChunks).toString('utf-8');
      const stderr = Buffer.concat(stderrChunks).toString('utf-8');
      const suffix = bufferExceeded ? '\n[buffer exceeded]' : '';
      resolve({
        stdout: stdout + suffix,
        stderr: stderr + suffix,
        exitCode,
        signal,
        timedOut,
        durationMs: Date.now() - start,
      });
    });
  });
}
