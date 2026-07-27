# Perf Suite — fresh-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 0.18ms | 100ms | PASS | stable |
| island_mount_batch (5 mountIsland with different props) | 0.02ms | 100ms | PASS | stable |
| handler_error_handling (5 throw + catch) | 0.06ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 0.64ms | 200ms | PASS |
| island_mount_batch (5 mountIsland with different props) | 0.10ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.20ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 5552 B | 0 B | 102400 B | yes | PASS |
| island_mount_batch (5 mountIsland with different props) | 38224 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 560 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### handler_workflow (10 invokeFreshHandler GET+POST mix)

# Perf Report — handler_workflow (10 invokeFreshHandler GET+POST mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.15ms |
| p95 | 0.18ms |
| p99 | 0.28ms |
| mean | 0.16ms |
| stdev | 0.04ms |
| min | 0.13ms |
| max | 0.31ms |
| total | 3.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.15ms | 0.19ms | -0.04ms | -20.49% |
| p95 | 0.18ms | 0.28ms | -0.11ms | -37.53% |
| p99 | 0.28ms | 0.30ms | -0.02ms | -7.62% |
| mean | 0.16ms | 0.19ms | -0.04ms | -18.89% |
| min | 0.13ms | 0.14ms | -0.01ms | -9.40% |
| max | 0.31ms | 0.31ms | -0.00ms | -0.78% |
| total | 3.11ms | 3.84ms | -0.73ms | -18.89% |

### island_mount_batch (5 mountIsland with different props)

# Perf Report — island_mount_batch (5 mountIsland with different props).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.01ms | +69.81% |
| p95 | 0.02ms | 0.03ms | -0.01ms | -22.77% |
| p99 | 0.02ms | 0.08ms | -0.06ms | -70.09% |
| mean | 0.02ms | 0.02ms | +0.00ms | +10.44% |
| min | 0.02ms | 0.01ms | +0.01ms | +62.37% |
| max | 0.03ms | 0.10ms | -0.07ms | -73.74% |
| total | 0.38ms | 0.35ms | +0.04ms | +10.44% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.05ms |
| p95 | 0.06ms |
| p99 | 0.06ms |
| mean | 0.05ms |
| stdev | 0.00ms |
| min | 0.05ms |
| max | 0.06ms |
| total | 0.98ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.06ms | -0.01ms | -18.52% |
| p95 | 0.06ms | 0.07ms | -0.01ms | -17.66% |
| p99 | 0.06ms | 0.07ms | -0.01ms | -16.75% |
| mean | 0.05ms | 0.06ms | -0.01ms | -17.21% |
| min | 0.05ms | 0.06ms | -0.01ms | -17.47% |
| max | 0.06ms | 0.07ms | -0.01ms | -16.53% |
| total | 0.98ms | 1.18ms | -0.20ms | -17.21% |

