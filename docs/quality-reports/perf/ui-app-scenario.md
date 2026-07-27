# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 1.27ms | 200ms | PASS | stable |
| snapshot_batch (3 snapshot mode consecutive) | 1.08ms | 200ms | PASS | regressed |
| mount_error_handling (3 throw + catch during render) | 1.46ms | 200ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 2.63ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 1.85ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 3.99ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -99648 B | 0 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | -4928 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4471160 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.85ms |
| p95 | 1.27ms |
| p99 | 1.54ms |
| mean | 0.93ms |
| stdev | 0.22ms |
| min | 0.69ms |
| max | 1.61ms |
| total | 18.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.85ms | 0.77ms | +0.07ms | +9.18% |
| p95 | 1.27ms | 1.48ms | -0.21ms | -14.46% |
| p99 | 1.54ms | 2.98ms | -1.44ms | -48.21% |
| mean | 0.93ms | 0.95ms | -0.02ms | -2.27% |
| min | 0.69ms | 0.64ms | +0.05ms | +7.79% |
| max | 1.61ms | 3.36ms | -1.74ms | -51.93% |
| total | 18.50ms | 18.93ms | -0.43ms | -2.27% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.46ms |
| p95 | 1.08ms |
| p99 | 1.16ms |
| mean | 0.54ms |
| stdev | 0.21ms |
| min | 0.42ms |
| max | 1.18ms |
| total | 10.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.46ms | 0.44ms | +0.03ms | +5.90% |
| p95 | 1.08ms | 0.48ms | +0.60ms | +127.08% |
| p99 | 1.16ms | 0.51ms | +0.65ms | +127.90% |
| mean | 0.54ms | 0.44ms | +0.10ms | +22.01% |
| min | 0.42ms | 0.39ms | +0.02ms | +5.96% |
| max | 1.18ms | 0.52ms | +0.66ms | +128.08% |
| total | 10.76ms | 8.82ms | +1.94ms | +22.01% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.88ms |
| p95 | 1.46ms |
| p99 | 2.64ms |
| mean | 1.01ms |
| stdev | 0.47ms |
| min | 0.80ms |
| max | 2.93ms |
| total | 20.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.88ms | 0.89ms | -0.01ms | -0.80% |
| p95 | 1.46ms | 1.70ms | -0.23ms | -13.80% |
| p99 | 2.64ms | 4.13ms | -1.49ms | -36.12% |
| mean | 1.01ms | 1.16ms | -0.15ms | -12.96% |
| min | 0.80ms | 0.77ms | +0.02ms | +3.23% |
| max | 2.93ms | 4.73ms | -1.80ms | -38.12% |
| total | 20.22ms | 23.23ms | -3.01ms | -12.96% |

