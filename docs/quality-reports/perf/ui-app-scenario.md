# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 1.48ms | 200ms | PASS | stable — gate 無効 (regressionGate=false) |
| snapshot_batch (3 snapshot mode consecutive) | 0.57ms | 200ms | PASS | stable — gate 無効 (regressionGate=false) |
| mount_error_handling (3 throw + catch during render) | 4.61ms | 200ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 2.70ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 7.06ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 5.09ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -160008 B | -931 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 17832 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4399152 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.85ms |
| p95 | 1.48ms |
| p99 | 2.70ms |
| mean | 0.99ms |
| stdev | 0.50ms |
| min | 0.68ms |
| max | 3.00ms |
| total | 19.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.85ms | 1.02ms | -0.17ms | -16.27% |
| p95 | 1.48ms | 2.43ms | -0.95ms | -38.94% |
| p99 | 2.70ms | 4.04ms | -1.34ms | -33.20% |
| mean | 0.99ms | 1.29ms | -0.30ms | -23.45% |
| min | 0.68ms | 0.72ms | -0.04ms | -5.84% |
| max | 3.00ms | 4.44ms | -1.44ms | -32.42% |
| total | 19.80ms | 25.87ms | -6.07ms | -23.45% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.44ms |
| p95 | 0.57ms |
| p99 | 1.43ms |
| mean | 0.50ms |
| stdev | 0.27ms |
| min | 0.37ms |
| max | 1.64ms |
| total | 10.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.44ms | 0.44ms | -0.01ms | -1.15% |
| p95 | 0.57ms | 1.01ms | -0.44ms | -43.55% |
| p99 | 1.43ms | 1.06ms | +0.37ms | +34.52% |
| mean | 0.50ms | 0.55ms | -0.05ms | -8.49% |
| min | 0.37ms | 0.39ms | -0.01ms | -3.71% |
| max | 1.64ms | 1.07ms | +0.57ms | +52.95% |
| total | 10.04ms | 10.98ms | -0.93ms | -8.49% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.99ms |
| p95 | 4.61ms |
| p99 | 7.20ms |
| mean | 1.68ms |
| stdev | 1.68ms |
| min | 0.88ms |
| max | 7.85ms |
| total | 33.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.99ms | 0.98ms | +0.00ms | +0.48% |
| p95 | 4.61ms | 2.14ms | +2.47ms | +115.47% |
| p99 | 7.20ms | 5.23ms | +1.97ms | +37.67% |
| mean | 1.68ms | 1.31ms | +0.37ms | +28.32% |
| min | 0.88ms | 0.84ms | +0.05ms | +5.38% |
| max | 7.85ms | 6.01ms | +1.85ms | +30.74% |
| total | 33.57ms | 26.16ms | +7.41ms | +28.32% |

