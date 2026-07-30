# @kiwa-lab/perf-harness

kiwa package + dogfood app + OSS 向け汎用性能検査 harness。 p10 / p50 / p95 / p99 latency 測定、 baseline 永続化、 regression 検知 (判定軸 = p10)、 memory delta 計測、 3 layer perf gate (serial / concurrent / memory) を提供する。 spec SSOT = 本 README + `src/types.ts`。

## 精度契約 (旧実装からの変更点)

本 harness が保証する精度は 5 軸。 旧実装 (v0.1-0.3) からの逸脱を修正した。

### 1. Percentile = Type 7 linear interpolation

旧実装は nearest-rank (`ceil(n * ratio) - 1`)。 n < 100 で 5-10pt ずれる。 現在は Type 7 (NumPy / R default) 経路で adjacent rank を線形補間する。 `percentileType7` が SSOT で、 report / regression / gate 全て同経路を使う。

### 2. Regression = bootstrap CI on p10 delta

旧実装は Welch t-test を **mean** に対して、 magnitude 判定を **p95** に対して回していた。 統計軸が矛盾していたため、 「mean で有意差なし + p95 が 20% 悪化 = stable」 という致命的誤判定が起き得た。

現在は分布の下側 (p10) の delta に対して bootstrap CI (default 2000 iter / 95% CI) を計算し、 CI が 0 を跨がないかつ delta が threshold を超えた時のみ regressed / improved を判定する。

上側ではなく下側を読むのは、 測定を乱す要因 (scheduler の横取り / GC / page cache miss / 他 process) がどれも実行時間を伸ばす方向にしか働かないため。 上側の裾はその日の機械の状態を、 下側は邪魔が入らなかった時の実費を表す。 実行をまたいで比べられるのは後者だけで、 実測では同じ実装の p95 が 134-289% 動く条件下で p10 は 6-12% に収まる (#1718)。

上限 (cap) の判定は従来どおり p95 を読む。 1 回の実行の中で完結する判定なので、 実行間の振れ幅の影響を受けない。 一部の呼出だけが遅くなる変化は下側に出ないため、 p95 の変化率を `RegressionResult.tailDeltaPct` に載せて報告に残す (gate には使わない)。

絶対下限は固定値ではなく、 実行の中で測る。 `measureHarnessResolution` が空の関数を op と同じ経路で呼んで p10 を取り、 その 2 倍を下限にする。 それより小さい差は op ではなく harness 自身の往復を見ている。 詳細と却下した案は `docs/quality/perf-thresholds.md` § Regression detection defaults が SSOT。

判定に使う量は p10 そのものではなく、 **同じ実行の中で 1 呼出ずつ交互に測った基準 op との比** (#1737)。 実行と実行の間で機械の状態が変われば実装が同じでも差が出るため、 分子と分母で相殺する。 実装は「今回の測定に `baseline の基準 p10 ÷ 今回の基準 p10` を掛けて baseline を測った時の機械の速さへ換算する」 形で、 比同士を比べるのと数学的に同じだが判定量が ms のまま残るので絶対下限も report の表記も意味を保てる。

基準は呼出側に関数を書かせず、 種類 (`cpu` / `fs-read` / `fs-write`、 既定 `cpu`) を `PerfOpSpec.referenceKind` で宣言させ、 実装は `src/reference.ts` が持つ。 基準が対象と同じ邪魔を受けないと相殺が起きないため種類を合わせる (fs read の実行間振れ幅 = `fs-read` 基準で 135 → 17%、 `cpu` 基準では 170 → 171% と変わらない)。 呼出が自前の基準を書けると op ごとに都合のよい分母を選べてしまい、 比が op をまたいで比較できる量でなくなる。

実行全体に乗るずれは消えたが (全 492 op の比の変化の中央値が 3 回の実測すべてで 0.0%)、 op 個別のばらつきは残る。 そのため `runPerf3Layer` の `regressionGate` の既定は false のまま。 詳細 = `docs/quality/perf-thresholds.md` § In-run normalization。

### 3. Warmup = fixed | convergent の 2 strategy

旧実装は固定 n 回。 JIT / disk cache が warm 到達したかの判定なし。 現在は `warmupStrategy: 'convergent'` を選ぶと、 直近 window (default 20 sample) の p95 変動幅が mean の 5% 以内で安定した時点で自動終了する。 `MeasureResult.warmupConverged` に収束成否を返す。

### 4. Outlier = trimPercent option

GC pause 等の外れ値が p99 を dominate する。 `trimPercent: 2` で top 2% + bottom 2% を除外した trim 統計を `result.trimmed` に別途返す。 元 sample は保持したまま。 加えて median ± 3 * MAD の外側を outlier としてカウント (`result.outlierCount`)、 分布形状を robust に把握できる。

### 5. Baseline = env metadata 記録

旧実装は `MeasureResult` を JSON にダンプするだけ。 別 machine で保存された baseline を比較しても意味がない。 現在は `BaselineEnvelope` に `nodeVersion` / `platform` / `hostname` / `cpuModel` / `cpuCount` / `gitSha` / `savedAt` を必須記録、 `loadBaseline()` が現行環境との mismatch を `envMismatch` に列挙する。 legacy schema (envelope なし) は自動 upgrade して読める。

## Single measure

```ts
import { measure } from '@kiwa-lab/perf-harness';

const result = await measure({
  name: 'reply',
  iterations: 100,
  warmupStrategy: 'convergent',
  warmupConvergence: { windowSize: 20, toleranceRatio: 0.05, maxIterations: 200 },
  trimPercent: 2,
  fn: async () => {
    await adapter.reply({ userMessage: 'Say hi.' });
  },
});

console.log(result.p95, result.trimmed?.p95, result.outlierCount, result.warmupConverged);
```

## Regression 検知

```ts
import { detectRegression, loadBaseline, saveBaseline, measure } from '@kiwa-lab/perf-harness';

const current = await measure({ name: 'reply', iterations: 200, fn });
const loaded = await loadBaseline('./baseline.json');
if (loaded) {
  if (loaded.envMismatch.length > 0) {
    console.warn('baseline env mismatch:', loaded.envMismatch);
  }
  const baseline = loaded.envelope.results['reply'];
  const regression = detectRegression({ current, baseline, threshold: 0.2 });
  console.log(regression.verdict, regression.ci);
}
await saveBaseline('./baseline.json', current);
```

Regression 判定 verdict = `regressed | improved | stable`。 `regressed` は CI が 0 より上 (両端 > 0) かつ delta ≥ threshold の時のみ。 CI が 0 を跨いでいれば統計的に有意でないため常に `stable`。

## Strict mode

release gate 経路 (false negative が致命的) では `detectRegressionStrict` を使う。 default = 99% CI + threshold 10%。 通常の detectRegression (95% CI + 20%) より sensitivity 高。

```ts
import { detectRegressionStrict } from '@kiwa-lab/perf-harness';

const regression = detectRegressionStrict({ current, baseline });
```

## Release gate 統合

`evaluatePerfGate` は `@kiwa-lab/quality-metrics` の release gate と統合する。 p95 / cost / token / accuracy を axis に取り、 threshold breach を列挙する。

```ts
import { evaluatePerfGate } from '@kiwa-lab/perf-harness';

const gate = evaluatePerfGate({
  result,
  thresholds: { p95Ms: 100, costUsd: 0.01, accuracy: 0.9 },
  metrics: { costUsd: 0.008, accuracy: 0.92 },
});

console.log(gate.verdict.passed, gate.breaches);
```

## 3 layer perf harness (serial / concurrent / memory)

`runPerf3Layer` は 3 axis を一括実行する orchestrator。 個別 op に対して serial p95 / concurrent p95 / memory arrayBuffers delta を測り、 baseline 比較 + report 出力まで自動。

```ts
import { runPerf3Layer } from '@kiwa-lab/perf-harness';

await runPerf3Layer({
  moduleName: 'dogfood-anthropic-chatbot',
  ops: [
    { name: 'reply', serialP95CapMs: 100, concurrentP95CapMs: 200, fn: async () => adapter.reply(...) },
  ],
  reportPath: './perf-report.md',
});
```

## API 一覧 (SSOT = `src/types.ts`)

| 経路 | 説明 |
|---|---|
| `measure(input)` | 単一 op 測定。 percentile Type 7 / warmup convergent / trim percent 対応。 |
| `measureHarnessResolution(opts?)` | 空の関数を同じ経路で呼んだ費用 (p10) を返す。 回帰判定の絶対下限の素になる。 |
| `measureAlternating(input)` | 対象と基準 op を「基準 → 対象」 の順で 1 呼出ずつ交互に測る。 対象の `reference` field に基準の p10 を埋めて返す。 |
| `createReferenceOps()` | 基準 op の一式を作る。 `get(kind)` で取り出し、 使い終わりに `dispose()` する (fs 系は temp dir を掘る)。 |
| `resolveNormalization(current, baseline)` | 換算倍率と成立可否を返す。 種類 ・ 実装版 ・ 分母の有限性が揃った時だけ成立する。 |
| `buildMeasureResult(name, iter, warmup, samples, trimPct?, converged?)` | 既存 samples から MeasureResult 再構築。 test 用途。 |
| `percentileType7(sorted, ratio)` | Type 7 linear interpolation percentile。 SSOT 経路。 |
| `detectRegression(input)` | bootstrap CI on p10 delta で regression 判定。 default 95% CI + threshold 20%。 |
| `detectRegressionStrict(input)` | Strict mode = 99% CI + threshold 10%。 release gate 用。 |
| `loadBaseline(path)` | Envelope 読込 + 現行 env との mismatch 列挙。 legacy schema 自動 upgrade。 |
| `saveBaseline(path, result, opts?)` | 単一 result 保存 (envelope wrap)。 |
| `saveBaselineEnvelope(path, envelope)` | Envelope 直接保存。 3 layer 集約用。 |
| `captureEnv()` | 現行 machine の BaselineEnv を取得。 |
| `evaluatePerfGate(input)` | @kiwa-lab/quality-metrics release gate と統合。 |
| `runPerf3Layer(input)` | Serial + concurrent + memory 3 axis 一括実行 + report 出力。 |

## 制約 (制約を明示することで正しく使わせる)

- **wall-clock 測定** ... `process.hrtime.bigint()` を使う。 sub-ms op を batch 化して測る案は #1718 で実測により却下した (1 sample を 1ms 相当にまとめても fs 系の振れ幅は 136-971% で、 batch 前より改善しない)。 sub-ms は下側の分位 (p10) と実測した分解能で扱う。
- **shared machine ノイズ** ... CI / laptop で他 process が動いている環境の絶対値は信用しない。 regression 検知は同一 machine 内 delta のみ意味がある。 `loadBaseline` の envMismatch を必ず確認する。
- **memory 計測** ... `measureMemory` は `--expose-gc` flag が必要。 flag なしでも動くが数値がノイジー。
- **bootstrap 乱数** ... `Math.random()` を使うため実行毎に CI がわずかに揺れる。 決定的な結果が必要なら `bootstrapIterations` を上げる (default 2000 → 10000)。
- **outlier trim** ... trim は元 sample を書き換えず `result.trimmed` に別途返す。 元 samples を破壊しない設計は debug 目的で保持する。

## Versioning

- v0.1-0.3 = 旧実装 (nearest-rank percentile + Welch t-test on mean)。 精度契約は本 spec より弱い。
- v0.4+ = 本 spec 準拠。 精度契約 5 軸を保証、 baseline schema v1 envelope 経路。 legacy schema は自動 upgrade で読める。

<!-- kiwa-docs:start -->
## Documentation

公開ドキュメントを正本として管理しています。

- [概要](https://cardene777.github.io/kiwa/libraries/quality/perf-harness/)
- [はじめる](https://cardene777.github.io/kiwa/libraries/quality/perf-harness/quickstart)
- [使い方](https://cardene777.github.io/kiwa/libraries/quality/perf-harness/how-to)
- [リファレンス](https://cardene777.github.io/kiwa/libraries/quality/perf-harness/reference)

編集元は [docs/libraries/quality/perf-harness](../../docs/libraries/quality/perf-harness/) です。
<!-- kiwa-docs:end -->
