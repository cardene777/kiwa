#!/usr/bin/env node
/**
 * perf baseline の掃除 — suite を完走した後に一度だけ走る orchestrator。
 *
 * # なぜ実行の中で掃除しないか
 *
 * 測っていない op を baseline から落とすには「今回の op 一覧が完全である」 という前提が
 * 要る。 harness の呼出 1 回はそれを確かめられない (渡された ops が module の全 op なのか
 * 一部なのか区別する手がかりが無い)。
 *
 * 以前は環境変数 `KIWA_PERF_PRUNE_STALE=1` を手がかりにしていたが、 環境変数は子 process
 * に継承されるため成り立たなかった。 export した shell から個別 package を実行すると、
 * 絞り込まれた一覧が「完全な一覧」 とみなされて記録が消えた (#1730)。
 *
 * # 代わりに何をするか
 *
 * 各実行は測った op を manifest (JSON Lines) に書き足すだけで baseline には触れない。
 * suite を完走した後に本 script が manifest を読み、 baseline から「どの実行にも現れ
 * なかった op」 を落とす。
 *
 * 掃除が起きるのは本 script が走った時だけで、 本 script は `test:perf` の最後にしか
 * 走らない。 環境変数を export しても個別 package の実行では走らないため、 baseline は
 * 消えない。
 *
 * # 使い方
 *
 *   node scripts/perf-prune-stale.mjs --reset   # 前回の manifest を消す (suite の前)
 *   node scripts/perf-prune-stale.mjs --apply   # manifest と突き合わせて掃除 (suite の後)
 *
 * `--apply` は `&&` で繋いで完走時だけ走らせる。 途中で落ちた suite の manifest は
 * 不完全なので、 それで掃除すると測れなかった op の記録が消える。
 */
import { randomUUID } from 'node:crypto';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const override = process.env['KIWA_PERF_PRUNE_MANIFEST'];
if (override !== undefined && override.length > 0 && !path.isAbsolute(override)) {
  // 書く側は package ごとの cwd で解決する。 相対値だと読む側と別 file を指し、
  // 掃除が黙って行われない。 producer 側 (`prune-manifest.ts`) と同じ制約。
  console.error(`[perf-prune] KIWA_PERF_PRUNE_MANIFEST は絶対 path で指定する (${override})`);
  process.exit(64);
}

/**
 * 掃除してよい baseline の範囲。
 *
 * manifest の `baselinePath` は harness が書くが、 file は書き換え可能なので
 * 値をそのまま信じない。 既定ではこの repo の `.perf-baseline` 配下だけを触る。
 * 範囲外を指す record は消さずに数えて報告する。
 *
 * `--baseline-root <dir>` で差し替えられる (test が一時 dir を使うため)。
 */
const rootFlagIndex = process.argv.indexOf('--baseline-root');
const BASELINE_ROOT =
  rootFlagIndex >= 0 && process.argv[rootFlagIndex + 1] !== undefined
    ? path.resolve(process.argv[rootFlagIndex + 1])
    : path.join(REPO_ROOT, '.perf-baseline');

const MANIFEST_PATH =
  override !== undefined && override.length > 0
    ? override
    : path.join(REPO_ROOT, '.perf-baseline', '.prune-manifest.jsonl');

/** 完走の印。 `--seal` が書き、 `--apply` が消費する。 */
const SEAL_PATH = `${MANIFEST_PATH}.seal`;
/** この掃除の周期を表す id。 `--reset` が書く。 */
const RUN_ID_PATH = `${MANIFEST_PATH}.runid`;

/**
 * `target` が `root` の中にあるか。
 *
 * 文字列だけで比べると、 root 配下に外を指す symlink を置くだけで範囲外へ書き戻せる
 * (`path.relative` は symlink を解決しない)。 実体まで解決してから比べる。
 *
 * 解決するのは親 dir までにする。 target 自身は書き換える file なので、 それ自体が
 * symlink なら追随せず弾きたい。 親が範囲内でも target が symlink なら拒否する。
 */
function isInside(root, target) {
  let realRoot;
  let realParent;
  try {
    realRoot = realpathSync(root);
    realParent = realpathSync(path.dirname(target));
  } catch {
    // 解決できない (存在しない / 権限が無い) 対象は範囲外に倒す。
    return false;
  }
  const rel = path.relative(realRoot, path.join(realParent, path.basename(target)));
  if (rel.length === 0 || rel.startsWith('..') || path.isAbsolute(rel)) return false;
  // target 自身が symlink なら追随しない。
  try {
    if (lstatSync(target).isSymbolicLink()) return false;
  } catch {
    // 未作成の baseline は掃除の対象にならないので、 ここに来たら範囲外でよい。
    return false;
  }
  return true;
}

/**
 * manifest を読み、 baseline path ごとに「測った op の key」 を集める。
 *
 * 同じ baseline に複数の実行が書き足すことがある (同 module を複数 file が測る形)。
 * 和を取るのは、 片方の実行だけを見て掃除すると、 もう片方が測った op が落ちるため。
 *
 * 壊れた行は読み飛ばす。 追記の途中で process が落ちると末尾が欠けた行が残るが、
 * その 1 行のために掃除全体を止める理由は無い。 ただし欠けた行があった baseline は
 * 掃除の対象から外す (不完全な一覧で掃除すると記録が消える)。
 */
function readManifest() {
  if (!existsSync(MANIFEST_PATH)) return { measured: new Map(), damaged: new Set() };
  const measured = new Map();
  const damaged = new Set();
  const lines = readFileSync(MANIFEST_PATH, 'utf8').split('\n');
  for (const line of lines) {
    if (line.trim().length === 0) continue;
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      // どの baseline の行だったか判らないため、 特定の baseline を外すことができない。
      // 掃除全体を止める側に倒す。
      damaged.add('*');
      continue;
    }
    const baselinePath = record?.baselinePath;
    const keys = record?.keys;
    if (typeof baselinePath !== 'string' || !Array.isArray(keys)) {
      damaged.add('*');
      continue;
    }
    const existing = measured.get(baselinePath) ?? new Set();
    for (const key of keys) if (typeof key === 'string') existing.add(key);
    measured.set(baselinePath, existing);
  }
  return { measured, damaged };
}

/** baseline を読む。 読めない file は掃除の対象にしない。 */
function readBaseline(baselinePath) {
  try {
    const parsed = JSON.parse(readFileSync(baselinePath, 'utf8'));
    if (parsed === null || typeof parsed !== 'object') return null;
    if (parsed.results === null || typeof parsed.results !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * baseline を書き戻す。 同じ dir の一時 file へ書いてから rename で置き換える。
 *
 * `writeFileSync` は既存 file を truncate してから書く。 その間に落ちると空か
 * 途中までの JSON が残り、 その file の測定履歴を丸ごと失う。 掃除は「不要な key を
 * 落とす」 操作なので、 失敗して全部失うのは元の目的と釣り合わない。
 * `baseline.ts` の保存経路と同じ作法に揃える。
 */
function writeBaselineAtomic(target, envelope) {
  const tmp = `${target}.tmp-${process.pid}`;
  try {
    writeFileSync(tmp, `${JSON.stringify(envelope, null, 2)}\n`, 'utf8');
    renameSync(tmp, target);
  } catch (error) {
    rmSync(tmp, { force: true });
    throw error;
  }
}

function reset() {
  rmSync(MANIFEST_PATH, { force: true });
  rmSync(SEAL_PATH, { force: true });
  // この周期を表す id を置く。 `--seal` がこの id を印に写し、 `--apply` は
  // 両者の一致を要求する。 途中で落ちた周期の manifest には印が付かないため、
  // 後から `--apply` を直接叩いても掃除は起きない。
  writeFileSync(RUN_ID_PATH, `${randomUUID()}\n`, 'utf8');
  console.log(`[perf-prune] manifest を消した (${path.relative(REPO_ROOT, MANIFEST_PATH)})`);
}

/**
 * suite が完走したことを印にする。
 *
 * `test:perf` の `&&` chain で suite の後ろに置く。 途中で落ちればここへ到達しない。
 * `--apply` は印が無ければ掃除しないので、 不完全な manifest が残っても消えない。
 */
function seal() {
  if (!existsSync(RUN_ID_PATH)) {
    console.error('[perf-prune] --reset を経ていない。 印を付けない。');
    process.exitCode = 1;
    return;
  }
  writeFileSync(SEAL_PATH, readFileSync(RUN_ID_PATH, 'utf8'), 'utf8');
  console.log('[perf-prune] 完走の印を付けた。');
}

function apply() {
  // 印が無い / 周期が違う manifest は掃除しない。 落ちた周期の残骸や、 個別実行が
  // 残した一部だけの manifest を後から適用すると、 測っていない op が消える。
  if (!existsSync(SEAL_PATH) || !existsSync(RUN_ID_PATH)) {
    console.error('[perf-prune] 完走の印が無い。 掃除を行わない (--reset → suite → --seal の順に通す)。');
    process.exitCode = 1;
    return;
  }
  if (readFileSync(SEAL_PATH, 'utf8').trim() !== readFileSync(RUN_ID_PATH, 'utf8').trim()) {
    console.error('[perf-prune] 印がこの周期のものでない。 掃除を行わない。');
    process.exitCode = 1;
    return;
  }

  const { measured, damaged } = readManifest();

  if (damaged.has('*')) {
    console.error('[perf-prune] manifest に読めない行がある。 掃除を行わない。');
    process.exitCode = 1;
    return;
  }
  if (measured.size === 0) {
    console.log('[perf-prune] manifest が空。 掃除する対象なし。');
    return;
  }

  let prunedFiles = 0;
  let prunedKeys = 0;
  let outOfScope = 0;

  for (const [baselinePath, keys] of measured) {
    // 範囲外を指す record は触らない。 manifest は書き換え可能な file なので、
    // 値をそのまま信じて任意の JSON を書き換えない。
    const resolved = path.resolve(baselinePath);
    if (!isInside(BASELINE_ROOT, resolved)) {
      outOfScope += 1;
      console.warn(`[perf-prune] skip (掃除の範囲外): ${resolved}`);
      continue;
    }

    const envelope = readBaseline(resolved);
    if (envelope === null) continue;

    const stale = Object.keys(envelope.results).filter((key) => !keys.has(key));
    if (stale.length === 0) continue;

    // 全 key が消える形は掃除しない。 manifest 側が壊れているか、 baseline が
    // 別の測定条件で書かれている可能性のほうが高く、 落とすと記録を丸ごと失う。
    if (stale.length === Object.keys(envelope.results).length) {
      console.warn(`[perf-prune] skip (全 key が対象になる): ${path.relative(REPO_ROOT, resolved)}`);
      continue;
    }

    for (const key of stale) delete envelope.results[key];
    writeBaselineAtomic(resolved, envelope);
    prunedFiles += 1;
    prunedKeys += stale.length;
    console.log(
      `[perf-prune] ${path.relative(REPO_ROOT, resolved)} から ${stale.length} 件を落とした (${stale.join(', ')})`,
    );
  }

  if (outOfScope > 0) {
    console.warn(`[perf-prune] 範囲外の record を ${outOfScope} 件見送った。`);
  }

  console.log(`[perf-prune] 完了。 ${prunedFiles} file / ${prunedKeys} key を掃除した。`);
  // 印を消費する。 残すと同じ manifest を 2 度適用できる。
  rmSync(MANIFEST_PATH, { force: true });
  rmSync(SEAL_PATH, { force: true });
  rmSync(RUN_ID_PATH, { force: true });
}

const mode = process.argv[2];
if (mode === '--reset') {
  mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  reset();
} else if (mode === '--seal') {
  seal();
} else if (mode === '--apply') {
  apply();
} else {
  console.error('usage: perf-prune-stale.mjs --reset | --seal | --apply');
  process.exitCode = 64;
}
