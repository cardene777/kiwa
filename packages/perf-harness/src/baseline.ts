import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { arch, platform as osPlatform, cpus } from 'node:os';
import { dirname, join, resolve } from 'node:path';
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
  // baseline として解釈できない中身は「無い」ものとして返す。空の results を
  // 返すと呼び出し側が「baseline はある」と判断して seed し直さず、回帰判定が
  // 永久に n/a のまま修復されない。
  if (envelope === null) return null;
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
  // 直接書くと truncate 後の空ファイルを別 worker が読み、JSON.parse が
  // "Unexpected end of JSON input" で落ちる。同一 directory の一時 file へ
  // 書いてから rename して、読み手からは切り替わりが原子的に見えるようにする。
  const tempPath = `${path}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(tempPath, `${JSON.stringify(envelope, null, 2)}\n`, 'utf8');
    await rename(tempPath, path);
  } catch (error) {
    await rm(tempPath, { force: true });
    throw error;
  }
}

/**
 * baseline の既定の置き場を決める。
 *
 * `process.cwd()` をそのまま使うと、 同じ module の baseline が起動場所ごとに
 * 別 file に分かれる。 kiwa では `pnpm --filter <pkg> test:perf` (cwd = package) と
 * repo root からの起動が混在し、 `<root>/.perf-baseline/` と
 * `packages/<name>/.perf-baseline/` の 2 箇所に同じ module の値が溜まっていた。
 * 片方だけを読む実行は毎回「baseline が無い」 と判断して作り直すため、
 * 回帰判定がいつまでも成立しない。
 *
 * workspace の目印 (`pnpm-workspace.yaml` / `.git`) を cwd から上に辿って
 * 見つかった場所を基準にする。 目印が無い単体 package からの利用では
 * 従来どおり cwd を使うので、 repo の外の呼出には影響しない。
 */
export function defaultBaselinePath(moduleName: string): string {
  return `${resolveBaselineRoot(process.cwd())}/.perf-baseline/${moduleName}.json`;
}

/** workspace の目印を cwd から上に辿る。 見つからなければ起点をそのまま返す。 */
export function resolveBaselineRoot(start: string): string {
  let current = resolve(start);
  while (true) {
    for (const marker of ['pnpm-workspace.yaml', '.git']) {
      if (existsSync(join(current, marker))) return current;
    }
    const parent = dirname(current);
    if (parent === current) return resolve(start);
    current = parent;
  }
}

/**
 * 測定の取り方の版。 機械も Node も同じでも測り方が変われば、 保存済みの値は
 * 比較対象にならない。 そのとき baseline を手で消して回るのではなく、 ここを
 * 1 上げて「前提が違う」 と宣言し、 測定が成立している次の実行で作り直させる。
 *
 * - 版 1 = workspace も vitest の file も並列で測っていた頃 (この field 自体が無い)
 * - 版 2 = workspace を `--workspace-concurrency=1`、 vitest を
 *   `fileParallelism: false` にして 1 件ずつ測る (#1708)
 * - 版 3 = memory 測定に空回しを入れた (#1708)。 それまでは初回の 1 回きりの
 *   確保が反復数で割られて「1 回あたりの保持」 に載っており、 同じ実装でも
 *   arrayBuffers の増分が変わる。 serial / concurrent の測り方は版 2 と同じ
 *   (標本数の引き上げは試したが効果が確認できず戻した)
 *
 * 上げる条件は「同じ実装を測っても値が変わる」 変更に限る。 閾値や判定の変更は
 * 測り方ではないので上げない。
 */
export const MEASUREMENT_PREMISE = 3;

/** 現行環境の env metadata を取得する。 git 未 install / 非 repo 環境では gitSha は "unknown"。 */
export function captureEnv(): BaselineEnv {
  return {
    nodeVersion: process.version,
    platform: `${osPlatform()}-${arch()}`,
    cpuModel: cpus()[0]?.model ?? 'unknown',
    cpuCount: cpus().length,
    gitSha: captureGitSha(),
    gcExposed: typeof (globalThis as { gc?: () => void }).gc === 'function',
    measurementPremise: MEASUREMENT_PREMISE,
    savedAt: new Date().toISOString(),
  };
}

/**
 * baseline を比較対象として使えるかを判定する。
 *
 * `gitSha` や `hostname` の違いは測定値の意味を変えないが、GC を呼べるかどうかは
 * memory 測定の前提そのものを変える。前提が違う baseline と比べると、実装が
 * 変わっていなくても回帰と判定されてしまう。
 */
export function isComparableEnv(baseline: BaselineEnv, current: BaselineEnv): boolean {
  // GC の有無が記録されていない baseline は、どちらの条件で測ったか判別できない。
  // 不明なまま比較すると、実装が変わっていなくても回帰と判定され得る。
  if (baseline.gcExposed === undefined) return false;
  // 測り方の版も同じ理由で必須にする。 記録が無いものは版 1 以前で、
  // 並列実行の負荷を含んだ値のため現在の測定とは比較できない。
  if (baseline.measurementPremise === undefined) return false;
  return (
    baseline.measurementPremise === current.measurementPremise &&
    baseline.gcExposed === current.gcExposed &&
    baseline.nodeVersion === current.nodeVersion &&
    baseline.platform === current.platform &&
    // 別 CPU の測定値と比べると、実装ではなく機械の差を回帰として報告する。
    baseline.cpuModel === current.cpuModel &&
    baseline.cpuCount === current.cpuCount
  );
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
    'cpuModel',
    'cpuCount',
    'gitSha',
    'gcExposed',
    'measurementPremise',
  ];
  const mismatch: BaselineLoadResult['envMismatch'] = [];
  for (const field of fields) {
    if (baseline[field] !== current[field]) {
      mismatch.push({
        field,
        baseline: describeEnvValue(baseline[field]),
        current: describeEnvValue(current[field]),
      });
    }
  }
  return mismatch;
}

/** boolean と欠落を文字列へ寄せる。 利用側の `string | number` を壊さないため。 */
function describeEnvValue(value: string | number | boolean | undefined): string | number {
  if (value === undefined) return 'missing';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return value;
}

const MEASURE_NUMERIC_FIELDS = [
  'iterations',
  'warmup',
  'p50',
  'p95',
  'p99',
] as const satisfies readonly (keyof MeasureResult)[];

/**
 * 統計値まで検査する。name と samples だけを見ると、たまたま同名の field を
 * 持つ別物や配列の要素を result と誤認し、回帰計算が NaN や誤った stable へ
 * 落ちる。
 */
function isMeasureResult(value: unknown): value is MeasureResult {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.name !== 'string') return false;
  if (!Array.isArray(candidate.samples)) return false;
  if (!candidate.samples.every((sample) => typeof sample === 'number' && Number.isFinite(sample))) {
    return false;
  }
  return MEASURE_NUMERIC_FIELDS.every(
    (field) => typeof candidate[field] === 'number' && Number.isFinite(candidate[field]),
  );
}

function isBaselineEnv(value: unknown): value is BaselineEnv {
  if (value === null || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.nodeVersion === 'string' &&
    typeof candidate.platform === 'string' &&
    typeof candidate.cpuModel === 'string' &&
    typeof candidate.cpuCount === 'number' &&
    typeof candidate.gitSha === 'string' &&
    typeof candidate.savedAt === 'string'
  );
}

function isResultMap(value: unknown): value is Record<string, MeasureResult> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const entries = Object.entries(value as Record<string, unknown>);
  return entries.length > 0 && entries.every(([, entry]) => isMeasureResult(entry));
}

const UNKNOWN_ENV: BaselineEnv = {
  nodeVersion: 'unknown',
  platform: 'unknown',
  cpuModel: 'unknown',
  cpuCount: 0,
  gitSha: 'unknown',
  savedAt: 'unknown',
};

/**
 * envelope 化される前の baseline を現行 schema へ upgrade する。
 *
 * legacy には 2 形式がある。単一 MeasureResult を直接保存したものと、
 * three-layer が op 名をキーにして複数 result を並べたものである。
 * 後者を単一 result として畳むと op を引けなくなり、baseline が実在するのに
 * 回帰判定が毎回 seed 扱いへ落ちる。形式を判別してから展開する。
 */
function normalizeToEnvelope(parsed: unknown): BaselineEnvelope | null {
  if (
    parsed !== null &&
    typeof parsed === 'object' &&
    !Array.isArray(parsed) &&
    (parsed as { schema?: unknown }).schema === 1
  ) {
    const candidate = parsed as { env?: unknown; results?: unknown };
    // schema field だけを信じると、env 欠落で diffEnv が例外を投げる。
    if (!isBaselineEnv(candidate.env) || !isResultMap(candidate.results)) return null;
    return parsed as BaselineEnvelope;
  }

  if (isMeasureResult(parsed)) {
    return { schema: 1, env: UNKNOWN_ENV, results: { [parsed.name]: parsed } };
  }

  if (isResultMap(parsed)) {
    return { schema: 1, env: UNKNOWN_ENV, results: parsed };
  }

  // baseline として解釈できない中身は、無いものとして扱う。誤った比較対象を
  // 掴むより seed し直すほうが安全である。
  return null;
}

function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'ENOENT';
}
