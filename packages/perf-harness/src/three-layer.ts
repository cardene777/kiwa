/**
 * runPerf3Layer — the reusable 3-layer perf harness landed in v1.14-post.
 *
 * v1.13-1 shipped `measure` alone which caps at "serial mock is fast" — not
 * a real perf guarantee. #739 introduced 3-layer coverage:
 *
 * - **serial** — `measure` at concurrency 1 (baseline latency)
 * - **concurrent** — `measureConcurrent` at N workers (contention / bottleneck)
 * - **memory** — `measureMemory` (arrayBuffers axis, GC-independent)
 *
 * Plus baseline auto-seed + regression detection (20 % p10 delta + bootstrap CI)
 * + a markdown report with SSOT threshold references.
 *
 * Callers declare their target ops + thresholds and this helper drives the
 * whole pipeline. See docs/quality/perf-thresholds.md for the threshold
 * SSOT.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { measureAlternating, measureHarnessResolution } from './measure.js';
import { measureConcurrent } from './concurrent.js';
import { measureMemory, type MemorySample } from './memory.js';
import {
  INTER_RUN_SPREAD_MULTIPLE,
  MAX_RATIO_HISTORY,
  MIN_RATIO_HISTORY,
  RESOLUTION_FLOOR_MULTIPLE,
  detectRegression,
  hasSameMeasurementConfig,
  observedRatio,
  resolveNormalization,
} from './regression.js';
import { DEFAULT_REFERENCE_KIND, createReferenceOps } from './reference.js';
import {
  BASELINE_SCHEMA,
  BaselineRevisionConflictError,
  captureEnv,
  defaultBaselinePath,
  isComparableEnv,
  nonCanonicalEnvNotice,
  loadBaselineSnapshot,
  saveBaselineEnvelope,
} from './baseline.js';
import { applyRatioHistory, planBaselineWrite, uncomparableVerdict } from './baseline-write.js';
import type { RatioHistoryUpdate } from './baseline-write.js';
import { recordPruneManifest } from './prune-manifest.js';
import type { UncomparableVerdict } from './baseline-write.js';
import { evaluatePerfGate } from './gate.js';
import { emitPerfReport, formatMemoryCalls, formatMemoryWindows, formatMs } from './report.js';
import type { MeasureResult, PerfReferenceKind, RegressionResult } from './types.js';

export interface PerfOpSpec {
  name: string;
  fn: () => Promise<unknown> | unknown;
  /**
   * Serial p95 hard cap (ms). Source: docs/quality/perf-thresholds.md.
   */
  serialP95CapMs: number;
  /**
   * Optional override for concurrent cap. Default = 2 × serial cap per SSOT.
   */
  concurrentP95CapMs?: number;
  /**
   * 回帰と判定する p10 差の下限 (ms)。
   *
   * 既定はこの実行で測った測定系の分解能 (何もしない関数を同じ経路で呼んだ費用) の
   * `RESOLUTION_FLOOR_MULTIPLE` 倍に、 実行内正規化の倍率を掛けた値。 分解能も今回の
   * 実行で測った値なので、 差と同じ単位 (baseline を測った時の機械の ms) へ揃える。
   * 分解能より小さい差は op ではなく harness 自身の往復を見ているため判定に使えない。
   *
   * 明示すると既定を上書きする。 その値には倍率を掛けない (どの実行の測定値でもない
   * 定数のため、 掛けると gate の感度がその日の機械で変わる)。 実際に効いた値は
   * report の「下限」 列に出る。
   */
  regressionMinDeltaMs?: number;
  /**
   * 実行内正規化の基準 op の種類 (default `cpu`)。
   *
   * 回帰判定は、 同じ実行の中で交互に測った基準 op との比で行う。 基準は対象と
   * 同じ邪魔を受けるものでないと相殺が起きないため、 fs を触る op は `fs-read` /
   * `fs-write` を宣言する。 種類を外すと素の値より悪化する
   * (fs read の実行間振れ幅 = 素 135% / `fs-read` 基準 17% / `cpu` 基準 171%、
   * `scripts/reference-op-probe.mjs` 実測)。
   *
   * 選び方と却下した案は `docs/quality/perf-thresholds.md` § In-run normalization。
   */
  referenceKind?: PerfReferenceKind;
  /**
   * Optional override for memory arrayBuffers cap.
   * Default = 100 KB across 200 iterations.
   */
  memoryArrayBuffersCapBytes?: number;
  /**
   * memory 軸の判定を外す理由。 空でない文字列を渡した op だけが対象。
   *
   * `arrayBuffers` は Node の Buffer pool の伸びをそのまま拾うため、 fs を
   * 多く触る対象では実行ごとの振れ幅が上限と同規模になり、 実装の保持量を
   * 表さなくなる (#1708 で fs 系 op の振れ幅が ±70KB、 上限が 100KB と実測)。
   * その状態で判定を続けても、 通るか落ちるかが実装と無関係に決まる。
   *
   * 上限値の引き上げではなく除外にしているのは、 「この op は測れていない」 を
   * report に残すため。 上限を上げると測れているように見えてしまう。
   * 軸そのものの作り直しは別 Issue で扱う。
   */
  memoryGateWaived?: string;
  /**
   * 回帰判定を gate から外す理由。 空でない文字列を渡した op だけが対象。
   *
   * 回帰判定は別々の実行で測った値を比べるため、 その op の実行ごとの振れ幅が
   * 閾値 20% を超えていると、 実装と無関係に判定が入れ替わる。 判定軸を分布の
   * 下側 (p10) へ移し (#1718)、 さらに同じ実行の中で測った基準 op との比で
   * 判定するようにして (#1737) 大半の op はこの条件を満たすようになったが、
   * 基準と邪魔を共有しない op (子 process の起動を含むもの 等) は残る。
   *
   * 判定は report に残したまま gate から外す。 閾値を緩めたり下限を実測の
   * 振れ幅まで引き上げたりすると、 測れているように見えてしまう。
   * 指定する時は理由に実測の根拠を書く。 落ちたから付ける、 はしない。
   *
   * 上限 (serial / concurrent) の判定はこの指定でも外れない。 上限は 1 回の
   * 実行の中で完結する判定で、 実行間の振れ幅の影響を受けないため。
   */
  regressionGateWaived?: string;
}

export interface RunPerf3LayerInput {
  moduleName: string;
  ops: PerfOpSpec[];
  /**
   * Absolute path to the markdown report file. Overwritten each run.
   */
  reportPath: string;
  /**
   * Optional override for baseline path. Default = defaultBaselinePath(moduleName).
   */
  baselinePath?: string;
  /**
   * Iterations for the serial phase. Default 200.
   */
  serialIterations?: number;
  /**
   * Warmup iterations for the serial phase (discarded). Default 5.
   */
  serialWarmup?: number;
  /**
   * Worker count for the concurrent phase. Default 10.
   */
  concurrency?: number;
  /**
   * Per-worker iterations for the concurrent phase. Default 50.
   */
  iterationsPerWorker?: number;
  /**
   * Iterations for the memory phase. Default 200.
   */
  memoryIterations?: number;
  /**
   * 計測区間の前に空回しする回数。 既定は `memoryIterations` の 1 割 (最低 3)。
   *
   * 初回の呼出に混ざる 1 回きりの確保を計測区間の外へ出すためのもの。
   * fs を触る対象では Node の Buffer pool が最初の数回で 8KB 単位に伸び、
   * その分が反復数で割られて「1 回あたりの保持」 として上限判定に載る。
   */
  memoryWarmup?: number;
  /**
   * memory 測定を何区間に分けるか (default 2、 #1719)。
   *
   * 空回しは固定回数なので、 反復数が増えるとその先で Buffer pool がまた伸びる。
   * 1 区間しか測らないとその伸びが判定に載り、 同じ実装を測り直しただけで
   * `file_scaffold_workflow` の増分が 118,387 から 198,899 B まで動いて
   * 上限 102,400 B を跨いでいた。
   *
   * 区間を分けると手前の区間が反復数ぶんの伸びを引き受け、 最後の区間には
   * 飽和後の増分だけが残る。 その最後の区間を上限判定に使う。
   *
   * 1 を渡すと従来どおりの 1 区間に戻る。 `fn` の呼出回数が区間の数だけ増えるため、
   * 1 反復が重い op で測定時間を抑えたい場合の逃げ道として残してある。
   */
  memoryWindows?: number;
  /**
   * 回帰判定を `allPassed` に反映するか (default false)。
   *
   * 回帰判定は別々の実行で測った値を比べるため、 op の実行ごとの振れ幅が
   * 閾値 20% を下回っていて初めて成立する。 実行内正規化で実行全体に乗る
   * ずれは消えた (全 492 op の比の変化の中央値が 2 回の実測とも 0.0%、 #1737) が、
   * op 個別のばらつきは残り、 |変化| の p90 が 17-20% と閾値のすぐ下にある。
   *
   * 既定を true にすると、 実装を変えていないのに毎回 20-30 package が落ちる
   * (実測 = 2 回目 22 / 3 回目 29)。 上限の実 breach がその中に埋もれるため、
   * 既定は false のままにしてある。 詳細と残りの根は
   * `docs/quality/perf-thresholds.md` § In-run normalization。
   *
   * 上限 (serial / concurrent / memory) の判定は 1 回の実行の中で完結するので
   * この指定に関わらず従来どおり反映する。
   */
  regressionGate?: boolean;
  /**
   * 回帰と判定する相対閾値 (default 0.2 = 20%)。
   *
   * `runPerf3LayerStrict` が 0.1 を渡す。 呼出が指定しなければ既定のまま。
   */
  regressionThreshold?: number;
  /**
   * 回帰判定の信頼区間 (default 0.95)。
   *
   * `runPerf3LayerStrict` が 0.99 を渡す。 見逃しが致命的な経路で幅を広げ、
   * 有意と認める条件を厳しくする。
   */
  regressionConfidenceLevel?: number;
  /**
   * Path (relative to reportPath's directory tree) that the report references
   * as the threshold SSOT. Default: '../../quality/perf-thresholds'.
   */
  thresholdDocLink?: string;
  /**
   * 今回測っていない op を baseline から削除する。
   *
   * op 名を別処理へ付け替えたときに無関係な過去値と比較しないための掃除だが、
   * 常に有効だと絞り込み実行で op が一度欠けるだけで過去値が消える。
   * 次の完全実行では再 seed されて直前の退行を見逃す。
   *
   * **渡す側が「この `ops` が当該 baseline の全 op である」 ことを保証する**。
   * 絞り込んだ一覧に true を付けると、 外した op の記録が落ちる。
   *
   * 環境変数 `KIWA_PERF_PRUNE_STALE` はこの判断に使わない。 環境変数は子 process に
   * 継承されるため、 export した shell から個別 package を実行すると絞り込まれた
   * 一覧が「完全な一覧」 とみなされて記録が消えた (#1730)。 kiwa の `test:perf` は
   * suite を完走した後に `scripts/perf-prune-stale.mjs` で一度だけ掃除する経路に
   * 移してあるので、 この option を渡す必要はない。
   */
  pruneStaleBaselineOps?: boolean;
  /**
   * GC を呼べない測定を memory gate の失敗として扱う (default false)。
   *
   * `--expose-gc` 無しの測定は解放される一時使用まで拾うため上限との比較が
   * 成立しない。 ただし既定で失敗にすると、 GC 無しでも動いていた既存の
   * 呼出が一斉に落ちる。 kiwa 内部の suite のように前提を固定できる呼出だけが
   * 有効化する。
   */
  requireGc?: boolean;
}

export interface OpOutcome {
  name: string;
  serial: MeasureResult;
  /** serial と 1 呼出ずつ交互に測った基準 op の実測値。 */
  serialReference: MeasureResult;
  concurrent: MeasureResult;
  memory: MemorySample;
  serialGatePassed: boolean;
  concurrentGatePassed: boolean;
  memoryGatePassed: boolean;
  /**
   * `n/a` の 3 種の意味は `uncomparableVerdict` が SSOT。 記録の有無と、
   * この実行で baseline を書けたかで分かれる。
   */
  regressionVerdict: 'stable' | 'improved' | 'regressed' | UncomparableVerdict;
  /**
   * verdict だけでは伝わらない判定の状態。 stable の理由が「変化が無い」 なのか
   * 「差が絶対下限に届かず判定できない」 なのかを report 読者に見せるために持つ。
   * 補足が要らない場合は undefined。
   */
  regressionNote?: string;
  /**
   * 判定の内訳。 比較対象が無かった実行では undefined。
   *
   * verdict だけを返すと、 正規化が効いたのか (normalizationScale) と、
   * 換算後の値が baseline とどれだけ離れたのかを呼出側から確認できない。
   */
  regression?: RegressionResult;
}

export interface RunPerf3LayerResult {
  outcomes: OpOutcome[];
  allPassed: boolean;
  baselineSeeded: boolean;
}

/**
 * report の位置から閾値 SSOT (`docs/quality/perf-thresholds`) への相対 link を
 * 組み立てる。 report を階層の深い場所へ置いても外れないようにする。
 * `docs/` 配下でない場合は従来の固定値へ落とす。
 */
function resolveThresholdDocLink(reportPath: string): string {
  const docsMarker = `${path.sep}docs${path.sep}`;
  const at = path.resolve(reportPath).lastIndexOf(docsMarker);
  if (at < 0) return '../../quality/perf-thresholds';

  const docsRoot = path.resolve(reportPath).slice(0, at + docsMarker.length - 1);
  const relative = path.relative(
    path.dirname(path.resolve(reportPath)),
    path.join(docsRoot, 'quality', 'perf-thresholds'),
  );
  return relative.split(path.sep).join('/');
}

export async function runPerf3Layer(input: RunPerf3LayerInput): Promise<RunPerf3LayerResult> {
  const serialIterations = input.serialIterations ?? 200;
  const serialWarmup = input.serialWarmup ?? 5;
  const concurrency = input.concurrency ?? 10;
  const iterationsPerWorker = input.iterationsPerWorker ?? 50;
  const memoryIterations = input.memoryIterations ?? 200;
  // 1 回きりの確保を計測区間の外へ出す。 serial 側には warmup があるのに
  // memory 側には無く、 Node の Buffer pool の初期確保が「1 回あたりの保持」 として
  // 上限判定に載っていた (#1708)。
  const memoryWarmup = input.memoryWarmup ?? Math.max(3, Math.ceil(memoryIterations / 10));
  // 空回しは固定回数のため、 反復数ぶんの pool の伸びまでは吸えない。
  // 手前の区間にそれを引き受けさせ、 最後の区間の増分を判定に使う (#1719)。
  const memoryWindows = input.memoryWindows ?? 2;
  const memoryCapDefault = 100 * 1024;
  const regressionThreshold = input.regressionThreshold ?? 0.2;
  const regressionConfidenceLevel = input.regressionConfidenceLevel ?? 0.95;
  const baselinePath = input.baselinePath ?? defaultBaselinePath(input.moduleName);
  // 固定の相対 path だと、report を 1 階層深く置いた瞬間にリンクが外れる。
  // 実際 framework/ と saas/ 配下の 20 件が docs/quality-reports/quality/ を
  // 指して 404 になっていた。report の位置から SSOT までを毎回組み立てる。
  const thresholdDocLink = input.thresholdDocLink ?? resolveThresholdDocLink(input.reportPath);

  // 中身と版を 1 回の read から採る。 別々に読むと、 その間に別の実行が書いた時に
  // 「古い中身 + 新しい版」 の組ができ、 照合が通って上書きしてしまう (#1757)。
  const baselineSnapshot = await loadBaselineSnapshot(baselinePath);
  const loadedBaseline =
    baselineSnapshot.envelope === null
      ? null
      : { envelope: baselineSnapshot.envelope, envMismatch: baselineSnapshot.envMismatch };
  const baselineRevisionAtLoad = baselineSnapshot.revision;
  // file が無いのと、file はあるのに読めないのは別物。 前者は初回なので比較が
  // 無いのが正しく、後者は「比較するはずだったのに壊れていた」 状態。 どちらも
  // 読み込みは null を返して作り直す (誤った比較対象を掴むより安全) が、
  // 後者を黙って通すと、gate を有効にした実行が回帰を一度も見ずに成功する。
  const baselineUnreadable = loadedBaseline === null && existsSync(baselinePath);
  // 測定の前提が違う baseline とは比べない。とくに GC を呼べるかどうかで
  // memory 測定の意味が変わるため、実装が同じでも回帰と判定されてしまう。
  const priorBaselineLoaded =
    loadedBaseline && isComparableEnv(loadedBaseline.envelope.env, captureEnv())
      ? loadedBaseline
      : null;
  const priorBaseline: Record<string, MeasureResult> | null = priorBaselineLoaded
    ? priorBaselineLoaded.envelope.results
    : null;
  const combinedForBaseline: Record<string, MeasureResult> = {};
  const outcomes: OpOutcome[] = [];
  // 比較が成立しなかった op と、 その時点で記録があったか。 verdict は書込の
  // 可否が決まるまで確定しない (後続 op が上限を割ると書けなくなる) ため、
  // loop では「書けなかった」 側の値を入れておき、 書けたら後段で上げる。
  const uncompared = new Map<string, boolean>();
  // この実行で観測した比。 書込の段で baseline の履歴に積む (#1739)。
  const ratioUpdates = new Map<string, RatioHistoryUpdate>();

  // 回帰判定の絶対下限を、この実行の中で測って決める。 固定値だと機械と Node の版で
  // 意味が変わり、 速い op では「差が下限に届かないので永久に stable」 になる。
  // op の測定と同じ条件で取るため、 op を回す前に 1 度だけ測る。
  const resolutionMs = await measureHarnessResolution({
    iterations: serialIterations,
    warmup: serialWarmup,
  });

  // 基準 op は module 全体で 1 組を使い回す。 fs 系は temp dir を掘るので、
  // op ごとに作ると dir の数だけ実行が長くなり、 その差が測定に乗る。
  const references = createReferenceOps();
  try {
    for (const op of input.ops) {
      const referenceKind = op.referenceKind ?? DEFAULT_REFERENCE_KIND;
      const alternating = await measureAlternating({
        name: `${op.name}.serial`,
        iterations: serialIterations,
        warmup: serialWarmup,
        reference: references.get(referenceKind),
        fn: async () => {
          await op.fn();
        },
      });
      const serial = alternating.target;
      const concurrent = await measureConcurrent({
        name: `${op.name}.concurrent`,
        concurrency,
        iterationsPerWorker,
        warmup: 2,
        fn: async () => {
          await op.fn();
        },
      });
      const memory = await measureMemory({
        fn: async () => {
          await op.fn();
        },
        iterations: memoryIterations,
        warmup: memoryWarmup,
        windows: memoryWindows,
      });

      const concurrentCap = op.concurrentP95CapMs ?? op.serialP95CapMs * 2;
      const memoryCap = op.memoryArrayBuffersCapBytes ?? memoryCapDefault;

      const serialGate = evaluatePerfGate({
        result: serial,
        thresholds: { p95Ms: op.serialP95CapMs },
      });
      const concurrentGate = evaluatePerfGate({
        result: concurrent,
        thresholds: { p95Ms: concurrentCap },
      });
      // GC を呼べない測定は解放される一時使用まで拾うため、上限との比較が成立しない。
      // 前提を固定できる呼出は requireGc で失敗扱いにする。既定を失敗にすると
      // GC 無しでも動いていた既存の呼出が一斉に落ちるため opt-in にしている。
      // 理由を明示した op だけは判定から外す。 測れていないものを通すのではなく、
      // 測れていないことを report に残したうえで gate を落とさない扱いにする。
      const memoryWaiver = waiverReason(op.memoryGateWaived);
      const memoryGatePassed =
        memoryWaiver !== undefined && memoryWaiver.length > 0
          ? true
          : (!input.requireGc || memory.gcExposed) && memory.arrayBuffersDeltaBytes < memoryCap;

      const priorSerial = priorBaseline?.[`${op.name}.serial`];
      // 正規化が成立しない組では比べない。 基準の種類を変えた op や、 基準の記録が
      // 無い世代の baseline がこれに当たる。 実測値そのものの比較に落とすと、
      // 実行と実行の間の機械の状態の差がそのまま gate にかかる。
      // 測定条件が違う組も比べない。 反復数や空回しを変えると実装を変えなくても
      // 値が動くため、 版 (`measurementPremise`) だけを見ていると条件を変えた実行が
      // 旧条件の記録と比較される (#1730)。
      const comparable =
        priorSerial !== undefined &&
        resolveNormalization(serial, priorSerial).normalized &&
        hasSameMeasurementConfig(serial, priorSerial);
      const regression = comparable
        ? detectRegression({
            current: serial,
            baseline: priorSerial,
            threshold: regressionThreshold,
            confidenceLevel: regressionConfidenceLevel,
            resolutionMs,
            ...(op.regressionMinDeltaMs === undefined
              ? {}
              : { minDeltaMs: op.regressionMinDeltaMs }),
          })
        : null;

      if (regression === null) uncompared.set(op.name, priorSerial !== undefined);

      // この実行で観測した比を控える。 次の実行が「その op が実行をまたいでどれだけ
      // 動くか」 を推定するのに使う (#1739)。
      //
      // 比較が成立しなかった実行でも積む。 baseline を作った実行の値もその op の
      // 1 観測で、 除くと幅を推定できるまでに 1 回よけいに掛かる。 記録を入れ替えた
      // 実行では入れ替え後の record に積むので、 古い実装の値は混ざらない。
      // この実行で観測した比を控える。 次の実行が「その op が実行をまたいでどれだけ
      // 動くか」 を推定するのに使う (#1739)。
      //
      // **積むのは verdict が stable の実行と、 比較しなかった実行だけ**。 退行した
      // 実行の比を積むと、 その値が幅を押し広げて次回の実効閾値が退行そのものを
      // 覆う大きさになり、 同じ退行が stable として通る (実測 = anchor の 2 倍へ
      // 悪化した op の幅が 100% になり、 実効閾値 200% で delta 100% が収まる)。
      //
      // 幅が表すのは「実装が同じまま値がどれだけ動くか」 なので、 退行と判定した
      // 観測はその定義に当てはまらない。
      const ratio = observedRatio(serial);
      const verdictForHistory = regression?.verdict;
      if (ratio !== null && (verdictForHistory === undefined || verdictForHistory === 'stable')) {
        ratioUpdates.set(`${op.name}.serial`, { ratio });
      }

      combinedForBaseline[`${op.name}.serial`] = serial;
      combinedForBaseline[`${op.name}.concurrent`] = concurrent;

      outcomes.push({
        name: op.name,
        serial,
        serialReference: alternating.reference,
        concurrent,
        memory,
        serialGatePassed: serialGate.verdict.passed,
        concurrentGatePassed: concurrentGate.verdict.passed,
        memoryGatePassed,
        regressionVerdict: regression
          ? regression.verdict
          : uncomparableVerdict(priorSerial !== undefined, false),
        ...(regression === null
          ? priorSerial === undefined
            ? {}
            : { regressionNote: uncomparableReason(serial, priorSerial) }
          : { regression, ...buildRegressionNote(regression, regressionThreshold) }),
      });
    }
  } finally {
    references.dispose();
  }

  // 測定そのものが成立しているか。GC を要求しているのに使えない実行の値で
  // baseline を作り直すと、成立しない前提を新しい正としてしまう。
  const premiseValid = !input.requireGc || outcomes.every((o) => o.memory.gcExposed);
  const hardGatePassed = outcomes.every(
    (o) => o.serialGatePassed && o.concurrentGatePassed && o.memoryGatePassed,
  );

  // 今回測った op のうち、まだ記録の無いものだけ書き足す。
  // 既存 op の値は保持しないと比較対象が毎回入れ替わって回帰を検出できない。
  const plan = planBaselineWrite({
    prior: priorBaseline,
    current: combinedForBaseline,
    premiseValid,
    hardGatePassed,
    prune: pruneStaleOps(input),
    // 記録の無い op に加えて、 基準 op が食い違うようになった op も書き直す。
    // 書き直さないと、 op の `referenceKind` を変えた瞬間から比較が成立しなく
    // なり (key は既にあるので追記されない)、 その op だけ永久に n/a に留まる。
    needsRefresh: (_key, prior, current) => {
      // 測定条件が変わった記録は入れ替える。 入れ替えないと key は既にあるので
      // 追記されず、 その op は条件を戻すまで永久に比較できない (#1730)。
      // concurrent 軸も条件が変われば値が動くため、 基準の有無に関わらず先に見る。
      if (!hasSameMeasurementConfig(current, prior)) return true;
      // 双方に基準が無いのは正常。 concurrent 軸は正規化の対象ではない。
      if (prior.reference === undefined && current.reference === undefined) return false;
      return !resolveNormalization(current, prior).normalized;
    },
  });

  // この実行が測った op を manifest に書き足す。 baseline には触れない。
  // 掃除は suite を完走した後に orchestrator が一度だけ行う (#1730)。
  //
  // 書込の可否 (`plan.written`) とは独立に記録する。 上限を割って書けなかった実行でも
  // 「この op を測った」 ことは事実で、 掃除の対象から外す根拠になる。 書けた実行だけ
  // 記録すると、 1 op が上限を割っただけで module 全体が manifest から消え、
  // 完走したのに掃除されない状態になる。
  recordPruneManifest(baselinePath, Object.keys(combinedForBaseline));

  // この実行で観測した比を baseline の履歴に積む。 記録そのもの (p10 / samples) は
  // 動かさない。 履歴は「その op が実行をまたいでどれだけ動くか」 を推定するためだけの
  // もので、 次の実行の有意性判断に使う (#1739)。
  //
  // 判定が振れた op は履歴を捨てて積み直す。 実装が変わった前後の値を混ぜると幅が
  // 過大になり、 その op の gate が二度と発火しなくなる。
  const historyBase = plan.written ? plan.results : (priorBaseline ?? {});
  const history = applyRatioHistory(historyBase, ratioUpdates, MAX_RATIO_HISTORY);

  // 履歴だけの更新でも、 測定が成立していない実行では書かない。 成立しない値で
  // 幅を推定すると、 壊れた状態が次回以降の判定基準になる。
  const measurable = premiseValid && hardGatePassed;
  const shouldWrite = plan.written || (history.changed && measurable);

  let baselineSeeded = false;
  // 別の実行と重なって書込を見送ったか。 report にその旨を出す。
  let baselineWriteSkipped = false;
  if (shouldWrite) {
    // 書くのは現在の環境で測った値なので env も現在のものにする。
    // 古い env を残すと、どの環境の測定値と比較しているのか判別できない。
    // 読んだ後に別の実行が書いていたら、 こちらの snapshot で上書きしない。
    // 自分の測定値は次の実行で積み直せるが、 消した記録は戻らない (#1757)。
    try {
      await saveBaselineEnvelope(
        baselinePath,
        { schema: BASELINE_SCHEMA, env: captureEnv(), results: history.results },
        { expectedRevision: baselineRevisionAtLoad },
      );
      baselineSeeded = priorBaseline === null;
    } catch (error) {
      if (!(error instanceof BaselineRevisionConflictError)) throw error;
      baselineWriteSkipped = true;
    }
  }

  // 記録が無かった op の verdict を、 実際に書けたかで確定する。
  for (const outcome of outcomes) {
    const hadPrior = uncompared.get(outcome.name);
    if (hadPrior === undefined) continue;
    outcome.regressionVerdict = uncomparableVerdict(hadPrior, shouldWrite && !baselineWriteSkipped, baselineWriteSkipped);
  }

  // 閾値内でも有意な回帰は gate を落とす (docs/quality/perf-thresholds.md
  // § Regression detection defaults)。cap だけを見ると、20% 超の悪化が
  // 上限に収まっている限り素通りしてしまう。
  const regressionGate = input.regressionGate ?? false;
  // 壊れた baseline を掴んだ実行は、回帰を一度も判定していない。 gate を有効にした
  // 呼出にとってそれは通過ではないので落とす。 gate が無効なら判定は元から
  // `allPassed` に載らないため、ここでも落とさない。
  const gatePassedOnBaseline = !(regressionGate && baselineUnreadable);
  const allPassed = gatePassedOnBaseline && outcomes.every((outcome, index) => {
    const waiver = waiverReason(input.ops[index]?.regressionGateWaived);
    const regressionGated =
      regressionGate && (waiver === undefined || waiver.length === 0);
    return (
      outcome.serialGatePassed &&
      outcome.concurrentGatePassed &&
      outcome.memoryGatePassed &&
      (!regressionGated || outcome.regressionVerdict !== 'regressed')
    );
  });

  writeReport({
    reportPath: input.reportPath,
    moduleName: input.moduleName,
    outcomes,
    ops: input.ops,
    thresholdDocLink,
    priorBaseline,
    concurrency,
    iterationsPerWorker,
    memoryIterations,
    memoryCapDefault,
    regressionGate,
    resolutionMs,
    baselineUnreadable,
    baselineWritten: shouldWrite && !baselineWriteSkipped,
    baselineWriteSkipped,
  });

  return { outcomes, allPassed, baselineSeeded };
}

/**
 * 今回測っていない op を baseline から落とすかを決める。
 *
 * 呼出が明示した時だけ落とす。 明示しなければ落とさない。
 *
 * 以前は環境変数 `KIWA_PERF_PRUNE_STALE=1` を「suite 全体を回している」 の手がかりに
 * していたが、 環境変数は子 process に継承されるためこれは成り立たない。 その変数を
 * export した shell から個別 package を実行すると、 絞り込まれた一覧が「完全な一覧」
 * とみなされて測っていない op の記録が消えた (#1730)。
 *
 * 実行の中で完全性を確かめる手立てが無いので、 判断そのものを実行の外へ出した。
 * suite を完走した後に orchestrator (`scripts/perf-prune-stale.mjs`) が manifest と
 * 突き合わせて一度だけ掃除する。 詳細は `prune-manifest.ts` の冒頭。
 */
export function pruneStaleOps(input: { pruneStaleBaselineOps?: boolean }): boolean {
  return input.pruneStaleBaselineOps ?? false;
}

/**
 * 記録はあるのに比較できない理由を 1 行にする。
 *
 * 原因を 1 つに固定して書くと嘘になる。 例えば版だけが違う組で「種類が食い違う」 と
 * 書くと、 読み手は種類を疑って見つからない原因を探すことになる。
 *
 * 理由は 8 通りに分かれる。 測定条件が違う / `resolveNormalization` の不成立 7 通り
 * (基準の記録が無い (baseline 側 / 今回側) / 種類が違う / 実装の版が違う (どちらかが
 * 記録なしを含む) / p10 が分母にならない (baseline 側 / 今回側) / 双方が有限正でも
 * 桁が離れて商が求まらない)。 分岐を足す時はこの 8 通りとの対応を保つ。
 *
 * 測定条件を先に見るのは、 条件が違えば基準 op の値も違う条件で測られているため。
 * 基準の側の理由を先に出すと、 読み手は分母を疑って本当の原因に辿り着けない。
 *
 * 記録を入れ替えたかどうかはここでは書かない。 書込には測定の成立が要り、 この時点で
 * 判っていない (report 冒頭が実行全体として書けたかを出す)。
 */
export function uncomparableReason(current: MeasureResult, baseline: MeasureResult): string {
  if (!hasSameMeasurementConfig(current, baseline)) {
    return `測定条件が baseline と違うため比較せず (baseline ${baseline.iterations} 反復 / 空回し ${baseline.warmup}、 今回 ${current.iterations} 反復 / 空回し ${current.warmup})`;
  }
  const currentReference = current.reference;
  const baselineReference = baseline.reference;
  if (baselineReference === undefined) {
    return '基準 op の記録が無い世代の baseline のため比較せず';
  }
  if (currentReference === undefined) {
    return '今回の測定に基準 op の記録が無いため比較せず (交互測定を経ていない)';
  }
  if (currentReference.kind !== baselineReference.kind) {
    return `基準 op の種類が baseline と違うため比較せず (baseline ${baselineReference.kind} / 今回 ${currentReference.kind})`;
  }
  if (
    currentReference.implVersion === undefined ||
    baselineReference.implVersion === undefined ||
    currentReference.implVersion !== baselineReference.implVersion
  ) {
    return `基準 op の実装の版が baseline と違うため比較せず (baseline ${baselineReference.implVersion ?? '記録なし'} / 今回 ${currentReference.implVersion ?? '記録なし'})`;
  }
  // 残るのは 2 つ。 どちらかの p10 が分母にならない場合と、 双方が有限正なのに
  // 商が非有限や 0 に落ちる場合 (桁が離れている)。 後者を前者と同じ文言で出すと、
  // 正常な側を原因として名指してしまう。 どちらでも両側の値を出す。
  const values = `baseline ${baselineReference.p10} / 今回 ${currentReference.p10}`;
  if (!(baselineReference.p10 > 0) || !Number.isFinite(baselineReference.p10)) {
    return `baseline 側の基準 p10 が分母にならないため比較せず (${values})`;
  }
  if (!(currentReference.p10 > 0) || !Number.isFinite(currentReference.p10)) {
    return `今回の基準 p10 が分母にならないため比較せず (${values})`;
  }
  return `基準 p10 の桁が離れていて換算倍率が求まらないため比較せず (${values})`;
}

/**
 * waiver の理由が実体を持つか。
 *
 * `trim()` だけだと U+200B (zero width space) のような不可視文字が「理由あり」 に
 * なり、 report では空に見えるまま gate だけ外れる。 正規化してから、
 * 可視の文字が 1 つ以上あることを要求する。
 */
function waiverReason(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  const normalized = raw.normalize('NFKC');
  // 制御文字と空白 (zero width 系を含む) を落として残りを見る。
  const visible = normalized.replace(/[\p{C}\p{Z}]/gu, '');
  if (visible.length === 0) return undefined;
  return normalized.trim();
}

/**
 * report の regression 列。 判定結果と、 gate に効いていない場合はその理由を並べる。
 *
 * 判定だけを書くと、 `regressed` の行があるのに suite が通っている report が
 * できる。 読み手には gate が効いているのか外れているのか区別できないので、
 * 外れている理由 (呼出全体で無効 / この op だけ除外) を同じ列に出す。
 */
function regressionCell(op: PerfOpSpec, outcome: OpOutcome, regressionGate: boolean): string {
  const verdict = outcome.regressionNote
    ? `${outcome.regressionVerdict} (${outcome.regressionNote})`
    : outcome.regressionVerdict;
  if (!regressionGate) return `${verdict} — gate 無効 (regressionGate=false)`;
  const waiver = waiverReason(op.regressionGateWaived);
  if (waiver === undefined || waiver.length === 0) return verdict;
  return `${verdict} — gate 対象外 (${waiver})`;
}

/**
 * 判定の状態を report 用の 1 行に言い換える。
 *
 * verdict が同じ `stable` でも「変化が無い」 と「差が絶対下限に届かず判定できない」
 * は別物で、後者を黙って stable と書くと検知できていないことが伝わらない。
 * 判定そのものは `detectRegression` が持ち、ここでは持ち込まない。
 */
export function buildRegressionNote(
  regression: RegressionResult,
  threshold: number,
): { regressionNote?: string } {
  // 検知できた実績がある行に感度の補足を足すと、判定と矛盾して読める。
  // 補足は「まだ検知に至っていない」 行にだけ付ける。
  if (regression.verdict === 'regressed' || regression.verdict === 'improved') return {};

  if (regression.suppressedByFloor) {
    const deltaMs = Math.abs(regression.judged.current - regression.judged.baseline);
    return {
      regressionNote: `差 ${formatMs(deltaMs)} が下限 ${formatMs(regression.floorMs)} 未満で判定を保留`,
    };
  }
  if (regression.belowDetectionFloor) {
    // baseline が下限より小さい op は、相対閾値をどれだけ超えても差が下限に
    // 届かない限り stable のままになる。 何をもって退行と扱われるのかを書く。
    const baseline = regression.judged.baseline;
    const requiredPct = baseline === 0 ? Infinity : (regression.floorMs / baseline) * 100;
    const requirement = Number.isFinite(requiredPct)
      ? `baseline 比 +${requiredPct.toFixed(0)}%`
      : 'baseline が 0ms のため相対では表せない';
    return {
      regressionNote: `検知には +${formatMs(regression.floorMs)} (${requirement}) 以上の悪化が必要`,
    };
  }
  // 裾だけが閾値を超えた変化。 一部の呼出だけが遅くなる実装変更はここにしか出ない。
  // gate には載せられないが、 起きた事実は残す。
  //
  // 下側も動いている場合があるので「動かず」 とは書かない。 p10 が +19% (閾値未満) で
  // p95 が +100% という組合せはこの分岐に入るため、 両方の数字を並べて読み手に委ねる。
  if (Number.isFinite(regression.tailDeltaPct) && regression.tailDeltaPct >= threshold) {
    const judged = Number.isFinite(regression.deltaPct)
      ? `換算後 p10 ${signedPct(regression.deltaPct)} (閾値未満)`
      : '換算後 p10 は baseline が 0ms のため相対では表せない';
    return {
      regressionNote: `${judged}、 p95 ${signedPct(regression.tailDeltaPct)} (裾は実行間の振れ幅と区別できないため判定には使わない)`,
    };
  }
  return {};
}

/** 変化率を符号つきの百分率にする。 0 との区別が要るので符号を落とさない。 */
function signedPct(ratio: number): string {
  const sign = ratio > 0 ? '+' : '';
  return `${sign}${(ratio * 100).toFixed(0)}%`;
}


interface WriteReportInput {
  reportPath: string;
  moduleName: string;
  outcomes: OpOutcome[];
  ops: PerfOpSpec[];
  thresholdDocLink: string;
  priorBaseline: Record<string, MeasureResult> | null;
  concurrency: number;
  iterationsPerWorker: number;
  memoryIterations: number;
  memoryCapDefault: number;
  /** 回帰判定を `allPassed` に反映したか。 report 上で判定と gate を区別するために要る。 */
  regressionGate: boolean;
  /** この実行で測った測定系の分解能 (ms)。 回帰判定の絶対下限の素。 */
  resolutionMs: number;
  /** baseline file はあるのに読めなかったか。 判定が 1 件も成立していないことを表す。 */
  baselineUnreadable: boolean;
  /**
   * この実行で baseline を書いたか。
   *
   * 書込には測定の成立 (GC / 上限) が要る。 同 module の別 op が上限を割ると
   * 1 byte も書かれないので、 比較できなかった op の行に「作り直した」 と読める
   * 表記だけを出すと、 上限違反が直るまで同じ状態が繰り返されることが伝わらない。
   */
  baselineWritten: boolean;
  /**
   * 別の実行と重なって書込を見送ったか。
   *
   * 「測定が成立していないので書けない」 と「他と重なったので譲った」 は原因も次の
   * 手当ても違う。 同じ注記で済ませると、 読み手が上限違反を疑って存在しない原因を
   * 探すことになる (#1757)。
   */
  baselineWriteSkipped: boolean;
}

function writeReport(input: WriteReportInput): void {
  const lines: string[] = [
    `# Perf Suite — ${input.moduleName}`,
    '',
    `Threshold source: [docs/quality/perf-thresholds.md](${input.thresholdDocLink})`,
    '',
    // 上限は p95、 回帰判定は p10 と読む軸が違う。 同じ表に並べて出さないと、
    // 「p95 が動いたのに stable と書いてある」 が矛盾に見える。
    `測定系の分解能 = ${formatMs(input.resolutionMs)} (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの ${RESOLUTION_FLOOR_MULTIPLE} 倍 = ${formatMs(input.resolutionMs * RESOLUTION_FLOOR_MULTIPLE)}、 op ごとの実効値は下表の「下限」 列。`,
    '',
    // 判定が 1 件も成立していない実行を、通常の初回 seed と同じ見た目で出さない。
    ...(input.baselineUnreadable
      ? [
          '**保存済みの baseline を読めなかった** ため、この実行では回帰を 1 件も判定していない。 下表の regression 列はすべて `n/a`。 測定が成立していれば baseline は作り直されている。',
          '',
        ]
      : []),
    // 比較できなかった行があるのに書込も起きていない実行は、 次の実行でも同じ状態に
    // なる。 「作り直した」 と読める表記だけを出すと、 それが伝わらない。
    ...(!input.baselineWritten && input.outcomes.some((out) => out.regression === undefined)
      ? [
          '**この実行では baseline を書いていない** (測定が成立していない = GC を呼べない、 または上限を割った op がある)。 比較できなかった op は次の実行でも比較できない。',
          '',
        ]
      : []),
    // 追跡している baseline は 1 つの環境の記録で、 他の環境では比較相手が別になる。
    // 数値だけを見た読み手が「追跡分と比べた結果」 と受け取らないよう明示する (#1729)。
    ...nonCanonicalEnvNotice(),
    // 競合で見送った実行は無条件で出す。 比較できた op しか無い実行では従来の注記の
    // 条件に入らず、 競合が report のどこにも出ないまま「今回は書かなかった」 だけが
    // 残っていた (#1757)。
    ...(input.baselineWriteSkipped
      ? [
          '**この実行では baseline を書いていない** (別の実行が同じ baseline を書いており、 上書きを避けて譲った)。 測定そのものは成立している。 次の実行で通常どおり書かれる。',
          '',
        ]
      : []),
    '## Serial (concurrency = 1)',
    '',
    '| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |',
    '|---|---|---|---|---|---|---|',
  ];
  input.ops.forEach((op, idx) => {
    const out = input.outcomes[idx]!;
    // 既定の下限を op 側が上書きでき、 さらに正規化の倍率が掛かるため、 実際に
    // 効いた値を行ごとに書く。 表頭の既定値だけを書くと、 上書きした op や
    // 機械が遅かった実行で表示と判定条件がずれる。 比較していない行 (初回 seed)
    // には効いた値が無いので、 既定の計算をそのまま出す。
    const floorMs =
      out.regression?.floorMs ??
      op.regressionMinDeltaMs ??
      input.resolutionMs * RESOLUTION_FLOOR_MULTIPLE;
    lines.push(
      // 判定を gate から外した op は、判定結果と外した理由の両方を書く。
      // 結果だけ書くと gate に効いているように読め、理由だけ書くと
      // 何が測れたのかが残らない。
      `| ${op.name} | ${formatMs(out.serial.p10)} | ${formatMs(out.serial.p95)} | ${op.serialP95CapMs}ms | ${formatMs(floorMs)} | ${out.serialGatePassed ? 'PASS' : 'FAIL'} | ${regressionCell(op, out, input.regressionGate)} |`,
    );
  });

  lines.push(
    '',
    '## 実行内正規化 (回帰判定はこの比で行う)',
    '',
    '回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。',
    '',
    '',
    '「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の ' +
      `${INTER_RUN_SPREAD_MULTIPLE} 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が ${MIN_RATIO_HISTORY} 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。`,
    '',
    '| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |',
    '|---|---|---|---|---|---|---|---|---|---|---|',
  );
  input.ops.forEach((op, idx) => {
    const out = input.outcomes[idx]!;
    const referenceP10 = out.serialReference.p10;
    const ratio = referenceP10 > 0 ? out.serial.p10 / referenceP10 : Number.NaN;
    // 比較していない行では baseline の比を出さない。 別の分母で割った量が今回の比の
    // 真横に並ぶと、 読み手は 2 列を引き算して「改善した」 と読めてしまう。
    // その 2 値は比較できる量ではない (換算後 p10 / baseline p10 も n/a になる)。
    const prior = out.regression === undefined ? undefined : input.priorBaseline?.[`${op.name}.serial`];
    const priorReference = prior?.reference;
    const priorRatio =
      prior !== undefined && priorReference !== undefined && priorReference.p10 > 0
        ? (prior.p10 / priorReference.p10).toFixed(3)
        : 'n/a';
    lines.push(
      // 基準の p95 も出す。 分母が同じ実行の中で暴れていれば比も暴れるので、
      // 比だけを見て「op が動いた」 と読まないための材料。
      `| ${op.name} | ${out.serial.reference?.kind ?? 'n/a'} | ${formatMs(referenceP10)} | ${formatMs(out.serialReference.p95)} | ${formatMs(out.serial.p10)} | ${Number.isFinite(ratio) ? ratio.toFixed(3) : 'n/a'} | ${priorRatio} | ${out.regression?.interRunSpread === undefined ? 'n/a' : `${(out.regression.interRunSpread * 100).toFixed(1)}%`} | ${out.regression === undefined ? 'n/a' : `${(out.regression.effectiveThreshold * 100).toFixed(1)}%`} | ${out.regression ? formatMs(out.regression.judged.current) : 'n/a'} | ${out.regression ? formatMs(out.regression.judged.baseline) : 'n/a'} |`,
    );
  });

  lines.push(
    '',
    `## Concurrent p95 (concurrency = ${input.concurrency}, ${input.iterationsPerWorker} iter each)`,
    '',
    '| op | p95 | cap | gate |',
    '|---|---|---|---|',
  );
  input.ops.forEach((op, idx) => {
    const out = input.outcomes[idx]!;
    const cap = op.concurrentP95CapMs ?? op.serialP95CapMs * 2;
    lines.push(
      `| ${op.name} | ${out.concurrent.p95.toFixed(2)}ms | ${cap}ms | ${out.concurrentGatePassed ? 'PASS' : 'FAIL'} |`,
    );
  });

  lines.push(
    '',
    `## Memory retention (${input.memoryIterations} iter/window, arrayBuffers axis of the last window is the gate; heap is informational)`,
    '',
    // gc exposed 列は測定条件の証跡。--expose-gc なしだと解放される一時使用まで
    // 拾うため、no と yes の値を同じ基準で比べられない。
    //
    // 呼出 列も同じ証跡。 空回しは測定区間の外で fn を呼ぶため、 副作用や件数依存を
    // 持つ op では「N 反復」 の見出しだけでは実際に何回呼んだかが読めない (#1730)。
    //
    // 区間 Δ 列は飽和の証跡。 判定に使うのは最後の区間だけなので、 手前の区間が
    // どれだけ引き受けたかが読めないと、 最後の区間が小さい理由が飽和なのか
    // そもそも確保していないのかを判別できない (#1719)。
    '| op | heapUsed Δ | arrayBuffers Δ | 区間 Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |',
    '|---|---|---|---|---|---|---|---|',
  );
  input.ops.forEach((op, idx) => {
    const out = input.outcomes[idx]!;
    const cap = op.memoryArrayBuffersCapBytes ?? input.memoryCapDefault;
    // 判定を外した op は PASS と書かない。 測れていないことが読み取れないと、
    // 上限を上げて通したのと区別がつかなくなる。
    const waiver = waiverReason(op.memoryGateWaived);
    const verdict =
      waiver !== undefined && waiver.length > 0
        ? `WAIVED (${waiver})`
        : out.memoryGatePassed
          ? 'PASS'
          : 'FAIL';
    lines.push(
      `| ${op.name} | ${out.memory.heapUsedDeltaBytes} B | ${out.memory.arrayBuffersDeltaBytes} B | ${formatMemoryWindows(out.memory)} | ${cap} B | ${out.memory.gcExposed ? 'yes' : 'no'} | ${formatMemoryCalls(out.memory)} | ${verdict} |`,
    );
  });

  lines.push('', '## Detailed serial reports', '');
  input.ops.forEach((op, idx) => {
    const out = input.outcomes[idx]!;
    lines.push(`### ${op.name}`);
    lines.push('');
    // 比較が成立した行だけ baseline との差分表を出す。 比較していない行に出すと、
    // 判定に使っていない実測値どうしの差が、 判定結果と同じ重みで並ぶ (倍率が
    // 無いので注記も出ず、 読み手には区別が付かない)。 比較しなかった理由は
    // Serial 表の regression 列に出る。
    const priorSerial =
      out.regression === undefined ? undefined : input.priorBaseline?.[`${op.name}.serial`];
    lines.push(
      emitPerfReport(out.serial, {
        includeSamples: false,
        ...(priorSerial !== undefined ? { baseline: priorSerial } : {}),
        // 判定に使った倍率をそのまま渡す。 渡さないとこの表だけ実測値どうしの
        // 比較になり、 同じ行の verdict と符号が食い違う。
        ...(out.regression === undefined
          ? {}
          : { normalizationScale: out.regression.normalizationScale }),
      }),
    );
  });

  mkdirSync(path.dirname(input.reportPath), { recursive: true });
  writeFileSync(input.reportPath, `${lines.join('\n')}\n`, 'utf8');
}

/**
 * runPerf3LayerStrict — v0.3 strict variant。 iter 2 倍 + CI 99% +
 * delta 10%。 見逃し (退行を stable と判定) が致命的な経路で使う。
 *
 * defaults ...
 * - serialIterations: 400 (v0.2 200)
 * - serialWarmup: 10 (v0.2 5)
 * - concurrency: 20 (v0.2 10)
 * - iterationsPerWorker: 100 (v0.2 50)
 * - memoryIterations: 400 (v0.2 200)
 * - regressionThreshold: 0.1 (v0.2 0.2)
 * - regressionConfidenceLevel: 0.99 (v0.2 0.95)
 *
 * 回帰判定の 2 つは、 名前が strict でありながら通常版と同じ設定で動いていた
 * (`runPerf3Layer` が閾値を内部で固定していた)。 標本数だけ増えて判定は緩いまま
 * だったので、 呼出から渡せるようにして名前どおりの挙動に揃えた (#1718)。
 */
export async function runPerf3LayerStrict(
  input: RunPerf3LayerInput,
): Promise<RunPerf3LayerResult> {
  return runPerf3Layer({
    ...input,
    serialIterations: input.serialIterations ?? 400,
    serialWarmup: input.serialWarmup ?? 10,
    concurrency: input.concurrency ?? 20,
    iterationsPerWorker: input.iterationsPerWorker ?? 100,
    memoryIterations: input.memoryIterations ?? 400,
    regressionThreshold: input.regressionThreshold ?? 0.1,
    regressionConfidenceLevel: input.regressionConfidenceLevel ?? 0.99,
  });
}

/**
 * resolveKiwaRepoRoot — walk upward from `start` until finding a package.json
 * whose `name` matches `kiwa-monorepo`. Used by every kiwa perf test to
 * resolve the report path regardless of vitest cwd.
 */
export function resolveKiwaRepoRoot(start: string): string {
  let current = start;
  while (true) {
    const pkgPath = path.join(current, 'package.json');
    if (existsSync(pkgPath)) {
      const m = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name?: string };
      if (m.name === 'kiwa-monorepo') return current;
    }
    const parent = path.dirname(current);
    if (parent === current) throw new Error(`Could not resolve repo root from ${start}`);
    current = parent;
  }
}
