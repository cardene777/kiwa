# Perf Suite — observability-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.03ms | 0.07ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_history_detect (200 test × 5 run) | 0.06ms | 0.08ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| threshold_varying_workload (10 different threshold) | 0.04ms | 0.05ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.16ms | 200ms | PASS |
| large_history_detect (200 test × 5 run) | 0.32ms | 200ms | PASS |
| threshold_varying_workload (10 different threshold) | 0.27ms | 200ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | -7648 B | 0 B | 102400 B | yes | PASS |
| large_history_detect (200 test × 5 run) | 6032 B | 0 B | 102400 B | yes | PASS |
| threshold_varying_workload (10 different threshold) | -240 B | 0 B | 102400 B | yes | PASS |

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
| p10 | 0.03ms | 0.04ms | -0.0077ms | -18.62% |
| p50 | 0.04ms | 0.06ms | -0.02ms | -38.06% |
| p95 | 0.07ms | 0.11ms | -0.04ms | -36.61% |
| p99 | 0.07ms | 0.17ms | -0.09ms | -55.95% |
| mean | 0.05ms | 0.07ms | -0.02ms | -31.25% |
| min | 0.03ms | 0.04ms | -0.0079ms | -19.59% |
| max | 0.07ms | 0.18ms | -0.11ms | -59.94% |
| total | 1.39ms | 2.02ms | -0.63ms | -31.25% |

### large_history_detect (200 test × 5 run)

# Perf Report — large_history_detect (200 test × 5 run).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.06ms |
| p50 | 0.07ms |
| p95 | 0.08ms |
| p99 | 0.13ms |
| mean | 0.07ms |
| stdev | 0.02ms |
| min | 0.06ms |
| max | 0.15ms |
| total | 2.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.08ms | -0.01ms | -18.01% |
| p50 | 0.07ms | 0.10ms | -0.03ms | -31.02% |
| p95 | 0.08ms | 0.31ms | -0.23ms | -74.05% |
| p99 | 0.13ms | 0.49ms | -0.36ms | -73.62% |
| mean | 0.07ms | 0.14ms | -0.07ms | -51.13% |
| min | 0.06ms | 0.07ms | -0.01ms | -14.59% |
| max | 0.15ms | 0.54ms | -0.39ms | -72.78% |
| total | 2.09ms | 4.28ms | -2.19ms | -51.13% |

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
| stdev | 0.0026ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 1.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.05ms | -0.0099ms | -19.21% |
| p50 | 0.04ms | 0.06ms | -0.01ms | -25.27% |
| p95 | 0.05ms | 0.16ms | -0.11ms | -69.01% |
| p99 | 0.05ms | 0.28ms | -0.23ms | -81.94% |
| mean | 0.04ms | 0.08ms | -0.04ms | -46.51% |
| min | 0.04ms | 0.05ms | -0.0096ms | -18.87% |
| max | 0.05ms | 0.33ms | -0.28ms | -84.45% |
| total | 1.30ms | 2.43ms | -1.13ms | -46.51% |

