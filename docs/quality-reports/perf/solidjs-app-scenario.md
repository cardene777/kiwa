# Perf Suite — solidjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| render_workflow (10 renderSolid) | 0.04ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1415%) 以上の悪化が必要) |
| signal_reactive_batch (5 signal+effect update chains) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +6689%) 以上の悪化が必要) |
| render_error_handling (5 throw + catch in component) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +5098%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| render_workflow (10 renderSolid) | 0.09ms | 200ms | PASS |
| signal_reactive_batch (5 signal+effect update chains) | 0.03ms | 200ms | PASS |
| render_error_handling (5 throw + catch in component) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | 4384 B | 0 B | 102400 B | yes | PASS |
| signal_reactive_batch (5 signal+effect update chains) | 5408 B | 0 B | 102400 B | yes | PASS |
| render_error_handling (5 throw + catch in component) | 11192 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### render_workflow (10 renderSolid)

# Perf Report — render_workflow (10 renderSolid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.04ms |
| p99 | 0.08ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.09ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -9.45% |
| p95 | 0.04ms | 0.04ms | +0.01ms | +22.92% |
| p99 | 0.08ms | 0.05ms | +0.03ms | +70.31% |
| mean | 0.02ms | 0.02ms | +0.00ms | +1.29% |
| min | 0.01ms | 0.01ms | -0.00ms | -5.67% |
| max | 0.09ms | 0.05ms | +0.04ms | +78.51% |
| total | 0.36ms | 0.35ms | +0.00ms | +1.29% |

### signal_reactive_batch (5 signal+effect update chains)

# Perf Report — signal_reactive_batch (5 signal+effect update chains).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -7.15% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +14.21% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +54.35% |
| mean | 0.01ms | 0.01ms | -0.00ms | -7.09% |
| min | 0.00ms | 0.01ms | -0.00ms | -33.77% |
| max | 0.01ms | 0.01ms | +0.01ms | +63.09% |
| total | 0.12ms | 0.13ms | -0.01ms | -7.09% |

### render_error_handling (5 throw + catch in component)

# Perf Report — render_error_handling (5 throw + catch in component).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -4.21% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -1.00% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +72.36% |
| mean | 0.01ms | 0.01ms | +0.00ms | +1.11% |
| min | 0.01ms | 0.01ms | -0.00ms | -5.62% |
| max | 0.02ms | 0.01ms | +0.01ms | +90.12% |
| total | 0.17ms | 0.17ms | +0.00ms | +1.11% |

