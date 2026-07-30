/**
 * 実行内正規化の基準 op (#1737)。
 *
 * 回帰判定は別々の実行で測った値を比べるため、 実行と実行の間で機械の状態が
 * 変われば実装が同じでも差が出る。 対象 op と同じ実行の中で交互に測った基準 op
 * との比を判定に使うと、 その差が分子と分母で相殺される。
 *
 * 基準は呼出側に関数を書かせず、 harness が持つ数種類から **種類** を選ばせる。
 * 呼出側が自前の基準を書けると、 op ごとに都合のよい分母を選べてしまい、
 * 比が op をまたいで比較できる量でなくなる。
 *
 * 種類を分けるのは、 基準が対象と同じ邪魔を受けないと相殺が起きないため。
 * 実測 (`scripts/reference-op-probe.mjs`、 8 pass の半数を背景負荷下で測定) では
 * 種類を外すと素の値より悪化する。
 *
 * 各欄は `素の振れ幅 → 比の振れ幅`。 素の値が列ごとに違うのは、 対象を候補ごとに
 * 測り直すため pass の中の測定時点がずれるから。 同じ組の 2 値で読む。
 *
 * | 対象 op | ÷ cpu | ÷ fs-read | ÷ fs-write |
 * |---|---|---|---|
 * | fs read (`cli-test` `readFile` 相当) | 170 → 171% | 135 → **17%** | 306 → 51% |
 * | fs write (`cli-test` `writeFile` 相当) | 270 → 313% | 127 → 75% | 123 → **32%** |
 * | 20 連続 write (`file_scaffold_workflow` 相当) | 332 → 379% | 322 → 62% | 63 → **15%** |
 * | 2ms の演算 | 16 → **8%** | 12 → 175% | 4 → 172% |
 * | `JSON.parse(JSON.stringify(…))` | 20 → **10%** | 200 → 124% | 61 → 67% |
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { PerfReferenceKind } from './types.js';

/**
 * CPU 基準の反復数。 1 回あたり約 0.09ms (Apple M 系 / Node 24 実測) で、
 * 計時の粒度 (何もしない呼出で約 0.0002ms) の数百倍にあたる。
 *
 * 粒度に近い基準は分母にならない。 何もしない呼出そのものを基準にすると、
 * 基準自身の実行間振れ幅が 83% になり、 比が対象の振れ幅を映さず基準の
 * 振れ幅を映す (同 probe 実測)。
 */
const CPU_ROUNDS = 20_000;

/**
 * 基準 op の実装の版。 **この file の op の中身 ・ `CPU_ROUNDS` ・ `FS_PAYLOAD` を
 * 変えたら 1 上げる。 同時に `baseline.ts` の `MEASUREMENT_PREMISE` も上げる。**
 *
 * 版を記録しないと、 種類 (`cpu` 等) が同じままで分母の大きさだけが変わる。 例えば
 * `CPU_ROUNDS` を 2 倍にすると、 保存済み baseline との比較で倍率が約 0.5 になり、
 * 全 op が 50% の改善として報告される。 実在する 2 倍の悪化がその中に埋もれる。
 *
 * 版が違う記録とは比較せず、 その実行で入れ替える (`resolveNormalization`)。
 */
export const REFERENCE_IMPL_VERSION = 1;

/** fs 基準が読み書きする内容。 syscall の往復が費用の主になる大きさにする。 */
const FS_PAYLOAD = 'x'.repeat(64);

/** 基準 op 1 件。 */
export interface PerfReferenceOp {
  kind: PerfReferenceKind;
  /** report と baseline に残る名前。 */
  name: string;
  /** 実装の版。 `REFERENCE_IMPL_VERSION` をそのまま持つ。 */
  implVersion: number;
  fn: () => Promise<void>;
}

/**
 * 基準 op の一式。 fs 系は temp dir を要するので、 使い終わりに `dispose` する。
 */
export interface PerfReferenceSet {
  get(kind: PerfReferenceKind): PerfReferenceOp;
  dispose(): void;
}

/** 既定の基準の種類。 kiwa の op の大半は in-memory の mock で fs に触れない。 */
export const DEFAULT_REFERENCE_KIND: PerfReferenceKind = 'cpu';

/** 使える種類の一覧。 `types.ts` の `PerfReferenceKind` と 1:1 で対応させる。 */
export const REFERENCE_KINDS: readonly PerfReferenceKind[] = ['cpu', 'fs-read', 'fs-write'];

export function referenceOpName(kind: PerfReferenceKind): string {
  return `harness.reference.${kind}`;
}

/**
 * 基準 op 一式を作る。 temp dir は fs 系の基準が最初に要求された時にだけ掘る。
 */
export function createReferenceOps(): PerfReferenceSet {
  let dir: string | null = null;
  let readPath: string | null = null;
  let writePath: string | null = null;

  const ensureDir = (): string => {
    if (dir === null) dir = mkdtempSync(join(tmpdir(), 'kiwa-perf-reference-'));
    return dir;
  };

  const ensureReadPath = (): string => {
    if (readPath === null) {
      readPath = join(ensureDir(), 'reference-read.txt');
      writeFileSync(readPath, FS_PAYLOAD, 'utf8');
    }
    return readPath;
  };

  const ensureWritePath = (): string => {
    if (writePath === null) writePath = join(ensureDir(), 'reference-write.txt');
    return writePath;
  };

  const build = (kind: PerfReferenceKind): PerfReferenceOp => {
    const name = referenceOpName(kind);
    if (kind === 'cpu') {
      return {
        kind,
        name,
        implVersion: REFERENCE_IMPL_VERSION,
        // 純粋な演算。 fs にも allocator にも触れない。 結果を捨てると V8 が
        // loop ごと消せるため、 消せない形で参照する。
        fn: async () => {
          let acc = 0;
          for (let index = 0; index < CPU_ROUNDS; index += 1) {
            acc = (acc * 31 + index) % 1_000_003;
          }
          if (acc === -1) throw new Error('unreachable');
        },
      };
    }
    if (kind === 'fs-read') {
      const path = ensureReadPath();
      return {
        kind,
        name,
        implVersion: REFERENCE_IMPL_VERSION,
        fn: async () => { await readFile(path, 'utf8'); },
      };
    }
    if (kind === 'fs-write') {
      // 同じ file を上書きする。 file を増やすと dir の entry 数が実行のたびに
      // 変わり、 基準自身の費用が実行の長さに依存する。
      const path = ensureWritePath();
      return {
        kind,
        name,
        implVersion: REFERENCE_IMPL_VERSION,
        fn: async () => { await writeFile(path, FS_PAYLOAD, 'utf8'); },
      };
    }
    // 未知の種類を既知の基準に落とさない。 落とすと、 その名前で baseline に記録され、
    // 次の実行が「同じ種類」 と判定して別物どうしの比を比べる。
    throw new Error(
      `createReferenceOps: 未知の基準 op の種類 ${JSON.stringify(kind)}。` +
        ` 使える値は ${REFERENCE_KINDS.join(' / ')}。`,
    );
  };

  const cache = new Map<PerfReferenceKind, PerfReferenceOp>();

  return {
    get(kind: PerfReferenceKind): PerfReferenceOp {
      const cached = cache.get(kind);
      if (cached !== undefined) return cached;
      const built = build(kind);
      cache.set(kind, built);
      return built;
    },
    dispose(): void {
      if (dir !== null) {
        rmSync(dir, { recursive: true, force: true });
        dir = null;
        readPath = null;
        writePath = null;
        cache.clear();
      }
    },
  };
}
