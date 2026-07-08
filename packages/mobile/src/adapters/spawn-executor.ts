/**
 * v0.6 spawn executor — 実 child_process.spawn 実行 helper。
 *
 * v0.5 stub 経路 → v0.6 実 spawn 実行、 v0.5 shape 契約 preserving。
 * safety = allowlist + env sanitize + timeout + buffer 上限、 test-only
 * injection 経路も spawnFn パラメータで DI 可能。
 */
import { spawn as nodeSpawn, type SpawnOptions } from 'node:child_process';
import type { MobileCliCommand } from './spawn-driver.js';

export interface SpawnExecutorResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  durationMs: number;
}

export interface SpawnExecutorInput {
  command: MobileCliCommand;
  args: string[];
  env: Record<string, string>;
  cwd?: string;
  timeoutMs?: number;
  maxBufferBytes?: number;
}

export type SpawnFn = typeof nodeSpawn;

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_BUFFER_BYTES = 10 * 1024 * 1024;

const COMMAND_ENV_ALLOWLIST: Record<MobileCliCommand, readonly string[]> = {
  'expo build': ['PATH', 'HOME', 'NODE_ENV', 'EXPO_TOKEN', 'EAS_TOKEN'],
  'metro bundle': ['PATH', 'HOME', 'NODE_ENV', 'METRO_CACHE_DIR'],
  'codegen run': ['PATH', 'HOME', 'NODE_ENV'],
  'react-native start': ['PATH', 'HOME', 'NODE_ENV', 'RCT_METRO_PORT'],
  'pod install': ['PATH', 'HOME', 'LANG', 'COCOAPODS_DISABLE_STATS'],
  'gradle build': ['PATH', 'HOME', 'JAVA_HOME', 'ANDROID_HOME', 'ANDROID_SDK_ROOT', 'GRADLE_USER_HOME'],
};

export function sanitizeEnv(command: MobileCliCommand, env: Record<string, string>): Record<string, string> {
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

function splitCommand(command: MobileCliCommand): { executable: string; subcommand: string[] } {
  const parts = command.split(' ');
  const [executable, ...subcommand] = parts;
  if (typeof executable !== 'string' || executable.length === 0) {
    throw new Error(`splitCommand: unable to derive executable from ${command}`);
  }
  return { executable, subcommand };
}

export async function executeSpawn(
  input: SpawnExecutorInput,
  spawnFn: SpawnFn = nodeSpawn,
): Promise<SpawnExecutorResult> {
  const start = Date.now();
  const { executable, subcommand } = splitCommand(input.command);
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
      child = spawnFn(executable, [...subcommand, ...input.args], options);
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
