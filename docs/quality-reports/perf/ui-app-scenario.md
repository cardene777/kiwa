# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 1.38ms | 200ms | PASS | stable |
| snapshot_batch (3 snapshot mode consecutive) | 0.82ms | 200ms | PASS | stable |
| mount_error_handling (3 throw + catch during render) | 1.71ms | 200ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 3.74ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 3.46ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 3.86ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -110832 B | 0 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | -1856 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4393360 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.93ms |
| p95 | 1.38ms |
| p99 | 2.09ms |
| mean | 1.01ms |
| stdev | 0.35ms |
| min | 0.69ms |
| max | 2.26ms |
| total | 20.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.93ms | 1.02ms | -0.09ms | -8.88% |
| p95 | 1.38ms | 2.43ms | -1.06ms | -43.40% |
| p99 | 2.09ms | 4.04ms | -1.95ms | -48.38% |
| mean | 1.01ms | 1.29ms | -0.28ms | -21.83% |
| min | 0.69ms | 0.72ms | -0.03ms | -4.06% |
| max | 2.26ms | 4.44ms | -2.18ms | -49.06% |
| total | 20.22ms | 25.87ms | -5.65ms | -21.83% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.47ms |
| p95 | 0.82ms |
| p99 | 0.87ms |
| mean | 0.51ms |
| stdev | 0.13ms |
| min | 0.38ms |
| max | 0.89ms |
| total | 10.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.47ms | 0.44ms | +0.03ms | +6.65% |
| p95 | 0.82ms | 1.01ms | -0.20ms | -19.27% |
| p99 | 0.87ms | 1.06ms | -0.19ms | -17.79% |
| mean | 0.51ms | 0.55ms | -0.04ms | -7.17% |
| min | 0.38ms | 0.39ms | -0.01ms | -2.61% |
| max | 0.89ms | 1.07ms | -0.19ms | -17.44% |
| total | 10.19ms | 10.98ms | -0.79ms | -7.17% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 1.21ms |
| p95 | 1.71ms |
| p99 | 2.48ms |
| mean | 1.23ms |
| stdev | 0.44ms |
| min | 0.75ms |
| max | 2.67ms |
| total | 24.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 1.21ms | 0.98ms | +0.22ms | +22.76% |
| p95 | 1.71ms | 2.14ms | -0.43ms | -19.97% |
| p99 | 2.48ms | 5.23ms | -2.75ms | -52.61% |
| mean | 1.23ms | 1.31ms | -0.08ms | -5.81% |
| min | 0.75ms | 0.84ms | -0.08ms | -10.07% |
| max | 2.67ms | 6.01ms | -3.33ms | -55.52% |
| total | 24.64ms | 26.16ms | -1.52ms | -5.81% |

