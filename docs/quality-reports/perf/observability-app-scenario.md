# Perf Suite — observability-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.03ms | 0.07ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_history_detect (200 test × 5 run) | 0.06ms | 0.08ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| threshold_varying_workload (10 different threshold) | 0.04ms | 0.05ms | 100ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.16ms | 200ms | PASS |
| large_history_detect (200 test × 5 run) | 0.37ms | 200ms | PASS |
| threshold_varying_workload (10 different threshold) | 0.22ms | 200ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | -6368 B | 0 B | 102400 B | yes | PASS |
| large_history_detect (200 test × 5 run) | 6032 B | 0 B | 102400 B | yes | PASS |
| threshold_varying_workload (10 different threshold) | 688 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### flaky_detect_burst (50 test × 10 run history detect)

# Perf Report — flaky_detect_burst (50 test × 10 run history detect).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.07ms |
| p99 | 0.07ms |
| mean | 0.05ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.07ms |
| total | 1.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0077ms | -18.69% |
| p50 | 0.04ms | 0.06ms | -0.02ms | -38.72% |
| p95 | 0.07ms | 0.11ms | -0.05ms | -41.11% |
| p99 | 0.07ms | 0.17ms | -0.09ms | -55.86% |
| mean | 0.05ms | 0.07ms | -0.02ms | -31.22% |
| min | 0.03ms | 0.04ms | -0.0081ms | -20.10% |
| max | 0.07ms | 0.18ms | -0.11ms | -59.44% |
| total | 1.39ms | 2.02ms | -0.63ms | -31.22% |

### large_history_detect (200 test × 5 run)

# Perf Report — large_history_detect (200 test × 5 run).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.06ms |
| p50 | 0.07ms |
| p95 | 0.08ms |
| p99 | 0.21ms |
| mean | 0.07ms |
| stdev | 0.04ms |
| min | 0.06ms |
| max | 0.26ms |
| total | 2.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.08ms | -0.01ms | -19.27% |
| p50 | 0.07ms | 0.10ms | -0.03ms | -31.61% |
| p95 | 0.08ms | 0.31ms | -0.23ms | -74.71% |
| p99 | 0.21ms | 0.49ms | -0.27ms | -56.50% |
| mean | 0.07ms | 0.14ms | -0.07ms | -48.88% |
| min | 0.06ms | 0.07ms | -0.01ms | -16.30% |
| max | 0.26ms | 0.54ms | -0.27ms | -50.96% |
| total | 2.19ms | 4.28ms | -2.09ms | -48.88% |

### threshold_varying_workload (10 different threshold)

# Perf Report — threshold_varying_workload (10 different threshold).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.0022ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 1.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.05ms | -0.01ms | -20.95% |
| p50 | 0.04ms | 0.06ms | -0.02ms | -26.89% |
| p95 | 0.05ms | 0.16ms | -0.11ms | -70.69% |
| p99 | 0.05ms | 0.28ms | -0.23ms | -82.79% |
| mean | 0.04ms | 0.08ms | -0.04ms | -47.76% |
| min | 0.04ms | 0.05ms | -0.01ms | -20.10% |
| max | 0.05ms | 0.33ms | -0.28ms | -85.14% |
| total | 1.27ms | 2.43ms | -1.16ms | -47.76% |

