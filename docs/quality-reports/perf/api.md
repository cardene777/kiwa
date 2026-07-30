# Perf Suite — api

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| requestClientGet | 0.0093ms | 0.05ms | 5ms | 0.00033ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +45% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| requestClientPost | 0.0072ms | 0.02ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| requestClientGet | cpu | 0.08ms | 0.09ms | 0.0093ms | 0.116 | 0.114 | 0.0093ms | 0.0092ms |
| requestClientPost | cpu | 0.08ms | 0.09ms | 0.0072ms | 0.089 | 0.088 | 0.0072ms | 0.0071ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| requestClientGet | 0.22ms | 10ms | PASS |
| requestClientPost | 0.08ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| requestClientGet | -13456 B | -20606 B | 102400 B | yes | PASS |
| requestClientPost | 1696 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### requestClientGet

# Perf Report — requestClientGet.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0093ms |
| p50 | 0.01ms |
| p95 | 0.05ms |
| p99 | 0.08ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0087ms |
| max | 0.14ms |
| total | 3.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.002)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0093ms | 0.0092ms | +0.00018ms | +1.98% |
| p50 | 0.01ms | 0.01ms | +0.000023ms | +0.21% |
| p95 | 0.05ms | 0.03ms | +0.01ms | +44.70% |
| p99 | 0.08ms | 0.10ms | -0.02ms | -18.58% |
| mean | 0.02ms | 0.02ms | +0.00018ms | +1.21% |
| min | 0.0087ms | 0.0085ms | +0.00023ms | +2.68% |
| max | 0.14ms | 0.15ms | -0.01ms | -7.85% |
| total | 3.09ms | 3.05ms | +0.04ms | +1.21% |

### requestClientPost

# Perf Report — requestClientPost.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0072ms |
| p50 | 0.0084ms |
| p95 | 0.02ms |
| p99 | 0.05ms |
| mean | 0.01ms |
| stdev | 0.0083ms |
| min | 0.0068ms |
| max | 0.09ms |
| total | 2.05ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.007)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0072ms | 0.0071ms | +0.00014ms | +1.92% |
| p50 | 0.0084ms | 0.0078ms | +0.00060ms | +7.70% |
| p95 | 0.02ms | 0.02ms | +0.0015ms | +8.35% |
| p99 | 0.05ms | 0.07ms | -0.03ms | -34.38% |
| mean | 0.01ms | 0.01ms | -0.00017ms | -1.63% |
| min | 0.0069ms | 0.0068ms | +0.000092ms | +1.35% |
| max | 0.09ms | 0.14ms | -0.05ms | -33.45% |
| total | 2.07ms | 2.10ms | -0.03ms | -1.63% |

