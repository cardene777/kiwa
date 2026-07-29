# Perf Suite — observability-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.03ms | 0.08ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_history_detect (200 test × 5 run) | 0.07ms | 0.08ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| threshold_varying_workload (10 different threshold) | 0.04ms | 0.06ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.17ms | 200ms | PASS |
| large_history_detect (200 test × 5 run) | 0.65ms | 200ms | PASS |
| threshold_varying_workload (10 different threshold) | 0.32ms | 200ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | -6992 B | 0 B | 102400 B | yes | PASS |
| large_history_detect (200 test × 5 run) | 6864 B | 0 B | 102400 B | yes | PASS |
| threshold_varying_workload (10 different threshold) | 768 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.09ms |
| mean | 0.05ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.10ms |
| total | 1.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0064ms | -15.43% |
| p50 | 0.04ms | 0.06ms | -0.02ms | -33.73% |
| p95 | 0.08ms | 0.11ms | -0.04ms | -31.96% |
| p99 | 0.09ms | 0.17ms | -0.07ms | -43.76% |
| mean | 0.05ms | 0.07ms | -0.02ms | -26.78% |
| min | 0.03ms | 0.04ms | -0.0060ms | -15.03% |
| max | 0.10ms | 0.18ms | -0.08ms | -45.84% |
| total | 1.48ms | 2.02ms | -0.54ms | -26.78% |

### large_history_detect (200 test × 5 run)

# Perf Report — large_history_detect (200 test × 5 run).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.07ms |
| p50 | 0.07ms |
| p95 | 0.08ms |
| p99 | 0.25ms |
| mean | 0.08ms |
| stdev | 0.04ms |
| min | 0.06ms |
| max | 0.31ms |
| total | 2.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.07ms | 0.08ms | -0.01ms | -14.22% |
| p50 | 0.07ms | 0.10ms | -0.02ms | -24.15% |
| p95 | 0.08ms | 0.31ms | -0.23ms | -73.89% |
| p99 | 0.25ms | 0.49ms | -0.24ms | -49.37% |
| mean | 0.08ms | 0.14ms | -0.06ms | -44.08% |
| min | 0.06ms | 0.07ms | -0.0093ms | -12.71% |
| max | 0.31ms | 0.54ms | -0.22ms | -41.82% |
| total | 2.39ms | 4.28ms | -1.89ms | -44.08% |

### threshold_varying_workload (10 different threshold)

# Perf Report — threshold_varying_workload (10 different threshold).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.05ms |
| p95 | 0.06ms |
| p99 | 0.07ms |
| mean | 0.05ms |
| stdev | 0.0068ms |
| min | 0.04ms |
| max | 0.07ms |
| total | 1.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.05ms | -0.0078ms | -15.17% |
| p50 | 0.05ms | 0.06ms | -0.0085ms | -15.05% |
| p95 | 0.06ms | 0.16ms | -0.10ms | -60.60% |
| p99 | 0.07ms | 0.28ms | -0.21ms | -75.05% |
| mean | 0.05ms | 0.08ms | -0.03ms | -39.05% |
| min | 0.04ms | 0.05ms | -0.0075ms | -14.71% |
| max | 0.07ms | 0.33ms | -0.25ms | -77.87% |
| total | 1.48ms | 2.43ms | -0.95ms | -39.05% |

