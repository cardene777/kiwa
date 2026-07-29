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
import { RESOLUTION_FLOOR_MULTIPLE, detectRegression, resolveNormalization } from './regression.js';
import { DEFAULT_REFERENCE_KIND, createReferenceOps } from './reference.js';
import {
  BASELINE_SCHEMA,
  captureEnv,
  defaultBaselinePath,
  isComparableEnv,
  loadBaseline,
  saveBaselineEnvelope,
} from './baseline.js';
import { evaluatePerfGate } from './gate.js';
import { emitPerfReport, formatMs } from './report.js';
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
   * `RESOLUTION_FLOOR_MULTIPLE` 倍。 分解能より小さい差は op ではなく harness 自身の
   * 往復を見ているため判定に使えない。 明示すると既定を上書きする。
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
   * 選び方と却下した案は `docs/quality/perf-thresholds.md` § 実行内正規化。
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
   * `docs/quality/perf-thresholds.md` § 実行内正規化。
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
   * 次の完全実行では再 seed されて直前の退行を見逃すので、suite 全体を
   * 回す呼出だけが明示的に有効化する。
   *
   * 明示しない場合は環境変数 `KIWA_PERF_PRUNE_STALE=1` の有無で決まる。
   * kiwa の root `test:perf` はこれを立てる = 全 package を絞り込みなしで
   * 回す唯一の経路で、 そこでだけ掃除が働く。 個別 package の実行や
   * `-t` での絞り込みでは立たないため、 過去値を巻き添えにしない。
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
  regressionVerdict: 'stable' | 'improved' | 'regressed' | 'n/a (baseline seeded)';
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
  const memoryCapDefault = 100 * 1024;
  const regressionThreshold = input.regressionThreshold ?? 0.2;
  const regressionConfidenceLevel = input.regressionConfidenceLevel ?? 0.95;
  const baselinePath = input.baselinePath ?? defaultBaselinePath(input.moduleName);
  // 固定の相対 path だと、report を 1 階層深く置いた瞬間にリンクが外れる。
  // 実際 framework/ と saas/ 配下の 20 件が docs/quality-reports/quality/ を
  // 指して 404 になっていた。report の位置から SSOT までを毎回組み立てる。
  const thresholdDocLink = input.thresholdDocLink ?? resolveThresholdDocLink(input.reportPath);

  const loadedBaseline = await loadBaseline(baselinePath);
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
      const comparable =
        priorSerial !== undefined && resolveNormalization(serial, priorSerial).normalized;
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
        regressionVerdict: regression ? regression.verdict : 'n/a (baseline seeded)',
        ...(regression === null
          ? {}
          : { regression, ...buildRegressionNote(regression, regressionThreshold) }),
      });
    }
  } finally {
    references.dispose();
  }

  // 今回測った op のうち、まだ記録の無いものだけ書き足す。
  // 既存 op の値は保持しないと比較対象が毎回入れ替わって回帰を検出できない。
  const priorResults = priorBaseline ?? {};
  const currentKeys = new Set(Object.keys(combinedForBaseline));
  const retained = pruneStaleOps(input)
    ? Object.fromEntries(Object.entries(priorResults).filter(([key]) => currentKeys.has(key)))
    : priorResults;
  // 記録の無い op に加えて、 基準 op が食い違うようになった op も書き直す。
  // 書き直さないと、 op の `referenceKind` を変えた瞬間から比較が成立しなく
  // なり (key は既にあるので追記されない)、 その op だけ永久に n/a に留まる。
  const staleNormalization = (key: string): boolean => {
    const prior = priorResults[key];
    const current = combinedForBaseline[key];
    if (prior === undefined || current === undefined) return false;
    // 双方に基準が無いのは正常。 concurrent 軸は正規化の対象ではない。
    if (prior.reference === undefined && current.reference === undefined) return false;
    return !resolveNormalization(current, prior).normalized;
  };
  const refreshedOps = Object.fromEntries(
    Object.entries(combinedForBaseline).filter(
      ([key]) => !(key in priorResults) || staleNormalization(key),
    ),
  );
  const staleDropped = Object.keys(priorResults).length !== Object.keys(retained).length;
  const envMismatched = loadedBaseline !== null && priorBaselineLoaded === null;

  // 測定そのものが成立しているか。GC を要求しているのに使えない実行の値で
  // baseline を作り直すと、成立しない前提を新しい正としてしまう。
  const premiseValid = !input.requireGc || outcomes.every((o) => o.memory.gcExposed);
  const hardGatePassed = outcomes.every(
    (o) => o.serialGatePassed && o.concurrentGatePassed && o.memoryGatePassed,
  );

  // 前提が違う環境の値で既存 baseline を上書きすると、次に元の環境で測ったときも
  // 不一致として扱われ、その間の回帰を比較せず通してしまう。
  // 一方で保存しないままだと、Node 更新や CPU 変更のように前提が恒久的に変わった
  // 場合に手動削除まで比較できない。測定が成立している実行なら作り直す。
  const shouldReseed = envMismatched && premiseValid && hardGatePassed;
  // 追記にも作り直しと同じ条件を課す。 上限を割った実行や GC を呼べない実行の値を
  // 基準として採ると、 壊れた状態が次回以降の比較対象になる。 新しい op だけを
  // 足す経路でも、 その値が成立していなければ意味は同じ。
  const shouldAppend =
    !envMismatched &&
    premiseValid &&
    hardGatePassed &&
    (Object.keys(refreshedOps).length > 0 || staleDropped);

  let baselineSeeded = false;
  if (shouldReseed) {
    await saveBaselineEnvelope(baselinePath, {
      schema: BASELINE_SCHEMA,
      env: captureEnv(),
      results: combinedForBaseline,
    });
    baselineSeeded = true;
  } else if (shouldAppend) {
    // 追記は現在の環境で測った値なので env も現在のものにする。
    // 古い env を残すと、どの環境の測定値と比較しているのか判別できない。
    await saveBaselineEnvelope(baselinePath, {
      schema: BASELINE_SCHEMA,
      env: captureEnv(),
      results: { ...retained, ...refreshedOps },
    });
    baselineSeeded = priorBaseline === null;
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
  });

  return { outcomes, allPassed, baselineSeeded };
}

/**
 * 今回測っていない op を baseline から落とすかを決める。
 *
 * 呼出が明示していればそれに従い、 していなければ suite 全体を回す経路が
 * 立てる環境変数を見る。 絞り込み実行でこの変数が立つことはないため、
 * 「今回の op 一覧が完全である」 という前提が成り立つ場合だけ掃除が働く。
 */
export function pruneStaleOps(input: { pruneStaleBaselineOps?: boolean }): boolean {
  if (input.pruneStaleBaselineOps !== undefined) return input.pruneStaleBaselineOps;
  return process.env['KIWA_PERF_PRUNE_STALE'] === '1';
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
      ? `p10 ${signedPct(regression.deltaPct)} (閾値未満)`
      : 'p10 は baseline が 0ms のため相対では表せない';
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
    '| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |',
    '|---|---|---|---|---|---|---|---|',
  );
  input.ops.forEach((op, idx) => {
    const out = input.outcomes[idx]!;
    const referenceP10 = out.serialReference.p10;
    const ratio = referenceP10 > 0 ? out.serial.p10 / referenceP10 : Number.NaN;
    const prior = input.priorBaseline?.[`${op.name}.serial`];
    const priorReference = prior?.reference;
    const priorRatio =
      prior !== undefined && priorReference !== undefined && priorReference.p10 > 0
        ? (prior.p10 / priorReference.p10).toFixed(3)
        : 'n/a';
    lines.push(
      `| ${op.name} | ${out.serial.reference?.kind ?? 'n/a'} | ${formatMs(referenceP10)} | ${formatMs(out.serial.p10)} | ${Number.isFinite(ratio) ? ratio.toFixed(3) : 'n/a'} | ${priorRatio} | ${out.regression ? formatMs(out.regression.judged.current) : 'n/a'} | ${out.regression ? formatMs(out.regression.judged.baseline) : 'n/a'} |`,
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
    `## Memory retention (${input.memoryIterations} iter, arrayBuffers axis is the gate; heap is informational)`,
    '',
    // gc exposed 列は測定条件の証跡。--expose-gc なしだと解放される一時使用まで
    // 拾うため、no と yes の値を同じ基準で比べられない。
    '| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |',
    '|---|---|---|---|---|---|',
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
      `| ${op.name} | ${out.memory.heapUsedDeltaBytes} B | ${out.memory.arrayBuffersDeltaBytes} B | ${cap} B | ${out.memory.gcExposed ? 'yes' : 'no'} | ${verdict} |`,
    );
  });

  lines.push('', '## Detailed serial reports', '');
  input.ops.forEach((op, idx) => {
    const out = input.outcomes[idx]!;
    lines.push(`### ${op.name}`);
    lines.push('');
    const priorSerial = input.priorBaseline?.[`${op.name}.serial`];
    lines.push(
      emitPerfReport(out.serial, {
        includeSamples: false,
        ...(priorSerial !== undefined ? { baseline: priorSerial } : {}),
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
