# @kiwa-lab/perf-harness

kiwa package + dogfood app + OSS 向け汎用性能検査 harness。 p50 / p95 / p99 latency 測定、 baseline 永続化、 regression 検知、 memory delta 計測、 3 layer perf gate (serial / concurrent / memory) を提供する。 spec SSOT = 本 README + `src/types.ts`。

## 精度契約 (旧実装からの変更点)

本 harness が保証する精度は 5 軸。 旧実装 (v0.1-0.3) からの逸脱を修正した。

### 1. Percentile = Type 7 linear interpolation

旧実装は nearest-rank (`ceil(n * ratio) - 1`)。 n < 100 で 5-10pt ずれる。 現在は Type 7 (NumPy / R default) 経路で adjacent rank を線形補間する。 `percentileType7` が SSOT で、 report / regression / gate 全て同経路を使う。

### 2. Regression = bootstrap CI on p95 delta

旧実装は Welch t-test を **mean** に対して、 magnitude 判定を **p95** に対して回していた。 統計軸が矛盾していたため、 「mean で有意差なし + p95 が 20% 悪化 = stable」 という致命的誤判定が起き得た。

現在は p95 delta 分布に対して bootstrap CI (default 2000 iter / 95% CI) を計算し、 CI が 0 を跨がないかつ delta が threshold を超えた時のみ regressed / improved を判定する。 統計軸が一貫。

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
| `buildMeasureResult(name, iter, warmup, samples, trimPct?, converged?)` | 既存 samples から MeasureResult 再構築。 test 用途。 |
| `percentileType7(sorted, ratio)` | Type 7 linear interpolation percentile。 SSOT 経路。 |
| `detectRegression(input)` | bootstrap CI on p95 delta で regression 判定。 default 95% CI + threshold 20%。 |
| `detectRegressionStrict(input)` | Strict mode = 99% CI + threshold 10%。 release gate 用。 |
| `loadBaseline(path)` | Envelope 読込 + 現行 env との mismatch 列挙。 legacy schema 自動 upgrade。 |
| `saveBaseline(path, result, opts?)` | 単一 result 保存 (envelope wrap)。 |
| `saveBaselineEnvelope(path, envelope)` | Envelope 直接保存。 3 layer 集約用。 |
| `captureEnv()` | 現行 machine の BaselineEnv を取得。 |
| `evaluatePerfGate(input)` | @kiwa-lab/quality-metrics release gate と統合。 |
| `runPerf3Layer(input)` | Serial + concurrent + memory 3 axis 一括実行 + report 出力。 |

## 制約 (制約を明示することで正しく使わせる)

- **wall-clock 測定** ... `process.hrtime.bigint()` を使うが、 sub-ms 測定は OS scheduler の解像度 (~1ms on macOS) に制約される。 sub-ms op は batch 化して測る。
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
