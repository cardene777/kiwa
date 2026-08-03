/**
 * runPerf3LayerLive — 3-layer perf against a live third-party API.
 *
 * Companion to {@link runPerf3Layer}. Same shape, same reporting, and the same
 * baseline-write planner (`planBaselineWrite`). Four behavioural differences:
 *
 * 1. **env-skip contract** — the caller declares which env vars are required
 *    to reach the live API. When any required var is unset, the helper skips
 *    the run and emits a `LIVE_ENV_MISSING` marker report (so CI-independent
 *    perf sweeps can attribute empty results to missing credentials, not
 *    silent success).
 * 2. **live thresholds** — the default cap is the provider's public SLA
 *    (see docs/quality/perf-thresholds.md § Real-API measurement mode).
 *    Concurrent multiplier stays 2×.
 * 3. **no in-run normalization** — the mock path measures each op alternating
 *    with a harness-owned reference op and judges on the ratio (#1737). Neither
 *    reference kind shares the disturbance of a network round trip, so this path
 *    keeps measuring the op alone. `MeasureResult.reference` is therefore absent
 *    here, `resolveNormalization` reports `normalized: false`, and the verdict
 *    compares raw durations — carrying the run-to-run drift the mock path now
 *    cancels. The stored `measurementPremise` is shared with the mock path, so
 *    it does not distinguish the two; the presence of `reference` does.
 * 4. **prune activation** — the mock path leaves pruning to an orchestrator that
 *    runs once the whole suite has completed (#1730). This path prunes inside the
 *    run instead, only when the caller opts in explicitly and only when no op was
 *    skipped for missing env (#1746). It stays out of the manifest path because
 *    env-gated skips mean the ops it measured are not the module's full set —
 *    recording them as complete would delete the skipped ops' records (#1740).
 *
 * Live runs cost money and are slow. Iterations default to 10 (vs 200 for
 * mock) so a full pass fits inside a coffee break. Concurrency defaults to
 * 3 so we don't rate-limit ourselves.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { measure, measureHarnessResolution } from './measure.js';
import { measureConcurrent } from './concurrent.js';
import { measureMemory } from './memory.js';
import {
  RESOLUTION_FLOOR_MULTIPLE,
  detectRegression,
  assertValidWorkloadVersions,
  hasSameMeasurementConfig,
} from './regression.js';
import {
  BASELINE_SCHEMA,
  BaselineRevisionConflictError,
  captureEnv,
  defaultBaselinePath,
  isComparableEnv,
  loadBaselineSnapshot,
  nonCanonicalEnvNotice,
  saveBaselineEnvelope,
} from './baseline.js';
import { planBaselineWrite, uncomparableVerdict } from './baseline-write.js';
import { evaluatePerfGate } from './gate.js';
import { emitPerfReport, formatMemoryCalls, formatMs } from './report.js';
import type { MeasureResult } from './types.js';
import { buildRegressionNote } from './three-layer.js';
import type { OpOutcome, PerfOpSpec } from './three-layer.js';

export interface LivePerfOpSpec extends PerfOpSpec {
  /**
   * Env vars that must all be set for this op to reach the live API.
   * When any is missing the op is skipped and reported as LIVE_ENV_MISSING.
   */
  requiredEnv: string[];
}

export interface RunPerf3LayerLiveInput {
  moduleName: string;
  ops: LivePerfOpSpec[];
  reportPath: string;
  baselinePath?: string;
  serialIterations?: number;
  serialWarmup?: number;
  concurrency?: number;
  iterationsPerWorker?: number;
  memoryIterations?: number;
  thresholdDocLink?: string;
  /**
   * GC を呼べない測定を memory gate の失敗として扱う (default false)。
   *
   * `--expose-gc` 無しの測定は解放される一時使用まで拾うため上限との比較が
   * 成立しない。 config 側で GC を可能にしても、呼出が要求しなければ
   * 「測れていない実行」 が上限内として通る。 mock 経路 (`runPerf3Layer`) と
   * 同じ契約にする (#1708)。
   */
  requireGc?: boolean;
  /**
   * 今回測っていない op を baseline から落とす (default false)。
   *
   * 落とさないと、 op 名を付け替えた時に旧名の記録が残り続ける。 後から同じ名前を
   * 別の処理に使うと、 その処理は無関係な測定値と比較される (#1746)。
   *
   * 環境変数 `KIWA_PERF_PRUNE_STALE` は見ない。 あの変数が言えるのは「今回の op 一覧が
   * 絞り込まれていない」 ことまでで、 live の op 一覧が完全かどうかは credential が
   * 揃っているかにも依る。 root の `test:perf` は変数を立てたまま example の live 経路も
   * 回すため、 変数を見ると credential を持たない環境の実行が黙って掃除を始める。
   * (#1730 で mock 経路も同じ理由からこの変数を見なくなり、 掃除の判断は suite 完走後の
   * orchestrator へ移った。 実 API 経路はその manifest 経路にも参加しない = 飛んだ op を
   * 含む一覧を「完全」 として記録できないため。)
   *
   * 明示しても、 env 欠落で飛ばした op がある実行では掃除しない。 その実行の op 一覧は
   * 「測っていない」 のではなく「測れなかった」 ものを含むので、 落とすと credential を
   * 1 つ外した実行が他の op の比較対象を壊す (#1740 でそう決めた)。
   *
   * **true を渡す側が「この `ops` が当該 module の全 op である」 ことを保証する**。
   * `anySkipped` が見張れるのは env 欠落で飛んだ op までで、 呼出前に `ops` から
   * 外した op は harness からは見えない。 絞り込んだ一覧に true を付けると、
   * 外した op の記録が落ちる。 絞り込み実行では既定 (省略) のままにする。
   */
  pruneStaleBaselineOps?: boolean;
}

export interface LiveOpOutcome extends Partial<OpOutcome> {
  name: string;
  skipped: boolean;
  skipReason: string | null;
}

export interface RunPerf3LayerLiveResult {
  outcomes: LiveOpOutcome[];
  allPassed: boolean;
  anySkipped: boolean;
  baselineSeeded: boolean;
}

export async function runPerf3LayerLive(
  input: RunPerf3LayerLiveInput,
): Promise<RunPerf3LayerLiveResult> {
  // 版が版として成立していない宣言は測る前に止める (#1739)。 mock 経路と同じ検証。
  assertValidWorkloadVersions(input.ops);
  const serialIterations = input.serialIterations ?? 10;
  const serialWarmup = input.serialWarmup ?? 1;
  const concurrency = input.concurrency ?? 3;
  const iterationsPerWorker = input.iterationsPerWorker ?? 3;
  const memoryIterations = input.memoryIterations ?? 20;
  const memoryCapDefault = 100 * 1024;
  const baselinePath =
    input.baselinePath ?? defaultBaselinePath(`${input.moduleName}.live`);
  const thresholdDocLink = input.thresholdDocLink ?? '../../quality/perf-thresholds';

  // 中身と版を 1 回の read から採る。 別々に読むと、 その間に別の実行が書いた時に
  // 「古い中身 + 新しい版」 の組ができ、 照合が通って上書きしてしまう (#1757)。
  const baselineSnapshot = await loadBaselineSnapshot(baselinePath);
  const loadedBaseline =
    baselineSnapshot.envelope === null
      ? null
      : { envelope: baselineSnapshot.envelope, envMismatch: baselineSnapshot.envMismatch };
  const baselineRevisionAtLoad = baselineSnapshot.revision;
  // 測定の前提が違う baseline とは比べない。 mock 経路 (`runPerf3Layer`) は #1708 から
  // これを行っていたが live 経路には無く、 版を上げるたびに前提の違う値と比べ続けていた。
  const priorBaselineLoaded =
    loadedBaseline && isComparableEnv(loadedBaseline.envelope.env, captureEnv())
      ? loadedBaseline
      : null;
  const priorBaseline: Record<string, MeasureResult> | null = priorBaselineLoaded
    ? priorBaselineLoaded.envelope.results
    : null;
  const combinedForBaseline: Record<string, MeasureResult> = {};
  const outcomes: LiveOpOutcome[] = [];
  // 比較が成立しなかった op。 mock 経路と同じく、 verdict は書込の可否が
  // 決まってから確定する。 実行内正規化を使わないので基準 op 由来の不成立は
  // 起きないが、 測定条件が違う記録とは比べないため (#1730) 記録があっても
  // 比較まで進まない op があり得る。
  const uncompared = new Map<string, boolean>();
  let baselineSeeded = false;
  // 別の実行と重なって書込を見送ったか。 report にその旨を出す。
  let baselineWriteSkipped = false;
  let anySkipped = false;

  // mock 経路と同じく、 回帰判定の絶対下限をこの実行の中で測って決める。
  // live の op は network 越しで ms 規模なので下限が効く場面はまずないが、
  // 判定の前提を経路ごとに変えると report の読み方が経路ごとに変わる。
  const resolutionMs = await measureHarnessResolution({
    iterations: serialIterations,
    warmup: serialWarmup,
  });

  for (const op of input.ops) {
    const missing = op.requiredEnv.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      anySkipped = true;
      outcomes.push({
        name: op.name,
        skipped: true,
        skipReason: `LIVE_ENV_MISSING: ${missing.join(', ')}`,
      });
      continue;
    }

    // 作業内容の版を測定直後に載せる (#1739)。 `LivePerfOpSpec` は `PerfOpSpec` を
    // 継承するので型としては版を宣言できる。 載せないと双方が `undefined` のまま
    // 一致し、 版を上げても旧 workload との比較が永久に続く = 機構が live 経路で
    // 丸ごと効かない (#1739 review 指摘 1)。
    //
    // 比較 (`hasSameMeasurementConfig`) より前に載せる。 後に載せると記録には残るが
    // その実行の判定には効かず、 版を上げた実行だけが旧 baseline と比較される。
    const withVersion = <T extends MeasureResult>(r: T): T =>
      op.workloadVersion === undefined ? r : { ...r, workloadVersion: op.workloadVersion };

    const serial = withVersion(
      await measure({
        name: `${op.name}.live.serial`,
        iterations: serialIterations,
        warmup: serialWarmup,
        fn: async () => {
          await op.fn();
        },
      }),
    );
    const concurrent = withVersion(
      await measureConcurrent({
        name: `${op.name}.live.concurrent`,
        concurrency,
        iterationsPerWorker,
        warmup: 1,
        fn: async () => {
          await op.fn();
        },
      }),
    );
    const memory = await measureMemory({
      fn: async () => {
        await op.fn();
      },
      iterations: memoryIterations,
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
    const memoryGatePassed =
      (!input.requireGc || memory.gcExposed) && memory.arrayBuffersDeltaBytes < memoryCap;

    const priorSerial = priorBaseline?.[`${op.name}.live.serial`];
    // 測定条件が違う組は比べない。 反復数や空回しを変えると実装を変えなくても値が
    // 動くため、 版 (`measurementPremise`) だけでは条件の変化を捕まえられない (#1730)。
    const comparable = priorSerial !== undefined && hasSameMeasurementConfig(serial, priorSerial);
    const regression = comparable
      ? detectRegression({
          current: serial,
          baseline: priorSerial,
          threshold: 0.2,
          resolutionMs,
          // `LivePerfOpSpec` は `PerfOpSpec` を継承するので op 側で下限を指定できる。
          // 渡さないと、 同じ指定が mock 経路でだけ効いて live 経路では黙って無視される。
          ...(op.regressionMinDeltaMs === undefined
            ? {}
            : { minDeltaMs: op.regressionMinDeltaMs }),
        })
      : null;

    if (regression === null) uncompared.set(op.name, priorSerial !== undefined);

    combinedForBaseline[`${op.name}.live.serial`] = serial;
    combinedForBaseline[`${op.name}.live.concurrent`] = concurrent;

    outcomes.push({
      name: op.name,
      skipped: false,
      skipReason: null,
      serial,
      concurrent,
      memory,
      serialGatePassed: serialGate.verdict.passed,
      concurrentGatePassed: concurrentGate.verdict.passed,
      memoryGatePassed,
      regressionVerdict: regression
        ? regression.verdict
        : uncomparableVerdict(priorSerial !== undefined, false),
      ...(regression === null ? {} : buildRegressionNote(regression, 0.2)),
    });
  }

  const measured = outcomes.filter((o) => !o.skipped);
  const anyMeasured = measured.length > 0;
  const allPassed = measured.every(
    (o) => o.serialGatePassed && o.concurrentGatePassed && o.memoryGatePassed,
  );

  // 測定そのものが成立している実行の値だけを基準にする。 GC を呼べない実行や
  // 上限を割った実行を保存すると、壊れた状態が次回以降の比較対象になる。
  // mock 経路 (`runPerf3Layer`) と同じ条件 (#1708)。
  const premiseValid = !input.requireGc || measured.every((o) => o.memory?.gcExposed);
  // 書込の可否は mock 経路と同じ helper が決める。 経路ごとに条件を持つと、
  // 片方を直した時にもう片方が古い前提を残す (#1740)。
  //
  // env を跨いだ実行では op ごとに測れたり測れなかったりする。 環境変数が欠けて
  // 飛ばした op を「今回測っていない」 として掃除すると、 credential を 1 つ外した
  // 実行が他の op の baseline を消してしまう。 掃除は呼出が明示し、 かつ全 op を
  // 測れた実行に限る (#1746)。
  const prune = (input.pruneStaleBaselineOps ?? false) && !anySkipped;
  const plan = anyMeasured
    ? planBaselineWrite({
        prior: priorBaseline,
        current: combinedForBaseline,
        premiseValid,
        hardGatePassed: allPassed,
        prune,
        // 測定条件が変わった記録は入れ替える。 入れ替えないと key は既にあるので
        // 追記されず、 その op は条件を戻すまで永久に比較できない (#1730)。
        needsRefresh: (_key, prior, current) => !hasSameMeasurementConfig(current, prior),
      })
    : { results: {}, written: false };

  if (plan.written) {
    // 読んだ後に別の実行が書いていたら、 こちらの snapshot で上書きしない。
    // 自分の測定値は次の実行で積み直せるが、 消した記録は戻らない (#1757)。
    try {
      await saveBaselineEnvelope(
        baselinePath,
        { schema: BASELINE_SCHEMA, env: captureEnv(), results: plan.results },
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
    outcome.regressionVerdict = uncomparableVerdict(hadPrior, plan.written && !baselineWriteSkipped, baselineWriteSkipped);
  }

  writeLiveReport({
    baselineWritten: plan.written && !baselineWriteSkipped,
    baselineWriteSkipped,
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
    resolutionMs,
  });

  return { outcomes, allPassed, anySkipped, baselineSeeded };
}

interface WriteLiveReportInput {
  reportPath: string;
  moduleName: string;
  outcomes: LiveOpOutcome[];
  ops: LivePerfOpSpec[];
  thresholdDocLink: string;
  priorBaseline: Record<string, MeasureResult> | null;
  concurrency: number;
  iterationsPerWorker: number;
  memoryIterations: number;
  memoryCapDefault: number;
  /** この実行で測った測定系の分解能 (ms)。 回帰判定の絶対下限の素。 */
  resolutionMs: number;
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

function writeLiveReport(input: WriteLiveReportInput): void {
  const lines: string[] = [
    `# Perf Suite — ${input.moduleName} (LIVE)`,
    '',
    `Threshold source: [docs/quality/perf-thresholds.md § Real-API measurement mode](${input.thresholdDocLink})`,
    '',
  ];

  const skippedOps = input.outcomes.filter((o) => o.skipped);
  const measuredOps = input.outcomes.filter((o) => !o.skipped);

  if (skippedOps.length > 0) {
    lines.push('## Skipped ops (missing env)', '', '| op | reason |', '|---|---|');
    for (const o of skippedOps) lines.push(`| ${o.name} | ${o.skipReason} |`);
    lines.push('');
  }

  // mock 経路と同じ注記を出す。 片方だけに置くと、 実 API 経路の report を見た
  // 読み手が「git に入っている記録と比べた結果」 と受け取る (#1729)。
  lines.push(...nonCanonicalEnvNotice());

  // 競合で見送った実行は無条件で出す (#1757)。
  if (input.baselineWriteSkipped) {
    lines.push(
      '**この実行では baseline を書いていない** (別の実行が同じ baseline を書いており、 上書きを避けて譲った)。 測定そのものは成立している。 次の実行で通常どおり書かれる。',
      '',
    );
  }

  if (measuredOps.length === 0) {
    lines.push('_No live ops ran this pass. Set the required env vars to enable._');
  } else {
    // 比較できなかった行があるのに書込も起きていない実行は、 次の実行でも同じ状態に
    // なる。 「作り直した」 と読める表記だけを出すと、 それが伝わらない。
    if (!input.baselineWritten && measuredOps.some((o) => o.regressionVerdict?.startsWith('n/a'))) {
      lines.push(
        '**この実行では baseline を書いていない** (測定が成立していない = GC を呼べない、 または上限を割った op がある)。 比較できなかった op は次の実行でも比較できない。',
        '',
      );
    }
    lines.push(
      `測定系の分解能 = ${formatMs(input.resolutionMs)} (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの ${RESOLUTION_FLOOR_MULTIPLE} 倍 = ${formatMs(input.resolutionMs * RESOLUTION_FLOOR_MULTIPLE)}、 op ごとの実効値は下表の「下限」 列。`,
      '',
      '## Serial (LIVE, concurrency = 1)',
      '',
    );
    lines.push('| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |');
    lines.push('|---|---|---|---|---|---|---|');
    input.ops.forEach((op) => {
      const out = input.outcomes.find((o) => o.name === op.name);
      if (!out || out.skipped || !out.serial) return;
      lines.push(
        `| ${op.name} | ${formatMs(out.serial.p10)} | ${formatMs(out.serial.p95)} | ${op.serialP95CapMs}ms | ${formatMs(op.regressionMinDeltaMs ?? input.resolutionMs * RESOLUTION_FLOOR_MULTIPLE)} | ${out.serialGatePassed ? 'PASS' : 'FAIL'} | ${out.regressionNote ? `${out.regressionVerdict} (${out.regressionNote})` : out.regressionVerdict} |`,
      );
    });

    lines.push(
      '',
      `## Concurrent p95 (LIVE, concurrency = ${input.concurrency})`,
      '',
      '| op | p95 | cap | gate |',
      '|---|---|---|---|',
    );
    input.ops.forEach((op) => {
      const out = input.outcomes.find((o) => o.name === op.name);
      if (!out || out.skipped || !out.concurrent) return;
      const cap = op.concurrentP95CapMs ?? op.serialP95CapMs * 2;
      lines.push(
        `| ${op.name} | ${out.concurrent.p95.toFixed(2)}ms | ${cap}ms | ${out.concurrentGatePassed ? 'PASS' : 'FAIL'} |`,
      );
    });

    lines.push('', '## Memory retention (LIVE)', '');
    // gc exposed 列は測定条件の証跡。--expose-gc なしだと解放される一時使用まで
    // 拾うため、no と yes の値を同じ基準で比べられない。
    // 呼出 列も同じ証跡。 空回しは測定区間の外で fn を呼ぶため、 副作用や件数依存を
    // 持つ op では反復数だけでは実際に何回呼んだかが読めない (#1730)。
    lines.push('| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |');
    lines.push('|---|---|---|---|---|---|---|');
    input.ops.forEach((op) => {
      const out = input.outcomes.find((o) => o.name === op.name);
      if (!out || out.skipped || !out.memory) return;
      const cap = op.memoryArrayBuffersCapBytes ?? input.memoryCapDefault;
      lines.push(
        `| ${op.name} | ${out.memory.heapUsedDeltaBytes} B | ${out.memory.arrayBuffersDeltaBytes} B | ${cap} B | ${out.memory.gcExposed ? 'yes' : 'no'} | ${formatMemoryCalls(out.memory)} | ${out.memoryGatePassed ? 'PASS' : 'FAIL'} |`,
      );
    });

    lines.push('', '## Detailed serial reports', '');
    input.ops.forEach((op) => {
      const out = input.outcomes.find((o) => o.name === op.name);
      if (!out || out.skipped || !out.serial) return;
      lines.push(`### ${op.name}`);
      lines.push('');
      const priorSerial = input.priorBaseline?.[`${op.name}.live.serial`];
      lines.push(
        emitPerfReport(out.serial, {
          includeSamples: false,
          ...(priorSerial !== undefined ? { baseline: priorSerial } : {}),
        }),
      );
    });
  }

  mkdirSync(path.dirname(input.reportPath), { recursive: true });
  writeFileSync(input.reportPath, `${lines.join('\n')}\n`, 'utf8');
}
