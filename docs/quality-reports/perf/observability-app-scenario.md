# Perf Suite — observability-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.09ms | 100ms | PASS | stable |
| large_history_detect (200 test × 5 run) | 0.08ms | 100ms | PASS | stable |
| threshold_varying_workload (10 different threshold) | 0.06ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.16ms | 200ms | PASS |
| large_history_detect (200 test × 5 run) | 0.30ms | 200ms | PASS |
| threshold_varying_workload (10 different threshold) | 0.28ms | 200ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | -7224 B | 0 B | 102400 B | yes | PASS |
| large_history_detect (200 test × 5 run) | -15608 B | 0 B | 102400 B | yes | PASS |
| threshold_varying_workload (10 different threshold) | 984 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### flaky_detect_burst (50 test × 10 run history detect)

# Perf Report — flaky_detect_burst (50 test × 10 run history detect).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.05ms |
| p95 | 0.09ms |
| p99 | 0.11ms |
| mean | 0.05ms |
| stdev | 0.02ms |
| min | 0.04ms |
| max | 0.11ms |
| total | 1.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.04ms | +0.01ms | +20.33% |
| p95 | 0.09ms | 0.07ms | +0.02ms | +24.99% |
| p99 | 0.11ms | 0.09ms | +0.01ms | +11.29% |
| mean | 0.05ms | 0.05ms | +0.01ms | +11.52% |
| min | 0.04ms | 0.03ms | +0.00ms | +3.66% |
| max | 0.11ms | 0.10ms | +0.01ms | +5.12% |
| total | 1.54ms | 1.38ms | +0.16ms | +11.52% |

### large_history_detect (200 test × 5 run)

# Perf Report — large_history_detect (200 test × 5 run).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.07ms |
| p95 | 0.08ms |
| p99 | 0.14ms |
| mean | 0.07ms |
| stdev | 0.02ms |
| min | 0.07ms |
| max | 0.16ms |
| total | 2.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.07ms | 0.08ms | -0.01ms | -11.22% |
| p95 | 0.08ms | 0.12ms | -0.05ms | -37.04% |
| p99 | 0.14ms | 0.25ms | -0.11ms | -45.01% |
| mean | 0.07ms | 0.09ms | -0.01ms | -16.46% |
| min | 0.07ms | 0.07ms | +0.00ms | +1.09% |
| max | 0.16ms | 0.30ms | -0.14ms | -46.08% |
| total | 2.14ms | 2.56ms | -0.42ms | -16.46% |

### threshold_varying_workload (10 different threshold)

# Perf Report — threshold_varying_workload (10 different threshold).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.05ms |
| p95 | 0.06ms |
| p99 | 0.06ms |
| mean | 0.05ms |
| stdev | 0.00ms |
| min | 0.05ms |
| max | 0.06ms |
| total | 1.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.05ms | +0.00ms | +8.81% |
| p95 | 0.06ms | 0.06ms | +0.00ms | +1.40% |
| p99 | 0.06ms | 0.06ms | -0.00ms | -2.19% |
| mean | 0.05ms | 0.05ms | +0.00ms | +4.81% |
| min | 0.05ms | 0.05ms | +0.00ms | +4.25% |
| max | 0.06ms | 0.07ms | -0.00ms | -4.80% |
| total | 1.52ms | 1.45ms | +0.07ms | +4.81% |

