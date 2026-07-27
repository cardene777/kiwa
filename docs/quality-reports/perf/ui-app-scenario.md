# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 1.06ms | 200ms | PASS | stable |
| snapshot_batch (3 snapshot mode consecutive) | 0.53ms | 200ms | PASS | stable |
| mount_error_handling (3 throw + catch during render) | 1.23ms | 200ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 2.63ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 3.29ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 4.17ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -104568 B | 0 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 1048 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4475080 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.73ms |
| p95 | 1.06ms |
| p99 | 1.41ms |
| mean | 0.80ms |
| stdev | 0.19ms |
| min | 0.66ms |
| max | 1.49ms |
| total | 15.94ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.73ms | 0.77ms | -0.05ms | -6.04% |
| p95 | 1.06ms | 1.48ms | -0.42ms | -28.20% |
| p99 | 1.41ms | 2.98ms | -1.57ms | -52.76% |
| mean | 0.80ms | 0.95ms | -0.15ms | -15.83% |
| min | 0.66ms | 0.64ms | +0.02ms | +3.01% |
| max | 1.49ms | 3.36ms | -1.86ms | -55.47% |
| total | 15.94ms | 18.93ms | -3.00ms | -15.83% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.41ms |
| p95 | 0.53ms |
| p99 | 0.63ms |
| mean | 0.43ms |
| stdev | 0.06ms |
| min | 0.35ms |
| max | 0.65ms |
| total | 8.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.41ms | 0.44ms | -0.03ms | -6.96% |
| p95 | 0.53ms | 0.48ms | +0.05ms | +10.66% |
| p99 | 0.63ms | 0.51ms | +0.12ms | +22.99% |
| mean | 0.43ms | 0.44ms | -0.01ms | -2.89% |
| min | 0.35ms | 0.39ms | -0.04ms | -10.06% |
| max | 0.65ms | 0.52ms | +0.13ms | +25.83% |
| total | 8.56ms | 8.82ms | -0.25ms | -2.89% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.84ms |
| p95 | 1.23ms |
| p99 | 2.01ms |
| mean | 0.95ms |
| stdev | 0.32ms |
| min | 0.77ms |
| max | 2.20ms |
| total | 18.98ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.84ms | 0.89ms | -0.05ms | -5.79% |
| p95 | 1.23ms | 1.70ms | -0.46ms | -27.37% |
| p99 | 2.01ms | 4.13ms | -2.12ms | -51.29% |
| mean | 0.95ms | 1.16ms | -0.21ms | -18.27% |
| min | 0.77ms | 0.77ms | -0.01ms | -0.66% |
| max | 2.20ms | 4.73ms | -2.53ms | -53.43% |
| total | 18.98ms | 23.23ms | -4.24ms | -18.27% |

