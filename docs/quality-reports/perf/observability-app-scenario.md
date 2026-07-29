# Perf Suite — observability-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00020ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00041ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.04ms | 0.07ms | 100ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_history_detect (200 test × 5 run) | 0.06ms | 0.09ms | 100ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| threshold_varying_workload (10 different threshold) | 0.04ms | 0.05ms | 100ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.16ms | 200ms | PASS |
| large_history_detect (200 test × 5 run) | 0.35ms | 200ms | PASS |
| threshold_varying_workload (10 different threshold) | 0.25ms | 200ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | -7712 B | 0 B | 102400 B | yes | PASS |
| large_history_detect (200 test × 5 run) | 6032 B | 0 B | 102400 B | yes | PASS |
| threshold_varying_workload (10 different threshold) | 768 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### flaky_detect_burst (50 test × 10 run history detect)

# Perf Report — flaky_detect_burst (50 test × 10 run history detect).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.07ms |
| p99 | 0.08ms |
| mean | 0.05ms |
| stdev | 0.01ms |
| min | 0.04ms |
| max | 0.08ms |
| total | 1.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.0061ms | -14.81% |
| p50 | 0.04ms | 0.06ms | -0.03ms | -40.43% |
| p95 | 0.07ms | 0.11ms | -0.05ms | -40.99% |
| p99 | 0.08ms | 0.17ms | -0.09ms | -53.28% |
| mean | 0.05ms | 0.07ms | -0.02ms | -31.65% |
| min | 0.04ms | 0.04ms | -0.0052ms | -12.85% |
| max | 0.08ms | 0.18ms | -0.10ms | -55.64% |
| total | 1.38ms | 2.02ms | -0.64ms | -31.65% |

### large_history_detect (200 test × 5 run)

# Perf Report — large_history_detect (200 test × 5 run).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.06ms |
| p50 | 0.06ms |
| p95 | 0.09ms |
| p99 | 0.15ms |
| mean | 0.07ms |
| stdev | 0.02ms |
| min | 0.06ms |
| max | 0.18ms |
| total | 2.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.06ms | 0.08ms | -0.01ms | -17.65% |
| p50 | 0.06ms | 0.10ms | -0.03ms | -32.35% |
| p95 | 0.09ms | 0.31ms | -0.23ms | -72.83% |
| p99 | 0.15ms | 0.49ms | -0.33ms | -68.39% |
| mean | 0.07ms | 0.14ms | -0.07ms | -50.05% |
| min | 0.06ms | 0.07ms | -0.01ms | -15.27% |
| max | 0.18ms | 0.54ms | -0.36ms | -66.27% |
| total | 2.14ms | 4.28ms | -2.14ms | -50.05% |

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
| stdev | 0.0032ms |
| min | 0.04ms |
| max | 0.06ms |
| total | 1.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.05ms | -0.0076ms | -14.66% |
| p50 | 0.05ms | 0.06ms | -0.010ms | -17.63% |
| p95 | 0.05ms | 0.16ms | -0.11ms | -68.02% |
| p99 | 0.06ms | 0.28ms | -0.22ms | -79.53% |
| mean | 0.05ms | 0.08ms | -0.03ms | -41.76% |
| min | 0.04ms | 0.05ms | -0.0080ms | -15.69% |
| max | 0.06ms | 0.33ms | -0.27ms | -81.87% |
| total | 1.42ms | 2.43ms | -1.01ms | -41.76% |

