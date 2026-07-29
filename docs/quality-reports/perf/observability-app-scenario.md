# Perf Suite — observability-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.03ms | 0.09ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_history_detect (200 test × 5 run) | 0.07ms | 0.10ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| threshold_varying_workload (10 different threshold) | 0.04ms | 0.05ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.16ms | 200ms | PASS |
| large_history_detect (200 test × 5 run) | 0.49ms | 200ms | PASS |
| threshold_varying_workload (10 different threshold) | 0.30ms | 200ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | -8168 B | 0 B | 102400 B | yes | PASS |
| large_history_detect (200 test × 5 run) | 6272 B | 0 B | 102400 B | yes | PASS |
| threshold_varying_workload (10 different threshold) | 768 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### flaky_detect_burst (50 test × 10 run history detect)

# Perf Report — flaky_detect_burst (50 test × 10 run history detect).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.06ms |
| p95 | 0.09ms |
| p99 | 0.10ms |
| mean | 0.05ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.10ms |
| total | 1.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0076ms | -18.33% |
| p50 | 0.06ms | 0.06ms | -0.0054ms | -8.54% |
| p95 | 0.09ms | 0.11ms | -0.03ms | -21.94% |
| p99 | 0.10ms | 0.17ms | -0.07ms | -42.59% |
| mean | 0.05ms | 0.07ms | -0.01ms | -19.26% |
| min | 0.03ms | 0.04ms | -0.0072ms | -17.83% |
| max | 0.10ms | 0.18ms | -0.09ms | -47.03% |
| total | 1.63ms | 2.02ms | -0.39ms | -19.26% |

### large_history_detect (200 test × 5 run)

# Perf Report — large_history_detect (200 test × 5 run).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.07ms |
| p50 | 0.07ms |
| p95 | 0.10ms |
| p99 | 0.21ms |
| mean | 0.08ms |
| stdev | 0.03ms |
| min | 0.07ms |
| max | 0.25ms |
| total | 2.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.07ms | 0.08ms | -0.01ms | -13.87% |
| p50 | 0.07ms | 0.10ms | -0.03ms | -28.40% |
| p95 | 0.10ms | 0.31ms | -0.21ms | -68.28% |
| p99 | 0.21ms | 0.49ms | -0.28ms | -56.79% |
| mean | 0.08ms | 0.14ms | -0.06ms | -43.99% |
| min | 0.07ms | 0.07ms | -0.0076ms | -10.37% |
| max | 0.25ms | 0.54ms | -0.28ms | -52.94% |
| total | 2.40ms | 4.28ms | -1.88ms | -43.99% |

### threshold_varying_workload (10 different threshold)

# Perf Report — threshold_varying_workload (10 different threshold).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.05ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.05ms |
| stdev | 0.0028ms |
| min | 0.04ms |
| max | 0.06ms |
| total | 1.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.05ms | -0.0069ms | -13.36% |
| p50 | 0.05ms | 0.06ms | -0.01ms | -19.44% |
| p95 | 0.05ms | 0.16ms | -0.11ms | -66.69% |
| p99 | 0.06ms | 0.28ms | -0.22ms | -80.17% |
| mean | 0.05ms | 0.08ms | -0.03ms | -42.63% |
| min | 0.04ms | 0.05ms | -0.0064ms | -12.58% |
| max | 0.06ms | 0.33ms | -0.27ms | -82.80% |
| total | 1.39ms | 2.43ms | -1.04ms | -42.63% |

