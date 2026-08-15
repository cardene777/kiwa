import { spawn } from 'node:child_process';
import {
  mkdir,
  readFile as fsReadFile,
  readdir,
  stat,
  writeFile as fsWriteFile,
} from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { createManagedTempDir } from '@kiwa-lab/core';
import type {
  CliRunOptions,
  CliRunResult,
  CliTestEnv,
  SetupCliEnvOptions,
} from './types.js';

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * `label` (新) と `prefix` (旧) を、名前空間の中で使える label に均す。
 *
 * 旧 `prefix` は dir 名の先頭にそのまま付いていた。 回収は `kiwa-` 名前空間に一致する
 * dir しか対象にできないため、任意の prefix を素通しすると、その dir だけ異常終了時に
 * 回収されない。 名前空間を前置する形に変え、二重に `kiwa-` が並ばないよう剥がす。
 * 末尾の `-` も区切りが重なるだけなので落とす。
 *
 * 検証は core 側 (`createManagedTempDir`) が行う。 ここで弾くと、同じ規則が 2 箇所に
 * 分かれて片方だけ変わる。
 */
function toTempLabel(opts: SetupCliEnvOptions): string {
  const raw = (opts.label ?? opts.prefix ?? 'kiwa-cli-')
    .replace(/^kiwa-/, '')
    .replace(/-+$/, '');
  return raw === '' ? 'cli' : raw;
}

async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

async function walk(root: string, dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(root, full)));
    } else {
      out.push(relative(root, full));
    }
  }
  return out;
}

function resolveWithin(tempDir: string, p?: string): string {
  if (!p) return tempDir;
  if (isAbsolute(p)) return p;
  return resolve(tempDir, p);
}

async function runCliImpl(
  tempDir: string,
  baseEnv: Record<string, string>,
  opts: CliRunOptions,
): Promise<CliRunResult> {
  const cwd = resolveWithin(tempDir, opts.cwd);
  const env = { ...baseEnv, ...(opts.env ?? {}) };
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const startedAt = Date.now();

  return new Promise<CliRunResult>((resolveFn, rejectFn) => {
    const child = spawn(opts.cmd, opts.args ?? [], {
      cwd,
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let finished = false;

    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      child.kill('SIGKILL');
      rejectFn(new Error(`runCli: timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk));
    child.on('error', (error: Error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      rejectFn(error);
    });
    child.on('close', (code, signal) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolveFn({
        exitCode: code ?? 0,
        signal,
        stdout: Buffer.concat(stdoutChunks).toString('utf8'),
        stderr: Buffer.concat(stderrChunks).toString('utf8'),
        durationMs: Date.now() - startedAt,
      });
    });

    if (opts.stdin !== undefined) {
      child.stdin.write(opts.stdin);
    }
    child.stdin.end();
  });
}

export async function setupCliEnv(opts: SetupCliEnvOptions = {}): Promise<CliTestEnv> {
  // `prefix` は名前空間の中の識別子として扱う。 回収は `kiwa-` に一致する dir だけを
  // 対象にするため、 任意の prefix を素通しすると異常終了時に回収されない dir ができる。
  const managed = createManagedTempDir({ label: toTempLabel(opts) });
  const tempDir = managed.path;
  const baseEnv: Record<string, string> = {
    ...Object.fromEntries(
      Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined),
    ),
    ...(opts.env ?? {}),
  };
  if (opts.seedFiles) {
    for (const [relPath, content] of Object.entries(opts.seedFiles)) {
      const full = resolve(tempDir, relPath);
      await ensureDir(dirname(full));
      await fsWriteFile(full, content);
    }
  }

  const env: CliTestEnv = {
    mode: 'mock',
    tempDir,
    runCli: (runOpts) => runCliImpl(tempDir, baseEnv, runOpts),
    readFile: async (relPath) => {
      const full = resolve(tempDir, relPath);
      return fsReadFile(full, 'utf8');
    },
    writeFile: async (relPath, content) => {
      const full = resolve(tempDir, relPath);
      await ensureDir(dirname(full));
      await fsWriteFile(full, content);
    },
    listFiles: async (relDir) => {
      const dir = resolveWithin(tempDir, relDir);
      return walk(tempDir, dir);
    },
    fileExists: async (relPath) => {
      const full = resolve(tempDir, relPath);
      try {
        await stat(full);
        return true;
      } catch {
        return false;
      }
    },
    stop: async () => {
      managed.dispose();
    },
  };
  return env;
}
