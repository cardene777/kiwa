# Perf Suite — observability-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.07ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +747%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| large_history_detect (200 test × 5 run) | 0.14ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +415%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| threshold_varying_workload (10 different threshold) | 0.05ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +995%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.20ms | 200ms | PASS |
| large_history_detect (200 test × 5 run) | 0.40ms | 200ms | PASS |
| threshold_varying_workload (10 different threshold) | 1.44ms | 200ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | -9160 B | 0 B | 102400 B | yes | PASS |
| large_history_detect (200 test × 5 run) | -56 B | 0 B | 102400 B | yes | PASS |
| threshold_varying_workload (10 different threshold) | -13384 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### flaky_detect_burst (50 test × 10 run history detect)

# Perf Report — flaky_detect_burst (50 test × 10 run history detect).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.05ms |
| p95 | 0.07ms |
| p99 | 0.10ms |
| mean | 0.05ms |
| stdev | 0.02ms |
| min | 0.04ms |
| max | 0.11ms |
| total | 1.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.04ms | +0.01ms | +30.46% |
| p95 | 0.07ms | 0.07ms | +0.00ms | +4.71% |
| p99 | 0.10ms | 0.10ms | +0.00ms | +0.15% |
| mean | 0.05ms | 0.05ms | +0.01ms | +14.74% |
| min | 0.04ms | 0.03ms | +0.00ms | +10.48% |
| max | 0.11ms | 0.11ms | -0.00ms | -1.04% |
| total | 1.62ms | 1.41ms | +0.21ms | +14.74% |

### large_history_detect (200 test × 5 run)

# Perf Report — large_history_detect (200 test × 5 run).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.08ms |
| p95 | 0.14ms |
| p99 | 0.47ms |
| mean | 0.10ms |
| stdev | 0.10ms |
| min | 0.07ms |
| max | 0.60ms |
| total | 3.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.08ms | 0.08ms | +0.00ms | +3.09% |
| p95 | 0.14ms | 0.12ms | +0.02ms | +16.73% |
| p99 | 0.47ms | 0.27ms | +0.21ms | +77.81% |
| mean | 0.10ms | 0.09ms | +0.01ms | +15.20% |
| min | 0.07ms | 0.06ms | +0.01ms | +8.42% |
| max | 0.60ms | 0.32ms | +0.29ms | +90.63% |
| total | 3.01ms | 2.61ms | +0.40ms | +15.20% |

### threshold_varying_workload (10 different threshold)

# Perf Report — threshold_varying_workload (10 different threshold).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.05ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.05ms |
| stdev | 0.00ms |
| min | 0.05ms |
| max | 0.06ms |
| total | 1.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.04ms | +0.00ms | +5.49% |
| p95 | 0.05ms | 0.05ms | +0.00ms | +3.18% |
| p99 | 0.06ms | 0.06ms | -0.00ms | -0.89% |
| mean | 0.05ms | 0.05ms | +0.00ms | +4.90% |
| min | 0.05ms | 0.04ms | +0.00ms | +4.93% |
| max | 0.06ms | 0.06ms | -0.00ms | -2.12% |
| total | 1.43ms | 1.37ms | +0.07ms | +4.90% |

