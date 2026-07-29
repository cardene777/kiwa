# Perf Suite — fresh-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 20.31ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +219%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| island_mount_batch (5 mountIsland with different props) | 0.11ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3258%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.06ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +849%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 60.58ms | 200ms | PASS |
| island_mount_batch (5 mountIsland with different props) | 0.06ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.33ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | -69184 B | 2800 B | 102400 B | yes | PASS |
| island_mount_batch (5 mountIsland with different props) | 36784 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | -3632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### handler_workflow (10 invokeFreshHandler GET+POST mix)

# Perf Report — handler_workflow (10 invokeFreshHandler GET+POST mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.17ms |
| p95 | 20.31ms |
| p99 | 42.89ms |
| mean | 3.53ms |
| stdev | 11.38ms |
| min | 0.14ms |
| max | 48.53ms |
| total | 70.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.17ms | 0.15ms | +0.01ms | +6.60% |
| p95 | 20.31ms | 0.23ms | +20.08ms | +8790.84% |
| p99 | 42.89ms | 0.29ms | +42.60ms | +14910.97% |
| mean | 3.53ms | 0.17ms | +3.36ms | +1989.79% |
| min | 0.14ms | 0.13ms | +0.01ms | +4.08% |
| max | 48.53ms | 0.30ms | +48.23ms | +16076.21% |
| total | 70.59ms | 3.38ms | +67.21ms | +1989.79% |

### island_mount_batch (5 mountIsland with different props)

# Perf Report — island_mount_batch (5 mountIsland with different props).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.11ms |
| p99 | 1.29ms |
| mean | 0.09ms |
| stdev | 0.35ms |
| min | 0.01ms |
| max | 1.58ms |
| total | 1.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -13.27% |
| p95 | 0.11ms | 0.02ms | +0.09ms | +614.24% |
| p99 | 1.29ms | 0.02ms | +1.27ms | +6142.21% |
| mean | 0.09ms | 0.01ms | +0.08ms | +537.74% |
| min | 0.01ms | 0.01ms | -0.00ms | -26.53% |
| max | 1.58ms | 0.02ms | +1.56ms | +7108.13% |
| total | 1.85ms | 0.29ms | +1.56ms | +537.74% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.06ms |
| p95 | 0.06ms |
| p99 | 0.06ms |
| mean | 0.06ms |
| stdev | 0.00ms |
| min | 0.05ms |
| max | 0.06ms |
| total | 1.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.06ms | 0.05ms | +0.01ms | +15.72% |
| p95 | 0.06ms | 0.06ms | +0.00ms | +0.11% |
| p99 | 0.06ms | 0.07ms | -0.01ms | -9.96% |
| mean | 0.06ms | 0.05ms | +0.01ms | +10.84% |
| min | 0.05ms | 0.05ms | +0.00ms | +5.91% |
| max | 0.06ms | 0.07ms | -0.01ms | -12.16% |
| total | 1.14ms | 1.03ms | +0.11ms | +10.84% |

