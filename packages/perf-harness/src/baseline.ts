import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { hostname, arch, platform as osPlatform, cpus } from 'node:os';
import { dirname } from 'node:path';
import type {
  BaselineEnv,
  BaselineEnvelope,
  BaselineLoadResult,
  MeasureResult,
} from './types.js';

/**
 * Baseline を load して現行環境と envelope の env を比較、
 * mismatch field を検出する。 legacy schema (単一 MeasureResult) は自動 upgrade して読む。
 */
export async function loadBaseline(path: string): Promise<BaselineLoadResult | null> {
  let body: string;
  try {
    body = await readFile(path, 'utf8');
  } catch (error) {
    if (isMissingFile(error)) return null;
    throw error;
  }
  const parsed = JSON.parse(body) as unknown;
  const envelope = normalizeToEnvelope(parsed);
  const envMismatch = diffEnv(envelope.env, captureEnv());
  return { envelope, envMismatch };
}

/**
 * 単一結果 baseline を保存する compat 経路。 内部で envelope に wrap して保存する。
 * `moduleName` は複数 op を 1 baseline に集約する時 (three-layer) に使う default key。
 */
export async function saveBaseline(
  path: string,
  result: MeasureResult,
  opts?: { key?: string },
): Promise<void> {
  const envelope: BaselineEnvelope = {
    schema: 1,
    env: captureEnv(),
    results: { [opts?.key ?? result.name]: result },
  };
  await saveBaselineEnvelope(path, envelope);
}

/** Envelope を直接保存する経路。 three-layer 等で複数 op を集約する場合に使う。 */
export async function saveBaselineEnvelope(
  path: string,
  envelope: BaselineEnvelope,
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(envelope, null, 2)}\n`, 'utf8');
}

export function defaultBaselinePath(moduleName: string): string {
  return `${process.cwd()}/.perf-baseline/${moduleName}.json`;
}

/** 現行環境の env metadata を取得する。 git 未 install / 非 repo 環境では gitSha は "unknown"。 */
export function captureEnv(): BaselineEnv {
  return {
    nodeVersion: process.version,
    platform: `${osPlatform()}-${arch()}`,
    hostname: hostname(),
    cpuModel: cpus()[0]?.model ?? 'unknown',
    cpuCount: cpus().length,
    gitSha: captureGitSha(),
    savedAt: new Date().toISOString(),
  };
}

function captureGitSha(): string {
  try {
    return execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * env の各 field を比較して mismatch を列挙する。 `savedAt` は常に mismatch するので除外。
 */
function diffEnv(baseline: BaselineEnv, current: BaselineEnv): BaselineLoadResult['envMismatch'] {
  const fields: Array<keyof BaselineEnv> = [
    'nodeVersion',
    'platform',
    'hostname',
    'cpuModel',
    'cpuCount',
    'gitSha',
  ];
  const mismatch: BaselineLoadResult['envMismatch'] = [];
  for (const field of fields) {
    if (baseline[field] !== current[field]) {
      mismatch.push({
        field,
        baseline: baseline[field],
        current: current[field],
      });
    }
  }
  return mismatch;
}

/**
 * legacy schema (単一 MeasureResult を直接保存) を envelope に upgrade する。
 * schema field 不在なら legacy と判定、 env は unknown で埋める。
 */
function normalizeToEnvelope(parsed: unknown): BaselineEnvelope {
  if (
    parsed !== null &&
    typeof parsed === 'object' &&
    'schema' in parsed &&
    (parsed as { schema: unknown }).schema === 1
  ) {
    return parsed as BaselineEnvelope;
  }
  const legacy = parsed as MeasureResult;
  return {
    schema: 1,
    env: {
      nodeVersion: 'unknown',
      platform: 'unknown',
      hostname: 'unknown',
      cpuModel: 'unknown',
      cpuCount: 0,
      gitSha: 'unknown',
      savedAt: 'unknown',
    },
    results: { [legacy.name ?? 'legacy']: legacy },
  };
}

function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'ENOENT';
}
