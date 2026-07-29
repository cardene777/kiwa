# Perf Suite — observability-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.03ms | 0.06ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_history_detect (200 test × 5 run) | 0.06ms | 0.07ms | 100ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| threshold_varying_workload (10 different threshold) | 0.04ms | 0.06ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | cpu | 0.08ms | 0.03ms | 0.417 | 0.422 | 0.03ms | 0.03ms |
| large_history_detect (200 test × 5 run) | cpu | 0.08ms | 0.06ms | 0.665 | 0.688 | 0.05ms | 0.06ms |
| threshold_varying_workload (10 different threshold) | cpu | 0.08ms | 0.04ms | 0.541 | 0.532 | 0.04ms | 0.04ms |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.15ms | 200ms | PASS |
| large_history_detect (200 test × 5 run) | 0.41ms | 200ms | PASS |
| threshold_varying_workload (10 different threshold) | 0.28ms | 200ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | -7584 B | 0 B | 102400 B | yes | PASS |
| large_history_detect (200 test × 5 run) | 6536 B | 0 B | 102400 B | yes | PASS |
| threshold_varying_workload (10 different threshold) | 800 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### flaky_detect_burst (50 test × 10 run history detect)

# Perf Report — flaky_detect_burst (50 test × 10 run history detect).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.06ms |
| p99 | 0.07ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.07ms |
| total | 1.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00046ms | -1.33% |
| p50 | 0.04ms | 0.04ms | -0.0019ms | -4.87% |
| p95 | 0.06ms | 0.07ms | -0.0051ms | -7.62% |
| p99 | 0.07ms | 0.07ms | -0.0049ms | -6.71% |
| mean | 0.04ms | 0.04ms | -0.0033ms | -7.37% |
| min | 0.03ms | 0.03ms | -0.00050ms | -1.48% |
| max | 0.07ms | 0.08ms | -0.0049ms | -6.54% |
| total | 1.23ms | 1.33ms | -0.10ms | -7.37% |

### large_history_detect (200 test × 5 run)

# Perf Report — large_history_detect (200 test × 5 run).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.06ms |
| p50 | 0.06ms |
| p95 | 0.07ms |
| p99 | 0.09ms |
| mean | 0.06ms |
| stdev | 0.0094ms |
| min | 0.05ms |
| max | 0.10ms |
| total | 1.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.06ms | -0.0015ms | -2.61% |
| p50 | 0.06ms | 0.07ms | -0.01ms | -18.03% |
| p95 | 0.07ms | 0.11ms | -0.04ms | -36.18% |
| p99 | 0.09ms | 0.18ms | -0.09ms | -49.21% |
| mean | 0.06ms | 0.08ms | -0.01ms | -18.29% |
| min | 0.05ms | 0.06ms | -0.00038ms | -0.68% |
| max | 0.10ms | 0.20ms | -0.11ms | -51.70% |
| total | 1.86ms | 2.28ms | -0.42ms | -18.29% |

### threshold_varying_workload (10 different threshold)

# Perf Report — threshold_varying_workload (10 different threshold).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.05ms |
| p95 | 0.06ms |
| p99 | 0.06ms |
| mean | 0.05ms |
| stdev | 0.0045ms |
| min | 0.04ms |
| max | 0.06ms |
| total | 1.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | +0.00059ms | +1.35% |
| p50 | 0.05ms | 0.04ms | +0.00065ms | +1.45% |
| p95 | 0.06ms | 0.05ms | +0.0071ms | +14.42% |
| p99 | 0.06ms | 0.06ms | +0.0073ms | +13.11% |
| mean | 0.05ms | 0.05ms | +0.0016ms | +3.59% |
| min | 0.04ms | 0.04ms | +0.00067ms | +1.53% |
| max | 0.06ms | 0.06ms | +0.0071ms | +12.46% |
| total | 1.40ms | 1.35ms | +0.05ms | +3.59% |

