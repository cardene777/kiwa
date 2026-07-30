# Perf Suite — dogfood-observability-dashboard

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| refreshDashboard | 0.0044ms | 0.02ms | 30ms | 0.00031ms | PASS | stable (換算後 p10 +45% (閾値未満)、 p95 +47% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| runQuery | 0.00096ms | 0.0077ms | 20ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| refreshDashboard | cpu | 0.09ms | 0.14ms | 0.0044ms | 0.049 | 0.034 | 0.0040ms | 0.0028ms |
| runQuery | cpu | 0.09ms | 0.09ms | 0.00096ms | 0.011 | 0.011 | 0.00088ms | 0.00087ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| refreshDashboard | 0.05ms | 60ms | PASS |
| runQuery | 0.02ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| refreshDashboard | 33080 B | 0 B | 102400 B | yes | PASS |
| runQuery | 12736 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### refreshDashboard

# Perf Report — refreshDashboard.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0044ms |
| p50 | 0.0051ms |
| p95 | 0.02ms |
| p99 | 0.29ms |
| mean | 0.02ms |
| stdev | 0.07ms |
| min | 0.0030ms |
| max | 0.43ms |
| total | 0.77ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.923)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0040ms | 0.0028ms | +0.0012ms | +44.65% |
| p50 | 0.0047ms | 0.0044ms | +0.00024ms | +5.34% |
| p95 | 0.02ms | 0.01ms | +0.0065ms | +46.93% |
| p99 | 0.27ms | 0.02ms | +0.25ms | +1391.20% |
| mean | 0.02ms | 0.0055ms | +0.01ms | +223.40% |
| min | 0.0027ms | 0.0027ms | +0.000024ms | +0.88% |
| max | 0.39ms | 0.02ms | +0.37ms | +1994.41% |
| total | 0.71ms | 0.22ms | +0.49ms | +223.40% |

### runQuery

# Perf Report — runQuery.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.00096ms |
| p50 | 0.0013ms |
| p95 | 0.0077ms |
| p99 | 0.01ms |
| mean | 0.0023ms |
| stdev | 0.0028ms |
| min | 0.00083ms |
| max | 0.02ms |
| total | 0.09ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.917)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00087ms | +0.0000078ms | +0.90% |
| p50 | 0.0012ms | 0.0013ms | -0.00011ms | -8.34% |
| p95 | 0.0070ms | 0.0077ms | -0.00069ms | -8.96% |
| p99 | 0.01ms | 0.01ms | -0.0018ms | -13.12% |
| mean | 0.0021ms | 0.0023ms | -0.00012ms | -5.41% |
| min | 0.00076ms | 0.00075ms | +0.000014ms | +1.88% |
| max | 0.01ms | 0.02ms | -0.0018ms | -10.85% |
| total | 0.09ms | 0.09ms | -0.0049ms | -5.41% |

