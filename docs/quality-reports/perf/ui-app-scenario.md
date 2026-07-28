# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 3.75ms | 200ms | PASS | stable |
| snapshot_batch (3 snapshot mode consecutive) | 0.54ms | 200ms | PASS | stable |
| mount_error_handling (3 throw + catch during render) | 3.44ms | 200ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 5.38ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 3.62ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 6.07ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -100560 B | 0 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | -1616 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4471128 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 1.16ms |
| p95 | 3.75ms |
| p99 | 4.69ms |
| mean | 1.75ms |
| stdev | 1.14ms |
| min | 0.67ms |
| max | 4.92ms |
| total | 34.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 1.16ms | 0.77ms | +0.39ms | +50.12% |
| p95 | 3.75ms | 1.48ms | +2.27ms | +152.80% |
| p99 | 4.69ms | 2.98ms | +1.71ms | +57.30% |
| mean | 1.75ms | 0.95ms | +0.80ms | +84.35% |
| min | 0.67ms | 0.64ms | +0.03ms | +4.21% |
| max | 4.92ms | 3.36ms | +1.57ms | +46.74% |
| total | 34.90ms | 18.93ms | +15.97ms | +84.35% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.45ms |
| p95 | 0.54ms |
| p99 | 0.59ms |
| mean | 0.46ms |
| stdev | 0.05ms |
| min | 0.40ms |
| max | 0.61ms |
| total | 9.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.45ms | 0.44ms | +0.02ms | +3.72% |
| p95 | 0.54ms | 0.48ms | +0.06ms | +12.70% |
| p99 | 0.59ms | 0.51ms | +0.09ms | +16.75% |
| mean | 0.46ms | 0.44ms | +0.02ms | +3.93% |
| min | 0.40ms | 0.39ms | +0.01ms | +1.56% |
| max | 0.61ms | 0.52ms | +0.09ms | +17.67% |
| total | 9.16ms | 8.82ms | +0.35ms | +3.93% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 1.02ms |
| p95 | 3.44ms |
| p99 | 4.40ms |
| mean | 1.67ms |
| stdev | 1.08ms |
| min | 0.86ms |
| max | 4.64ms |
| total | 33.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 1.02ms | 0.89ms | +0.13ms | +14.50% |
| p95 | 3.44ms | 1.70ms | +1.74ms | +102.58% |
| p99 | 4.40ms | 4.13ms | +0.27ms | +6.63% |
| mean | 1.67ms | 1.16ms | +0.51ms | +43.66% |
| min | 0.86ms | 0.77ms | +0.09ms | +11.49% |
| max | 4.64ms | 4.73ms | -0.09ms | -1.97% |
| total | 33.37ms | 23.23ms | +10.14ms | +43.66% |

