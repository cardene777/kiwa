# Perf Suite — fresh-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 0.17ms | 100ms | PASS | stable (差 0.05ms が下限 0.5ms 未満で判定を保留) |
| island_mount_batch (5 mountIsland with different props) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3258%) 以上の悪化が必要) |
| handler_error_handling (5 throw + catch) | 0.05ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +849%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 0.63ms | 200ms | PASS |
| island_mount_batch (5 mountIsland with different props) | 0.05ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.20ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | -206976 B | 0 B | 102400 B | yes | PASS |
| island_mount_batch (5 mountIsland with different props) | 21232 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | -3400 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### handler_workflow (10 invokeFreshHandler GET+POST mix)

# Perf Report — handler_workflow (10 invokeFreshHandler GET+POST mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.15ms |
| p95 | 0.17ms |
| p99 | 0.18ms |
| mean | 0.15ms |
| stdev | 0.02ms |
| min | 0.12ms |
| max | 0.18ms |
| total | 2.93ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.15ms | 0.15ms | -0.01ms | -3.32% |
| p95 | 0.17ms | 0.23ms | -0.05ms | -23.49% |
| p99 | 0.18ms | 0.29ms | -0.10ms | -36.52% |
| mean | 0.15ms | 0.17ms | -0.02ms | -13.37% |
| min | 0.12ms | 0.13ms | -0.01ms | -9.73% |
| max | 0.18ms | 0.30ms | -0.12ms | -39.00% |
| total | 2.93ms | 3.38ms | -0.45ms | -13.37% |

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
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -33.98% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +18.18% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -11.19% |
| mean | 0.01ms | 0.01ms | -0.00ms | -26.71% |
| min | 0.01ms | 0.01ms | -0.00ms | -33.54% |
| max | 0.02ms | 0.02ms | -0.00ms | -16.32% |
| total | 0.21ms | 0.29ms | -0.08ms | -26.71% |

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
| total | 0.99ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.05ms | +0.00ms | +1.51% |
| p95 | 0.05ms | 0.06ms | -0.01ms | -9.66% |
| p99 | 0.05ms | 0.07ms | -0.01ms | -17.85% |
| mean | 0.05ms | 0.05ms | -0.00ms | -4.03% |
| min | 0.04ms | 0.05ms | -0.00ms | -8.48% |
| max | 0.05ms | 0.07ms | -0.01ms | -19.63% |
| total | 0.99ms | 1.03ms | -0.04ms | -4.03% |

