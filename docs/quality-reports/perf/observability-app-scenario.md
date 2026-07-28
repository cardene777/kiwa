# Perf Suite — observability-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.07ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +747%) 以上の悪化が必要) |
| large_history_detect (200 test × 5 run) | 0.08ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +415%) 以上の悪化が必要) |
| threshold_varying_workload (10 different threshold) | 0.06ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +995%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.18ms | 200ms | PASS |
| large_history_detect (200 test × 5 run) | 0.39ms | 200ms | PASS |
| threshold_varying_workload (10 different threshold) | 0.28ms | 200ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | -7096 B | 0 B | 102400 B | yes | PASS |
| large_history_detect (200 test × 5 run) | -15664 B | 0 B | 102400 B | yes | PASS |
| threshold_varying_workload (10 different threshold) | -656 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### flaky_detect_burst (50 test × 10 run history detect)

# Perf Report — flaky_detect_burst (50 test × 10 run history detect).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.04ms |
| p95 | 0.07ms |
| p99 | 0.08ms |
| mean | 0.05ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.08ms |
| total | 1.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | +0.00ms | +1.91% |
| p95 | 0.07ms | 0.07ms | +0.00ms | +3.68% |
| p99 | 0.08ms | 0.10ms | -0.02ms | -21.76% |
| mean | 0.05ms | 0.05ms | +0.00ms | +1.53% |
| min | 0.03ms | 0.03ms | +0.00ms | +2.71% |
| max | 0.08ms | 0.11ms | -0.03ms | -27.64% |
| total | 1.43ms | 1.41ms | +0.02ms | +1.53% |

### large_history_detect (200 test × 5 run)

# Perf Report — large_history_detect (200 test × 5 run).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.07ms |
| p95 | 0.08ms |
| p99 | 0.16ms |
| mean | 0.07ms |
| stdev | 0.02ms |
| min | 0.06ms |
| max | 0.19ms |
| total | 2.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.07ms | 0.08ms | -0.01ms | -14.78% |
| p95 | 0.08ms | 0.12ms | -0.04ms | -30.07% |
| p99 | 0.16ms | 0.27ms | -0.11ms | -41.21% |
| mean | 0.07ms | 0.09ms | -0.02ms | -17.73% |
| min | 0.06ms | 0.06ms | -0.00ms | -2.83% |
| max | 0.19ms | 0.32ms | -0.13ms | -41.59% |
| total | 2.15ms | 2.61ms | -0.46ms | -17.73% |

### threshold_varying_workload (10 different threshold)

# Perf Report — threshold_varying_workload (10 different threshold).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.04ms |
| p95 | 0.06ms |
| p99 | 0.07ms |
| mean | 0.05ms |
| stdev | 0.01ms |
| min | 0.04ms |
| max | 0.07ms |
| total | 1.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | -0.00ms | -0.19% |
| p95 | 0.06ms | 0.05ms | +0.01ms | +17.46% |
| p99 | 0.07ms | 0.06ms | +0.01ms | +23.29% |
| mean | 0.05ms | 0.05ms | +0.00ms | +4.46% |
| min | 0.04ms | 0.04ms | -0.00ms | -0.29% |
| max | 0.07ms | 0.06ms | +0.01ms | +23.64% |
| total | 1.43ms | 1.37ms | +0.06ms | +4.46% |

