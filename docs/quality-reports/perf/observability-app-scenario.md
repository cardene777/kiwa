# Perf Suite — observability-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.13ms | 100ms | PASS | regressed |
| large_history_detect (200 test × 5 run) | 0.10ms | 100ms | PASS | stable |
| threshold_varying_workload (10 different threshold) | 0.10ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.18ms | 200ms | PASS |
| large_history_detect (200 test × 5 run) | 0.44ms | 200ms | PASS |
| threshold_varying_workload (10 different threshold) | 0.19ms | 200ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | -3131536 B | 0 B | 102400 B | PASS |
| large_history_detect (200 test × 5 run) | -1080336 B | 0 B | 102400 B | PASS |
| threshold_varying_workload (10 different threshold) | -4469048 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### flaky_detect_burst (50 test × 10 run history detect)

# Perf Report — flaky_detect_burst (50 test × 10 run history detect).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.05ms |
| p95 | 0.13ms |
| p99 | 0.21ms |
| mean | 0.07ms |
| stdev | 0.04ms |
| min | 0.03ms |
| max | 0.24ms |
| total | 1.96ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.04ms | +0.02ms | +49.36% |
| p95 | 0.13ms | 0.06ms | +0.07ms | +113.26% |
| p99 | 0.21ms | 0.07ms | +0.15ms | +219.29% |
| mean | 0.07ms | 0.04ms | +0.02ms | +51.42% |
| min | 0.03ms | 0.03ms | +0.00ms | +6.63% |
| max | 0.24ms | 0.07ms | +0.17ms | +254.44% |
| total | 1.96ms | 1.30ms | +0.67ms | +51.42% |

### large_history_detect (200 test × 5 run)

# Perf Report — large_history_detect (200 test × 5 run).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.07ms |
| p95 | 0.10ms |
| p99 | 0.14ms |
| mean | 0.07ms |
| stdev | 0.02ms |
| min | 0.06ms |
| max | 0.15ms |
| total | 2.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.07ms | 0.06ms | +0.00ms | +0.90% |
| p95 | 0.10ms | 0.07ms | +0.03ms | +42.81% |
| p99 | 0.14ms | 0.14ms | +0.00ms | +1.33% |
| mean | 0.07ms | 0.07ms | +0.00ms | +4.53% |
| min | 0.06ms | 0.06ms | +0.00ms | +0.66% |
| max | 0.15ms | 0.16ms | -0.02ms | -9.66% |
| total | 2.14ms | 2.05ms | +0.09ms | +4.53% |

### threshold_varying_workload (10 different threshold)

# Perf Report — threshold_varying_workload (10 different threshold).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.05ms |
| p95 | 0.10ms |
| p99 | 0.15ms |
| mean | 0.06ms |
| stdev | 0.03ms |
| min | 0.04ms |
| max | 0.17ms |
| total | 1.75ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.04ms | +0.00ms | +4.40% |
| p95 | 0.10ms | 0.06ms | +0.04ms | +69.15% |
| p99 | 0.15ms | 0.09ms | +0.07ms | +74.09% |
| mean | 0.06ms | 0.05ms | +0.01ms | +24.42% |
| min | 0.04ms | 0.04ms | +0.00ms | +2.31% |
| max | 0.17ms | 0.10ms | +0.07ms | +71.91% |
| total | 1.75ms | 1.41ms | +0.34ms | +24.42% |

