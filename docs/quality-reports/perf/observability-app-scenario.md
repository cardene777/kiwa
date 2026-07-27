# Perf Suite — observability-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.08ms | 100ms | PASS | stable |
| large_history_detect (200 test × 5 run) | 0.13ms | 100ms | PASS | stable |
| threshold_varying_workload (10 different threshold) | 0.05ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.20ms | 200ms | PASS |
| large_history_detect (200 test × 5 run) | 0.41ms | 200ms | PASS |
| threshold_varying_workload (10 different threshold) | 0.29ms | 200ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | -7136 B | 0 B | 102400 B | yes | PASS |
| large_history_detect (200 test × 5 run) | -15760 B | 0 B | 102400 B | yes | PASS |
| threshold_varying_workload (10 different threshold) | 984 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### flaky_detect_burst (50 test × 10 run history detect)

# Perf Report — flaky_detect_burst (50 test × 10 run history detect).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.04ms |
| p95 | 0.08ms |
| p99 | 0.10ms |
| mean | 0.05ms |
| stdev | 0.02ms |
| min | 0.04ms |
| max | 0.11ms |
| total | 1.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | +0.01ms | +16.75% |
| p95 | 0.08ms | 0.07ms | +0.01ms | +12.12% |
| p99 | 0.10ms | 0.09ms | +0.01ms | +9.07% |
| mean | 0.05ms | 0.05ms | +0.01ms | +18.94% |
| min | 0.04ms | 0.03ms | +0.00ms | +13.55% |
| max | 0.11ms | 0.10ms | +0.01ms | +9.35% |
| total | 1.65ms | 1.38ms | +0.26ms | +18.94% |

### large_history_detect (200 test × 5 run)

# Perf Report — large_history_detect (200 test × 5 run).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.07ms |
| p95 | 0.13ms |
| p99 | 0.16ms |
| mean | 0.08ms |
| stdev | 0.02ms |
| min | 0.06ms |
| max | 0.17ms |
| total | 2.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.07ms | 0.08ms | -0.01ms | -11.58% |
| p95 | 0.13ms | 0.12ms | +0.01ms | +4.41% |
| p99 | 0.16ms | 0.25ms | -0.08ms | -33.52% |
| mean | 0.08ms | 0.09ms | -0.01ms | -10.81% |
| min | 0.06ms | 0.07ms | -0.00ms | -1.02% |
| max | 0.17ms | 0.30ms | -0.12ms | -41.29% |
| total | 2.28ms | 2.56ms | -0.28ms | -10.81% |

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
| p50 | 0.05ms | 0.05ms | +0.00ms | +1.49% |
| p95 | 0.05ms | 0.06ms | -0.00ms | -4.59% |
| p99 | 0.06ms | 0.06ms | -0.01ms | -10.55% |
| mean | 0.05ms | 0.05ms | -0.00ms | -1.40% |
| min | 0.05ms | 0.05ms | +0.00ms | +1.76% |
| max | 0.06ms | 0.07ms | -0.01ms | -12.35% |
| total | 1.43ms | 1.45ms | -0.02ms | -1.40% |

