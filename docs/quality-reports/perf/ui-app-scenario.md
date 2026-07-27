# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 1.38ms | 200ms | PASS | stable |
| snapshot_batch (3 snapshot mode consecutive) | 0.80ms | 200ms | PASS | stable |
| mount_error_handling (3 throw + catch during render) | 1.16ms | 200ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 3.87ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 1.85ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 4.60ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -12897104 B | 0 B | 102400 B | PASS |
| snapshot_batch (3 snapshot mode consecutive) | -19936280 B | 0 B | 102400 B | PASS |
| mount_error_handling (3 throw + catch during render) | 1458728 B | 737280 B | 102400 B | FAIL |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.82ms |
| p95 | 1.38ms |
| p99 | 3.30ms |
| mean | 0.99ms |
| stdev | 0.67ms |
| min | 0.70ms |
| max | 3.78ms |
| total | 19.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.82ms | 0.79ms | +0.03ms | +4.15% |
| p95 | 1.38ms | 1.18ms | +0.21ms | +17.60% |
| p99 | 3.30ms | 1.90ms | +1.41ms | +74.29% |
| mean | 0.99ms | 0.90ms | +0.09ms | +10.30% |
| min | 0.70ms | 0.60ms | +0.10ms | +16.01% |
| max | 3.78ms | 2.08ms | +1.71ms | +82.33% |
| total | 19.80ms | 17.95ms | +1.85ms | +10.30% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.36ms |
| p95 | 0.80ms |
| p99 | 0.99ms |
| mean | 0.41ms |
| stdev | 0.18ms |
| min | 0.28ms |
| max | 1.03ms |
| total | 8.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.36ms | 0.31ms | +0.05ms | +16.08% |
| p95 | 0.80ms | 0.52ms | +0.29ms | +55.78% |
| p99 | 0.99ms | 0.57ms | +0.41ms | +72.54% |
| mean | 0.41ms | 0.33ms | +0.08ms | +22.65% |
| min | 0.28ms | 0.27ms | +0.01ms | +3.23% |
| max | 1.03ms | 0.59ms | +0.45ms | +76.23% |
| total | 8.14ms | 6.64ms | +1.50ms | +22.65% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.91ms |
| p95 | 1.16ms |
| p99 | 2.60ms |
| mean | 1.01ms |
| stdev | 0.46ms |
| min | 0.80ms |
| max | 2.96ms |
| total | 20.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.91ms | 0.86ms | +0.05ms | +5.98% |
| p95 | 1.16ms | 2.17ms | -1.01ms | -46.59% |
| p99 | 2.60ms | 4.96ms | -2.36ms | -47.56% |
| mean | 1.01ms | 1.19ms | -0.18ms | -15.17% |
| min | 0.80ms | 0.77ms | +0.03ms | +3.91% |
| max | 2.96ms | 5.65ms | -2.69ms | -47.65% |
| total | 20.13ms | 23.73ms | -3.60ms | -15.17% |

