# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 3.11ms | 200ms | PASS | stable |
| snapshot_batch (3 snapshot mode consecutive) | 1.96ms | 200ms | PASS | stable |
| mount_error_handling (3 throw + catch during render) | 1.39ms | 200ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 3.97ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 1.70ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 6.42ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -13090880 B | 0 B | 102400 B | PASS |
| snapshot_batch (3 snapshot mode consecutive) | -19909408 B | 0 B | 102400 B | PASS |
| mount_error_handling (3 throw + catch during render) | 1070128 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.90ms |
| p95 | 3.11ms |
| p99 | 3.24ms |
| mean | 1.24ms |
| stdev | 0.72ms |
| min | 0.74ms |
| max | 3.28ms |
| total | 24.74ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.90ms | 0.79ms | +0.11ms | +14.35% |
| p95 | 3.11ms | 1.18ms | +1.93ms | +164.30% |
| p99 | 3.24ms | 1.90ms | +1.35ms | +71.11% |
| mean | 1.24ms | 0.90ms | +0.34ms | +37.86% |
| min | 0.74ms | 0.60ms | +0.14ms | +23.23% |
| max | 3.28ms | 2.08ms | +1.20ms | +57.89% |
| total | 24.74ms | 17.95ms | +6.79ms | +37.86% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.39ms |
| p95 | 1.96ms |
| p99 | 2.23ms |
| mean | 0.59ms |
| stdev | 0.54ms |
| min | 0.35ms |
| max | 2.30ms |
| total | 11.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.39ms | 0.31ms | +0.08ms | +25.17% |
| p95 | 1.96ms | 0.52ms | +1.44ms | +279.78% |
| p99 | 2.23ms | 0.57ms | +1.66ms | +290.47% |
| mean | 0.59ms | 0.33ms | +0.26ms | +77.96% |
| min | 0.35ms | 0.27ms | +0.08ms | +27.67% |
| max | 2.30ms | 0.59ms | +1.71ms | +292.82% |
| total | 11.82ms | 6.64ms | +5.18ms | +77.96% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.85ms |
| p95 | 1.39ms |
| p99 | 2.57ms |
| mean | 1.00ms |
| stdev | 0.46ms |
| min | 0.78ms |
| max | 2.87ms |
| total | 19.91ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.85ms | 0.86ms | -0.00ms | -0.57% |
| p95 | 1.39ms | 2.17ms | -0.79ms | -36.26% |
| p99 | 2.57ms | 4.96ms | -2.38ms | -48.10% |
| mean | 1.00ms | 1.19ms | -0.19ms | -16.11% |
| min | 0.78ms | 0.77ms | +0.01ms | +0.85% |
| max | 2.87ms | 5.65ms | -2.78ms | -49.24% |
| total | 19.91ms | 23.73ms | -3.82ms | -16.11% |

