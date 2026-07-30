# Perf Suite — form

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| validateSchema | 0.00046ms | 0.0035ms | 5ms | 0.00034ms | PASS | stable (換算後 p10 +1% (閾値未満)、 p95 +72% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| registerFieldAndSubmit | 0.0057ms | 0.02ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| getFieldErrorAfterFailure | 0.0044ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| validateSchema | cpu | 0.08ms | 0.09ms | 0.00046ms | 0.006 | 0.006 | 0.00046ms | 0.00046ms |
| registerFieldAndSubmit | cpu | 0.08ms | 0.09ms | 0.0057ms | 0.070 | 0.069 | 0.0056ms | 0.0055ms |
| getFieldErrorAfterFailure | cpu | 0.08ms | 0.09ms | 0.0044ms | 0.054 | 0.055 | 0.0043ms | 0.0044ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| validateSchema | 0.01ms | 10ms | PASS |
| registerFieldAndSubmit | 0.11ms | 10ms | PASS |
| getFieldErrorAfterFailure | 0.06ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| validateSchema | -11056 B | 0 B | 102400 B | yes | PASS |
| registerFieldAndSubmit | -10400 B | 0 B | 102400 B | yes | PASS |
| getFieldErrorAfterFailure | 1632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### validateSchema

# Perf Report — validateSchema.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0035ms |
| p99 | 0.02ms |
| mean | 0.0011ms |
| stdev | 0.0025ms |
| min | 0.00029ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.013)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | +0.0000052ms | +1.13% |
| p50 | 0.00051ms | 0.00050ms | +0.0000067ms | +1.35% |
| p95 | 0.0035ms | 0.0020ms | +0.0015ms | +72.34% |
| p99 | 0.02ms | 0.01ms | +0.0060ms | +57.89% |
| mean | 0.0011ms | 0.00094ms | +0.00015ms | +15.75% |
| min | 0.00029ms | 0.00033ms | -0.000038ms | -11.43% |
| max | 0.02ms | 0.01ms | +0.01ms | +91.40% |
| total | 0.22ms | 0.19ms | +0.03ms | +15.75% |

### registerFieldAndSubmit

# Perf Report — registerFieldAndSubmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0057ms |
| p50 | 0.0062ms |
| p95 | 0.02ms |
| p99 | 0.05ms |
| mean | 0.0085ms |
| stdev | 0.0093ms |
| min | 0.0054ms |
| max | 0.10ms |
| total | 1.71ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.989)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0056ms | 0.0055ms | +0.000070ms | +1.26% |
| p50 | 0.0061ms | 0.0059ms | +0.00018ms | +3.11% |
| p95 | 0.02ms | 0.02ms | -0.0039ms | -18.67% |
| p99 | 0.05ms | 0.04ms | +0.01ms | +38.64% |
| mean | 0.0085ms | 0.0085ms | -0.000084ms | -0.99% |
| min | 0.0054ms | 0.0053ms | +0.000067ms | +1.27% |
| max | 0.10ms | 0.10ms | -0.0032ms | -3.06% |
| total | 1.69ms | 1.71ms | -0.02ms | -0.99% |

### getFieldErrorAfterFailure

# Perf Report — getFieldErrorAfterFailure.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0044ms |
| p50 | 0.0047ms |
| p95 | 0.01ms |
| p99 | 0.06ms |
| mean | 0.0066ms |
| stdev | 0.0097ms |
| min | 0.0042ms |
| max | 0.11ms |
| total | 1.33ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.989)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0043ms | 0.0044ms | -0.000048ms | -1.09% |
| p50 | 0.0047ms | 0.0054ms | -0.00070ms | -12.92% |
| p95 | 0.010ms | 0.02ms | -0.0080ms | -44.47% |
| p99 | 0.06ms | 0.04ms | +0.03ms | +73.12% |
| mean | 0.0066ms | 0.0073ms | -0.00076ms | -10.31% |
| min | 0.0042ms | 0.0042ms | -0.000046ms | -1.09% |
| max | 0.11ms | 0.06ms | +0.05ms | +81.52% |
| total | 1.31ms | 1.47ms | -0.15ms | -10.31% |

