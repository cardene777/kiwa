# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 2.24ms | 200ms | PASS | stable |
| snapshot_batch (3 snapshot mode consecutive) | 0.93ms | 200ms | PASS | stable |
| mount_error_handling (3 throw + catch during render) | 1.92ms | 200ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 2.62ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 1.68ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 4.27ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -156648 B | 0 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | -59384 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4475432 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.85ms |
| p95 | 2.24ms |
| p99 | 2.69ms |
| mean | 1.03ms |
| stdev | 0.54ms |
| min | 0.61ms |
| max | 2.81ms |
| total | 20.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.85ms | 0.77ms | +0.08ms | +10.12% |
| p95 | 2.24ms | 1.48ms | +0.76ms | +51.37% |
| p99 | 2.69ms | 2.98ms | -0.29ms | -9.59% |
| mean | 1.03ms | 0.95ms | +0.08ms | +8.73% |
| min | 0.61ms | 0.64ms | -0.03ms | -4.92% |
| max | 2.81ms | 3.36ms | -0.55ms | -16.33% |
| total | 20.59ms | 18.93ms | +1.65ms | +8.73% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.42ms |
| p95 | 0.93ms |
| p99 | 1.09ms |
| mean | 0.49ms |
| stdev | 0.20ms |
| min | 0.37ms |
| max | 1.13ms |
| total | 9.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.42ms | 0.44ms | -0.02ms | -4.17% |
| p95 | 0.93ms | 0.48ms | +0.46ms | +95.83% |
| p99 | 1.09ms | 0.51ms | +0.58ms | +114.34% |
| mean | 0.49ms | 0.44ms | +0.05ms | +11.29% |
| min | 0.37ms | 0.39ms | -0.03ms | -6.68% |
| max | 1.13ms | 0.52ms | +0.61ms | +118.60% |
| total | 9.81ms | 8.82ms | +1.00ms | +11.29% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.91ms |
| p95 | 1.92ms |
| p99 | 2.77ms |
| mean | 1.07ms |
| stdev | 0.51ms |
| min | 0.77ms |
| max | 2.98ms |
| total | 21.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.91ms | 0.89ms | +0.02ms | +2.16% |
| p95 | 1.92ms | 1.70ms | +0.22ms | +13.10% |
| p99 | 2.77ms | 4.13ms | -1.36ms | -32.96% |
| mean | 1.07ms | 1.16ms | -0.10ms | -8.22% |
| min | 0.77ms | 0.77ms | +0.00ms | +0.29% |
| max | 2.98ms | 4.73ms | -1.76ms | -37.09% |
| total | 21.32ms | 23.23ms | -1.91ms | -8.22% |

