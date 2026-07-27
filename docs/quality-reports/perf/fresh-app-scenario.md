# Perf Suite — fresh-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 0.16ms | 100ms | PASS | stable |
| island_mount_batch (5 mountIsland with different props) | 0.02ms | 100ms | PASS | stable |
| handler_error_handling (5 throw + catch) | 0.06ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 0.57ms | 200ms | PASS |
| island_mount_batch (5 mountIsland with different props) | 0.04ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.21ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | -289392 B | 0 B | 102400 B | yes | PASS |
| island_mount_batch (5 mountIsland with different props) | 23160 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 6872 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### handler_workflow (10 invokeFreshHandler GET+POST mix)

# Perf Report — handler_workflow (10 invokeFreshHandler GET+POST mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.15ms |
| p95 | 0.16ms |
| p99 | 0.16ms |
| mean | 0.14ms |
| stdev | 0.01ms |
| min | 0.12ms |
| max | 0.16ms |
| total | 2.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.15ms | 0.19ms | -0.04ms | -21.33% |
| p95 | 0.16ms | 0.28ms | -0.13ms | -44.43% |
| p99 | 0.16ms | 0.30ms | -0.14ms | -47.13% |
| mean | 0.14ms | 0.19ms | -0.05ms | -25.42% |
| min | 0.12ms | 0.14ms | -0.02ms | -13.91% |
| max | 0.16ms | 0.31ms | -0.15ms | -47.75% |
| total | 2.86ms | 3.84ms | -0.98ms | -25.42% |

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
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -15.38% |
| p95 | 0.02ms | 0.03ms | -0.01ms | -42.80% |
| p99 | 0.02ms | 0.08ms | -0.06ms | -77.75% |
| mean | 0.01ms | 0.02ms | -0.01ms | -35.67% |
| min | 0.01ms | 0.01ms | -0.00ms | -15.38% |
| max | 0.02ms | 0.10ms | -0.08ms | -80.44% |
| total | 0.22ms | 0.35ms | -0.12ms | -35.67% |

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
| total | 0.95ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.06ms | -0.01ms | -19.61% |
| p95 | 0.06ms | 0.07ms | -0.01ms | -17.95% |
| p99 | 0.06ms | 0.07ms | -0.01ms | -15.94% |
| mean | 0.05ms | 0.06ms | -0.01ms | -19.58% |
| min | 0.05ms | 0.06ms | -0.01ms | -18.52% |
| max | 0.06ms | 0.07ms | -0.01ms | -15.44% |
| total | 0.95ms | 1.18ms | -0.23ms | -19.58% |

