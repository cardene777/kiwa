# Perf Suite — fresh-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 0.16ms | 100ms | PASS | stable |
| island_mount_batch (5 mountIsland with different props) | 0.02ms | 100ms | PASS | stable |
| handler_error_handling (5 throw + catch) | 0.05ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 0.68ms | 200ms | PASS |
| island_mount_batch (5 mountIsland with different props) | 0.05ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.20ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 3896 B | 0 B | 102400 B | yes | PASS |
| island_mount_batch (5 mountIsland with different props) | 23608 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 1360 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### handler_workflow (10 invokeFreshHandler GET+POST mix)

# Perf Report — handler_workflow (10 invokeFreshHandler GET+POST mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.15ms |
| p95 | 0.16ms |
| p99 | 0.17ms |
| mean | 0.14ms |
| stdev | 0.01ms |
| min | 0.12ms |
| max | 0.17ms |
| total | 2.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.15ms | 0.19ms | -0.04ms | -21.91% |
| p95 | 0.16ms | 0.28ms | -0.12ms | -43.03% |
| p99 | 0.17ms | 0.30ms | -0.14ms | -45.44% |
| mean | 0.14ms | 0.19ms | -0.05ms | -25.40% |
| min | 0.12ms | 0.14ms | -0.02ms | -15.23% |
| max | 0.17ms | 0.31ms | -0.14ms | -45.99% |
| total | 2.86ms | 3.84ms | -0.98ms | -25.40% |

### island_mount_batch (5 mountIsland with different props)

# Perf Report — island_mount_batch (5 mountIsland with different props).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -7.11% |
| p95 | 0.02ms | 0.03ms | -0.01ms | -45.57% |
| p99 | 0.02ms | 0.08ms | -0.06ms | -75.46% |
| mean | 0.01ms | 0.02ms | -0.01ms | -32.51% |
| min | 0.01ms | 0.01ms | -0.00ms | -12.95% |
| max | 0.02ms | 0.10ms | -0.07ms | -77.76% |
| total | 0.23ms | 0.35ms | -0.11ms | -32.51% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.05ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.05ms |
| stdev | 0.00ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.93ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.06ms | -0.01ms | -21.16% |
| p95 | 0.05ms | 0.07ms | -0.02ms | -24.16% |
| p99 | 0.05ms | 0.07ms | -0.01ms | -21.15% |
| mean | 0.05ms | 0.06ms | -0.01ms | -21.35% |
| min | 0.04ms | 0.06ms | -0.01ms | -19.79% |
| max | 0.05ms | 0.07ms | -0.01ms | -20.40% |
| total | 0.93ms | 1.18ms | -0.25ms | -21.35% |

