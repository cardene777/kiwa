# Perf Suite — observability-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.03ms | 0.08ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_history_detect (200 test × 5 run) | 0.06ms | 0.09ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| threshold_varying_workload (10 different threshold) | 0.04ms | 0.05ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.17ms | 200ms | PASS |
| large_history_detect (200 test × 5 run) | 0.29ms | 200ms | PASS |
| threshold_varying_workload (10 different threshold) | 0.27ms | 200ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | -7624 B | 0 B | 102400 B | yes | PASS |
| large_history_detect (200 test × 5 run) | 7456 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.08ms |
| p99 | 0.10ms |
| mean | 0.05ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.11ms |
| total | 1.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0070ms | -17.01% |
| p50 | 0.04ms | 0.06ms | -0.03ms | -43.15% |
| p95 | 0.08ms | 0.11ms | -0.04ms | -32.76% |
| p99 | 0.10ms | 0.17ms | -0.07ms | -39.91% |
| mean | 0.05ms | 0.07ms | -0.02ms | -29.97% |
| min | 0.03ms | 0.04ms | -0.0065ms | -16.17% |
| max | 0.11ms | 0.18ms | -0.08ms | -41.70% |
| total | 1.42ms | 2.02ms | -0.61ms | -29.97% |

### large_history_detect (200 test × 5 run)

# Perf Report — large_history_detect (200 test × 5 run).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.06ms |
| p50 | 0.07ms |
| p95 | 0.09ms |
| p99 | 0.17ms |
| mean | 0.08ms |
| stdev | 0.03ms |
| min | 0.06ms |
| max | 0.21ms |
| total | 2.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.08ms | -0.01ms | -16.11% |
| p50 | 0.07ms | 0.10ms | -0.03ms | -29.58% |
| p95 | 0.09ms | 0.31ms | -0.23ms | -72.55% |
| p99 | 0.17ms | 0.49ms | -0.31ms | -64.39% |
| mean | 0.08ms | 0.14ms | -0.07ms | -47.33% |
| min | 0.06ms | 0.07ms | -0.0097ms | -13.28% |
| max | 0.21ms | 0.54ms | -0.33ms | -61.32% |
| total | 2.25ms | 4.28ms | -2.02ms | -47.33% |

### threshold_varying_workload (10 different threshold)

# Perf Report — threshold_varying_workload (10 different threshold).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.05ms |
| stdev | 0.0030ms |
| min | 0.04ms |
| max | 0.06ms |
| total | 1.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.05ms | -0.0078ms | -15.12% |
| p50 | 0.04ms | 0.06ms | -0.01ms | -21.10% |
| p95 | 0.05ms | 0.16ms | -0.11ms | -66.94% |
| p99 | 0.06ms | 0.28ms | -0.22ms | -80.12% |
| mean | 0.05ms | 0.08ms | -0.04ms | -43.72% |
| min | 0.04ms | 0.05ms | -0.0076ms | -14.95% |
| max | 0.06ms | 0.33ms | -0.27ms | -82.95% |
| total | 1.37ms | 2.43ms | -1.06ms | -43.72% |

