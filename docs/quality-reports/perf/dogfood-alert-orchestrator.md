# Perf Suite — dogfood-alert-orchestrator

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateRules | 0.0016ms | 0.0067ms | 30ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| routeAlert | 0.00083ms | 0.0038ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| advanceEscalation | 0.0010ms | 0.0098ms | 20ms | 0.00033ms | PASS | stable (換算後 p10 +1% (閾値未満)、 p95 +50% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| evaluateRules | cpu | 0.08ms | 0.09ms | 0.0016ms | 0.020 | 0.023 | 0.0017ms | 0.0019ms |
| routeAlert | cpu | 0.08ms | 0.10ms | 0.00083ms | 0.010 | 0.010 | 0.00082ms | 0.00083ms |
| advanceEscalation | cpu | 0.08ms | 0.10ms | 0.0010ms | 0.012 | 0.012 | 0.00097ms | 0.00096ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateRules | 0.03ms | 60ms | PASS |
| routeAlert | 0.02ms | 40ms | PASS |
| advanceEscalation | 0.02ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateRules | 12880 B | 0 B | 102400 B | yes | PASS |
| routeAlert | 34288 B | 0 B | 102400 B | yes | PASS |
| advanceEscalation | 22648 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateRules

# Perf Report — evaluateRules.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0016ms |
| p50 | 0.0019ms |
| p95 | 0.0067ms |
| p99 | 0.01ms |
| mean | 0.0030ms |
| stdev | 0.0023ms |
| min | 0.0016ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.019)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0017ms | 0.0019ms | -0.00022ms | -11.50% |
| p50 | 0.0020ms | 0.0034ms | -0.0014ms | -41.15% |
| p95 | 0.0068ms | 0.03ms | -0.03ms | -79.57% |
| p99 | 0.01ms | 0.06ms | -0.05ms | -81.41% |
| mean | 0.0031ms | 0.0098ms | -0.0067ms | -68.73% |
| min | 0.0017ms | 0.0018ms | -0.00014ms | -7.56% |
| max | 0.01ms | 0.06ms | -0.05ms | -79.74% |
| total | 0.12ms | 0.39ms | -0.27ms | -68.73% |

### routeAlert

# Perf Report — routeAlert.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.00092ms |
| p95 | 0.0038ms |
| p99 | 0.0085ms |
| mean | 0.0015ms |
| stdev | 0.0017ms |
| min | 0.00079ms |
| max | 0.0099ms |
| total | 0.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.980)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00082ms | 0.00083ms | -0.000017ms | -1.99% |
| p50 | 0.00090ms | 0.00088ms | +0.000024ms | +2.71% |
| p95 | 0.0037ms | 0.01ms | -0.0081ms | -68.53% |
| p99 | 0.0083ms | 0.02ms | -0.0068ms | -45.10% |
| mean | 0.0015ms | 0.0025ms | -0.0011ms | -42.73% |
| min | 0.00078ms | 0.00083ms | -0.000058ms | -6.93% |
| max | 0.0097ms | 0.02ms | -0.0072ms | -42.68% |
| total | 0.06ms | 0.10ms | -0.04ms | -42.73% |

### advanceEscalation

# Perf Report — advanceEscalation.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0011ms |
| p95 | 0.0098ms |
| p99 | 0.02ms |
| mean | 0.0023ms |
| stdev | 0.0035ms |
| min | 0.00096ms |
| max | 0.02ms |
| total | 0.09ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.977)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00097ms | 0.00096ms | +0.000014ms | +1.48% |
| p50 | 0.0011ms | 0.0010ms | +0.000017ms | +1.65% |
| p95 | 0.0096ms | 0.0064ms | +0.0032ms | +50.36% |
| p99 | 0.01ms | 0.01ms | +0.0020ms | +15.47% |
| mean | 0.0023ms | 0.0018ms | +0.00047ms | +25.78% |
| min | 0.00094ms | 0.00096ms | -0.000022ms | -2.29% |
| max | 0.02ms | 0.02ms | -0.0016ms | -9.27% |
| total | 0.09ms | 0.07ms | +0.02ms | +25.78% |

