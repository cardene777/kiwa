# Perf Suite — solidjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| render_workflow (10 renderSolid) | 0.03ms | 100ms | PASS | stable |
| signal_reactive_batch (5 signal+effect update chains) | 0.01ms | 100ms | PASS | stable |
| render_error_handling (5 throw + catch in component) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| render_workflow (10 renderSolid) | 0.05ms | 200ms | PASS |
| signal_reactive_batch (5 signal+effect update chains) | 0.03ms | 200ms | PASS |
| render_error_handling (5 throw + catch in component) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | -1984 B | 0 B | 102400 B | yes | PASS |
| signal_reactive_batch (5 signal+effect update chains) | 2168 B | 0 B | 102400 B | yes | PASS |
| render_error_handling (5 throw + catch in component) | 5000 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### render_workflow (10 renderSolid)

# Perf Report — render_workflow (10 renderSolid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -0.16% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +55.50% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +55.60% |
| mean | 0.01ms | 0.01ms | +0.00ms | +10.11% |
| min | 0.01ms | 0.01ms | -0.00ms | -3.05% |
| max | 0.04ms | 0.03ms | +0.01ms | +55.63% |
| total | 0.30ms | 0.27ms | +0.03ms | +10.11% |

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
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +2.46% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +7.77% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +6.97% |
| mean | 0.01ms | 0.01ms | +0.00ms | +17.16% |
| min | 0.00ms | 0.00ms | +0.00ms | +1.02% |
| max | 0.01ms | 0.01ms | +0.00ms | +6.85% |
| total | 0.14ms | 0.12ms | +0.02ms | +17.16% |

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
| max | 0.03ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -0.01% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +23.59% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +65.06% |
| mean | 0.01ms | 0.01ms | +0.00ms | +9.94% |
| min | 0.01ms | 0.01ms | -0.00ms | -1.62% |
| max | 0.03ms | 0.01ms | +0.01ms | +71.43% |
| total | 0.18ms | 0.17ms | +0.02ms | +9.94% |

