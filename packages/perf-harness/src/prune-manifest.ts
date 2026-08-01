/**
 * 掃除の manifest — 「この実行が測った op の一覧」 を残す経路。
 *
 * # なぜ実行の中で掃除しないか
 *
 * 測っていない op を baseline から落とす判断には「今回の op 一覧が完全である」 という
 * 前提が要る。 harness の呼出 1 回はその前提を確かめられない。 渡された `ops` が
 * module の全 op なのか、 絞り込まれた一部なのかを区別する手がかりが無いためである。
 *
 * 以前は環境変数 `KIWA_PERF_PRUNE_STALE=1` をその手がかりにしていた。 root の
 * `test:perf` だけが立てるので、 立っていれば全 package を絞り込みなしで回している、
 * という筋書きだった。 環境変数は子 process に継承されるため、 これは成り立たない。
 * `export KIWA_PERF_PRUNE_STALE=1` した shell から個別 package を実行すると、 その
 * 実行も「完全な一覧」 とみなされ、 測っていない op の記録が消えた (#1730)。
 *
 * # 代わりに何をするか
 *
 * 各実行は測った op の一覧を manifest に書き足すだけで、 baseline は落とさない。
 * suite を完走した後に orchestrator (`scripts/perf-prune-stale.mjs`) が manifest と
 * baseline を突き合わせ、 一度だけ掃除する。
 *
 * 個別 package の実行でも manifest は書かれるが、 それは「一部だけ書かれた manifest」
 * であって掃除は起きない。 掃除する側は orchestrator が完走を確かめた後にしか
 * 走らないため、 環境変数を継承しても baseline は消えない。
 *
 * 実 API 経路 (`runPerf3LayerLive`) はこの経路に参加しない。 credential の欠落で op が
 * 飛ぶため、 測れた op の一覧が module の全 op と一致しない。 一致しない一覧を
 * manifest に書くと、 credential を 1 つ外した実行が他の op の記録を消す (#1740 で
 * 守ると決めた性質)。 実 API 経路は呼出が明示した時だけ実行の中で掃除する (#1746)。
 */
import { appendFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

/** orchestrator が manifest の収集を要求する時に立てる環境変数。 */
export const PRUNE_MANIFEST_ENV = 'KIWA_PERF_PRUNE_STALE';

/** manifest の置き場を明示する環境変数。 test と orchestrator が使う。 */
export const PRUNE_MANIFEST_PATH_ENV = 'KIWA_PERF_PRUNE_MANIFEST';

/** manifest の 1 行。 JSON Lines で 1 実行 1 行を追記する。 */
export interface PruneManifestRecord {
  /** 掃除の対象になる baseline の絶対 path。 */
  baselinePath: string;
  /** この実行が測った op の key 一覧 (`<op>.serial` 等)。 */
  keys: string[];
}

/**
 * manifest の置き場を決める。
 *
 * 明示 (`KIWA_PERF_PRUNE_MANIFEST`) があればそれを使う。 無ければ baseline の path から
 * `.perf-baseline` の位置を探し、 その直下に置く。 profile ごとの dir より上に置くのは、
 * orchestrator が 1 file を読むだけで全 profile 分を掃除できるようにするため。
 *
 * `.perf-baseline` を含まない path (test の一時 dir 等) では baseline と同じ dir に置く。
 */
export function pruneManifestPath(baselinePath: string): string {
  const override = process.env[PRUNE_MANIFEST_PATH_ENV];
  if (override !== undefined && override.length > 0) {
    // 相対 path を受けると、 書く側 (package ごとの cwd) と読む側 (orchestrator の
    // cwd) で別 file を指す。 manifest が package ごとに分裂し、 掃除は黙って
    // 行われないまま stale が残る。 解決の基準を決められないので受け取らない。
    if (!path.isAbsolute(override)) {
      throw new Error(
        `${PRUNE_MANIFEST_PATH_ENV} は絶対 path で指定する (受け取った値 = ${override})。` +
          ' 相対 path は書く側と読む側で別の file を指すため受け取れない。',
      );
    }
    return override;
  }

  // 呼出の cwd は package ごとに違う (`pnpm -r` は各 package で走る)。 相対 path を
  // 返すと package ごとに別の file へ書かれ、 repo root を見る `--apply` が
  // 1 件も拾えない。 必ず絶対 path を返す。
  const resolved = path.resolve(baselinePath);

  // `.perf-baseline` を親方向に辿る。 `split` + `join` で組み直すと、 絶対 path の
  // 先頭の空 segment を `path.join` が捨てて相対 path に化ける。
  let dir = path.dirname(resolved);
  while (true) {
    if (path.basename(dir) === '.perf-baseline') {
      return path.join(dir, '.prune-manifest.jsonl');
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.join(path.dirname(resolved), '.prune-manifest.jsonl');
}

/** orchestrator が manifest を集めているか。 */
export function shouldRecordPruneManifest(): boolean {
  return process.env[PRUNE_MANIFEST_ENV] === '1';
}

/**
 * この実行が測った op を manifest に書き足す。
 *
 * 追記だけを行い、 baseline には触れない。
 *
 * **書けなかったら例外を投げる**。 握り潰してはいけない。 1 実行ぶんの行が欠けた
 * manifest は構文としては正常なので、 掃除する側はそれを完全な一覧として読む。
 * 欠けた実行が測った op は「どの実行にも現れなかった」 ことになり、 stale として
 * 消える = 握り潰すと「掃除されない」 ではなく「消しすぎる」 方に倒れる。
 *
 * 投げれば root の `test:perf` の `&&` chain が止まり、 `--apply` に到達しない。
 * 掃除が 1 回見送られるだけで、 記録は失われない。
 */
export function recordPruneManifest(baselinePath: string, keys: string[]): void {
  if (!shouldRecordPruneManifest()) return;
  // 掃除する側は別 process (別 cwd) で読む。 相対 path を書くと解決先がずれる。
  const record: PruneManifestRecord = { baselinePath: path.resolve(baselinePath), keys };
  const target = pruneManifestPath(baselinePath);
  mkdirSync(path.dirname(target), { recursive: true });
  // 1 行ずつの追記にするのは、 package が順に走る間に複数の process が同じ file へ
  // 書くため。 JSON 配列だと読み書きの往復が要り、 途中で落ちると file 全体が壊れる。
  appendFileSync(target, `${JSON.stringify(record)}\n`, 'utf8');
}
