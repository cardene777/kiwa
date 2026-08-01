import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, realpathSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { arch, platform as osPlatform, cpus } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { buildMeasureResult } from './measure.js';
import type {
  BaselineEnv,
  BaselineEnvelope,
  BaselineLoadResult,
  MeasureResult,
  PerfReferenceKind,
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
    schema: BASELINE_SCHEMA,
    env: captureEnv(),
    results: { [opts?.key ?? result.name]: result },
  };
  await saveBaselineEnvelope(path, envelope);
}

/**
 * Envelope を直接保存する経路。 three-layer 等で複数 op を集約する場合に使う。
 *
 * 読み戻せない envelope は書かない。 `loadBaseline` は 2 件未満の標本を持つ記録を
 * 読めない記録として弾くため、 そのまま保存すると次の実行がまた弾いて作り直す、を
 * 繰り返して比較が永久に成立しない。 しかも「比較していない」 ことは report の
 * `n/a (baseline seeded)` からしか読めない。 書く側で止めて理由を伝える。
 */
export async function saveBaselineEnvelope(
  path: string,
  envelope: BaselineEnvelope,
): Promise<void> {
  const uncomparable = Object.entries(envelope.results).filter(
    ([, result]) => result.samples.length < 2,
  );
  if (uncomparable.length > 0) {
    const names = uncomparable.map(([key]) => key).join(', ');
    throw new Error(
      `saveBaselineEnvelope: 標本が 2 件未満の記録は baseline にできない (${names})。` +
        ' 比較には最低 2 件が要る (bootstrap CI がそれ未満で退化する)。 iterations を増やす。',
    );
  }
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
  return baselinePathFor(resolveBaselineRoot(process.cwd()), moduleName);
}

/**
 * baseline の置き場を組み立てる。 層を跨いで 1 箇所に集約するための入口。
 *
 * perf suite の多くは `path.join(REPO_ROOT, '.perf-baseline', ...)` を自前で組んで
 * いる。 そこに profile を足し忘れると、 その suite だけ環境を跨いで同じ file を
 * 共有し、 別の機械の記録を上書きする。 組み立てをここに集めて、 呼出側は層と
 * module 名だけを渡す。
 *
 * `layer` は `saas` / `framework` のような区分。 省略すると profile 直下に置く。
 */
export function baselinePathFor(root: string, moduleName: string, layer?: string): string {
  const segments = [root, '.perf-baseline', envProfile()];
  if (layer !== undefined && layer.length > 0) segments.push(layer);
  return join(...segments, `${moduleName}.json`);
}

/**
 * baseline を置き分ける環境の名前。 例 `darwin-arm64--apple-m4-pro-43c7d7--node24`。
 *
 * baseline は記録した機械でしか比較に使えない (`isComparableEnv` が platform /
 * CPU / Node 版の一致を要求する)。 同じ path に書くと、 別の機械で回した実行が
 * 前の機械の記録を自分の値で上書きし、 追跡している file が汚れる。
 *
 * 名前に入れるのは platform と CPU model と Node の major まで。 patch 版まで
 * 入れると Node を上げるたびに全 baseline が無効になる。 逆に major を落とすと
 * V8 の変化を跨いで比較してしまう。
 *
 * cpu 数は入れない。 同じ機械でも measurement 中の負荷や container の割当で
 * `os.cpus().length` が変わることがあり、 その都度 profile が分かれると
 * 比較対象を見失う。 数の違いは `isComparableEnv` が別途弾く。
 */
export function envProfile(env: BaselineEnv | ProfileEnv = profileEnv()): string {
  const slug = (value: string): string =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'unknown';
  return `${slug(env.platform)}--${cpuSlug(env.cpuModel)}--node${nodeMajor(env.nodeVersion)}`;
}

/** profile を決めるのに要る 3 値。 */
type ProfileEnv = Pick<BaselineEnv, 'platform' | 'cpuModel' | 'nodeVersion'>;

let cachedProfileEnv: ProfileEnv | undefined;

/**
 * profile を決める 3 値だけを取る。 process の生存中は 1 度しか読まない。
 *
 * `captureEnv()` を既定引数にすると `git rev-parse` が毎回走る。 profile は
 * baseline の path と report の注記の両方で引かれるため、 148 suite の実行で
 * 数百回になり実測で 300 回 9 秒かかった。 profile に要るのは platform と
 * CPU model と Node 版だけで、 いずれも process の生存中に変わらない。
 */
function profileEnv(): ProfileEnv {
  cachedProfileEnv ??= {
    platform: `${osPlatform()}-${arch()}`,
    cpuModel: cpus()[0]?.model ?? 'unknown',
    nodeVersion: process.version,
  };
  return cachedProfileEnv;
}

/** Node の major。 `v24.15.0` / `24.15.0` / `v24.0.0-nightly` のいずれも `24`。 */
export function nodeMajor(version: string): string {
  return /^v?(\d+)/.exec(version)?.[1] ?? 'unknown';
}

/**
 * CPU model の dir 名。 読める形に raw 値の指紋を足す。
 *
 * slug 化だけだと区切り文字の違いが潰れる (`Intel Core i7-1065G7` と
 * `Intel Core i7 1065G7` が同じ名前になる)。 `isComparableEnv` は raw の一致を
 * 見るので、 同じ dir を読みながら互いに比較できず再 seed し合う。
 *
 * 指紋は raw 値そのものから取る。 読める部分は人が dir を見て判別するため、
 * 指紋は衝突を避けるためだけに付ける。
 */
function cpuSlug(cpuModel: string): string {
  const readable =
    cpuModel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'unknown';
  const fingerprint = createHash('sha256').update(cpuModel).digest('hex').slice(0, 6);
  return `${readable}-${fingerprint}`;
}

/**
 * git が追跡する唯一の profile。
 *
 * checkout した直後から比較できるようにするには baseline を追跡する必要があるが
 * (#1708 T004)、 全ての機械の分を追跡すると 148 file が機械の数だけ増える。
 * 1 つを決めて追跡し、 他は `.gitignore` で外す。
 *
 * ここを変える時は `.gitignore` と `docs/quality/perf-thresholds.md` も同時に直す。
 * 3 箇所が揃っていることは `tests/canonical-profile.test.ts` が確かめる。
 */
export const CANONICAL_ENV_PROFILE = 'darwin-arm64--apple-m4-pro-43c7d7--node24';

/** 今の環境が追跡対象か。 report に「他の環境で測った」 と出すために使う。 */
export function isCanonicalEnv(env: BaselineEnv | ProfileEnv = profileEnv()): boolean {
  return envProfile(env) === CANONICAL_ENV_PROFILE;
}

/**
 * canonical でない環境で測った時に report へ出す 1 行。 canonical なら空配列。
 *
 * 数値だけを見た読み手が「git に入っている記録と比べた結果」 と受け取らないよう、
 * 実際の比較相手がどこにあるかを書く。 mock 経路と実 API 経路の両方から呼ぶ
 * (片方だけに置くと、 もう片方の report で同じ誤読が起きる)。
 */
export function nonCanonicalEnvNotice(env: BaselineEnv | ProfileEnv = profileEnv()): string[] {
  if (isCanonicalEnv(env)) return [];
  return [
    `**追跡対象でない環境で測定した** (\`${envProfile(env)}\`、 追跡分は \`${CANONICAL_ENV_PROFILE}\`)。`
      + ' 比較相手はこの環境で作った baseline で、 git に入っている記録とは別。',
    '',
  ];
}

/**
 * workspace の目印を cwd から上に辿る。 見つからなければ起点をそのまま返す。
 *
 * 起点は symlink を解いてから辿る。 解かないと、 同じ package を実体経由と
 * link 経由で起動した時に別の root を掴み、 baseline が分裂する。
 */
export function resolveBaselineRoot(start: string): string {
  let current = canonical(start);
  while (true) {
    for (const marker of ['pnpm-workspace.yaml', '.git']) {
      if (existsSync(join(current, marker))) return current;
    }
    const parent = dirname(current);
    if (parent === current) return canonical(start);
    current = parent;
  }
}

/** symlink を解いた絶対 path。 解けない (未作成 等) 場合は resolve だけで返す。 */
function canonical(target: string): string {
  try {
    return realpathSync(resolve(target));
  } catch {
    return resolve(target);
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
 * - 版 4 = op を測る前に測定系の分解能を測るようになった (#1718)。 空の関数を
 *   200 回まわしてから 1 つ目の op に入るため、 版 3 までは冷えたまま測られていた
 *   最初の op が暖まった状態で測られる。 判定軸を p95 から p10 へ移した変更自体は
 *   保存する値の意味を変えないが、 この空回しは同じ実装の測定値を動かす
 * - 版 5 = op を基準 op と 1 呼出ずつ交互に測るようになった (#1737)。 対象の各
 *   呼出の直前に基準 op が挟まるため、 cache と分岐予測の状態が版 4 までと違う。
 *   比較に要る基準 p10 が版 4 以前の記録には無い、 という理由でも作り直しになる。
 *   実 API 経路 (`runPerf3LayerLive`) は交互測定を使わないため、 この版でも
 *   `reference` を持たない記録を書く = 版だけでは 2 経路を区別できない。
 *   正規化が成立するかは `reference` の有無が決める
 * - 版 6 = baseline が「対象 p10 ÷ 基準 p10」 の履歴を持つようになった (#1739)。
 *   有意性の判断に実行間のばらつきを使うため、 履歴を持たない世代の記録では
 *   その op の幅を推定できない。 測り方そのものは版 5 と同じだが、 判定の前提が
 *   変わるので世代を分ける
 *
 * 上げる条件は「同じ実装を測っても値が変わる」 変更に限る。 閾値や判定の変更は
 * 測り方ではないので上げない。
 */
export const MEASUREMENT_PREMISE = 6;

/**
 * 保存する baseline の schema 版。 v2 で各 result に基準 op の記録が付く (#1737)。
 * 読む側は v1 も受け付ける (`normalizeToEnvelope`)。
 */
export const BASELINE_SCHEMA = 2;

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
    // **置き場と比較条件は別物** (#1729 Round 2 adversarial)。
    //
    // 置き場 (`envProfile`) は粗くてよい。 目的は「別の機械の記録を上書きしない」
    // ことで、 粗く分ければ達成できる。 細かくすると同じ機械の中で dir が乱立し、
    // 追跡する対象を決められなくなる。
    //
    // 比較条件はここで厳密に見る。 Node の patch でも V8 の最適化は変わり、
    // cpu 数が並列度を下回れば worker が待ち行列に並ぶ。 どちらも測定値を動かす。
    //
    // 一致しない時に起きるのは「同じ dir を読んで、 比較はせず作り直す」。 これは
    // 正しい挙動で、 別の機械の記録を壊すことはない (dir が分かれているため)。
    baseline.nodeVersion === current.nodeVersion &&
    baseline.platform === current.platform &&
    // 置き場は指紋付き slug で分けるが、 比較は raw の一致を要求する。 指紋は
    // 24 bit しかなく衝突し得るため、 dir が同じでも別 CPU の可能性が残る。
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
const REFERENCE_KINDS: readonly PerfReferenceKind[] = ['cpu', 'fs-read', 'fs-write'];

/**
 * 基準 op の記録を検査する。 未記録 (v1 baseline) は正常な欠落として通す。
 *
 * 記録があるのに壊れている場合は結果ごと読めない扱いにする。 field だけ落として
 * 通すと、 正規化なしの比較へ黙って落ちて実行間のずれを含んだまま gate にかかる。
 */
function hasValidReference(candidate: Record<string, unknown>): boolean {
  if (candidate.reference === undefined) return true;
  const reference = candidate.reference;
  if (reference === null || typeof reference !== 'object' || Array.isArray(reference)) return false;
  const fields = reference as Record<string, unknown>;
  if (!REFERENCE_KINDS.includes(fields.kind as PerfReferenceKind)) return false;
  if (typeof fields.name !== 'string') return false;
  // 版の記録が無いのは旧世代として通す。 比較の可否は `resolveNormalization` が
  // 版不明として弾く。 値が入っているのに数値でない記録は壊れているので落とす。
  if (fields.implVersion !== undefined) {
    if (typeof fields.implVersion !== 'number' || !Number.isInteger(fields.implVersion)) {
      return false;
    }
  }
  return typeof fields.p10 === 'number' && Number.isFinite(fields.p10) && fields.p10 > 0;
}

function isMeasureResult(value: unknown): value is MeasureResult {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.name !== 'string') return false;
  if (!hasValidReference(candidate)) return false;
  if (!Array.isArray(candidate.samples)) return false;
  // 2 件未満の記録は比較対象にならない。 bootstrap CI がこの件数で退化 CI ({0,0}) を
  // 返すため、 そのまま読むと何倍悪化しても有意にならず永久に stable になる。
  // key は既にあるので追記経路でも作り直されない。 読めない記録として扱い、
  // 次の実行で seed し直させる。
  if (candidate.samples.length < 2) return false;
  // 負の標本は経過時間として成立しない。 通すと p10 が負になり、 変化率の分母が
  // 負の値になって「悪化したのに improved」 が出る。
  if (
    !candidate.samples.every(
      (sample) => typeof sample === 'number' && Number.isFinite(sample) && sample >= 0,
    )
  ) {
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
  const schema = (parsed as { schema?: unknown } | null)?.schema;
  if (
    parsed !== null &&
    typeof parsed === 'object' &&
    !Array.isArray(parsed) &&
    (schema === 1 || schema === 2)
  ) {
    const candidate = parsed as { env?: unknown; results?: unknown };
    // schema field だけを信じると、env 欠落で diffEnv が例外を投げる。
    if (!isBaselineEnv(candidate.env) || !isResultMap(candidate.results)) return null;
    const envelope = parsed as BaselineEnvelope;
    return { ...envelope, results: backfillResults(envelope.results) };
  }

  if (isMeasureResult(parsed)) {
    return {
      schema: BASELINE_SCHEMA,
      env: UNKNOWN_ENV,
      results: backfillResults({ [parsed.name]: parsed }),
    };
  }

  if (isResultMap(parsed)) {
    return { schema: BASELINE_SCHEMA, env: UNKNOWN_ENV, results: backfillResults(parsed) };
  }

  // baseline として解釈できない中身は、無いものとして扱う。誤った比較対象を
  // 掴むより seed し直すほうが安全である。
  return null;
}

function backfillResults(
  results: Record<string, MeasureResult>,
): Record<string, MeasureResult> {
  return Object.fromEntries(
    Object.entries(results).map(([key, value]) => [key, backfillDerivedStats(value)]),
  );
}

/**
 * 保存済み baseline の派生統計を sample から作り直す。
 *
 * 保存されているのは実 sample と、そこから計算した値だけ。 統計量を 1 つ足すたびに
 * 過去の baseline には欠けた field ができ、 読み手が undefined を掴む
 * (`p10` 追加時に report 生成が落ちた)。
 *
 * 「欠けている時だけ補う」 のでは足りない。 保存値と sample が食い違う記録があると、
 * 判定は sample から計算した値を、 report は保存値を見ることになり、
 * 同じ行に `regressed` と改善を示す差分が並ぶ。 全 field を sample から作り直して、
 * 派生値の定義を `buildMeasureResult` 1 箇所に寄せる。
 *
 * sample が空の記録は `isMeasureResult` が読めない記録として弾くため、ここには来ない。
 *
 * 基準 op の記録は派生値ではないので作り直さずそのまま引き継ぐ。 落とすと、
 * 保存済みの baseline が正規化なしの比較へ黙って落ちる。
 */
function backfillDerivedStats(result: MeasureResult): MeasureResult {
  const rebuilt = buildMeasureResult(
    result.name,
    result.iterations,
    result.warmup,
    result.samples,
    result.trimmed?.percent ?? 0,
    result.warmupConverged ?? true,
  );
  // sample から作り直せない field は明示的に運ぶ。 ここに足し忘れると、 読み戻す
  // たびに黙って消える (`ratioHistory` は消えると履歴が 1 件のまま積み上がらず、
  // 実行間のばらつきを永久に推定できなくなる、 #1739)。
  if (result.reference !== undefined) rebuilt.reference = result.reference;
  if (result.ratioHistory !== undefined) rebuilt.ratioHistory = result.ratioHistory;
  return rebuilt;
}

function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'ENOENT';
}
