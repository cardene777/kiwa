# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 1.14ms | 200ms | PASS | stable |
| snapshot_batch (3 snapshot mode consecutive) | 0.64ms | 200ms | PASS | stable |
| mount_error_handling (3 throw + catch during render) | 1.67ms | 200ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 2.83ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 1.85ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 3.61ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -100328 B | -934 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | -5512 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4471720 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.78ms |
| p95 | 1.14ms |
| p99 | 1.69ms |
| mean | 0.86ms |
| stdev | 0.27ms |
| min | 0.61ms |
| max | 1.83ms |
| total | 17.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.78ms | 0.77ms | +0.01ms | +0.77% |
| p95 | 1.14ms | 1.48ms | -0.35ms | -23.39% |
| p99 | 1.69ms | 2.98ms | -1.29ms | -43.26% |
| mean | 0.86ms | 0.95ms | -0.09ms | -9.20% |
| min | 0.61ms | 0.64ms | -0.04ms | -5.61% |
| max | 1.83ms | 3.36ms | -1.53ms | -45.45% |
| total | 17.19ms | 18.93ms | -1.74ms | -9.20% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.41ms |
| p95 | 0.64ms |
| p99 | 1.31ms |
| mean | 0.48ms |
| stdev | 0.24ms |
| min | 0.35ms |
| max | 1.48ms |
| total | 9.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.41ms | 0.44ms | -0.03ms | -5.84% |
| p95 | 0.64ms | 0.48ms | +0.17ms | +35.45% |
| p99 | 1.31ms | 0.51ms | +0.81ms | +158.46% |
| mean | 0.48ms | 0.44ms | +0.04ms | +9.93% |
| min | 0.35ms | 0.39ms | -0.04ms | -10.43% |
| max | 1.48ms | 0.52ms | +0.96ms | +186.74% |
| total | 9.69ms | 8.82ms | +0.88ms | +9.93% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.92ms |
| p95 | 1.67ms |
| p99 | 2.51ms |
| mean | 1.06ms |
| stdev | 0.44ms |
| min | 0.77ms |
| max | 2.72ms |
| total | 21.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.92ms | 0.89ms | +0.03ms | +3.40% |
| p95 | 1.67ms | 1.70ms | -0.03ms | -1.66% |
| p99 | 2.51ms | 4.13ms | -1.62ms | -39.23% |
| mean | 1.06ms | 1.16ms | -0.10ms | -8.41% |
| min | 0.77ms | 0.77ms | -0.00ms | -0.64% |
| max | 2.72ms | 4.73ms | -2.02ms | -42.60% |
| total | 21.27ms | 23.23ms | -1.95ms | -8.41% |

