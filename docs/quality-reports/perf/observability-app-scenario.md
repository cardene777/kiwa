# Perf Suite — observability-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.07ms | 100ms | PASS | stable |
| large_history_detect (200 test × 5 run) | 0.08ms | 100ms | PASS | stable |
| threshold_varying_workload (10 different threshold) | 0.05ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.18ms | 200ms | PASS |
| large_history_detect (200 test × 5 run) | 0.42ms | 200ms | PASS |
| threshold_varying_workload (10 different threshold) | 0.27ms | 200ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | -7144 B | 0 B | 102400 B | yes | PASS |
| large_history_detect (200 test × 5 run) | -15208 B | 0 B | 102400 B | yes | PASS |
| threshold_varying_workload (10 different threshold) | 984 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.09ms |
| total | 1.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | +0.00ms | +0.72% |
| p95 | 0.07ms | 0.07ms | +0.00ms | +0.57% |
| p99 | 0.08ms | 0.09ms | -0.01ms | -11.06% |
| mean | 0.05ms | 0.05ms | +0.00ms | +3.97% |
| min | 0.03ms | 0.03ms | +0.00ms | +1.71% |
| max | 0.09ms | 0.10ms | -0.01ms | -13.65% |
| total | 1.44ms | 1.38ms | +0.05ms | +3.97% |

### large_history_detect (200 test × 5 run)

# Perf Report — large_history_detect (200 test × 5 run).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.06ms |
| p95 | 0.08ms |
| p99 | 0.18ms |
| mean | 0.07ms |
| stdev | 0.03ms |
| min | 0.06ms |
| max | 0.22ms |
| total | 2.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.06ms | 0.08ms | -0.01ms | -13.96% |
| p95 | 0.08ms | 0.12ms | -0.05ms | -37.81% |
| p99 | 0.18ms | 0.25ms | -0.07ms | -29.02% |
| mean | 0.07ms | 0.09ms | -0.01ms | -15.44% |
| min | 0.06ms | 0.07ms | -0.00ms | -2.43% |
| max | 0.22ms | 0.30ms | -0.08ms | -27.09% |
| total | 2.16ms | 2.56ms | -0.39ms | -15.44% |

### threshold_varying_workload (10 different threshold)

# Perf Report — threshold_varying_workload (10 different threshold).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.00ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 1.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.05ms | -0.00ms | -5.10% |
| p95 | 0.05ms | 0.06ms | -0.01ms | -16.93% |
| p99 | 0.05ms | 0.06ms | -0.01ms | -20.37% |
| mean | 0.04ms | 0.05ms | -0.00ms | -8.73% |
| min | 0.04ms | 0.05ms | -0.00ms | -4.81% |
| max | 0.05ms | 0.07ms | -0.01ms | -21.25% |
| total | 1.33ms | 1.45ms | -0.13ms | -8.73% |

