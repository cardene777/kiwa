# Perf Suite — solidjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| render_workflow (10 renderSolid) | 0.02ms | 100ms | PASS | stable |
| signal_reactive_batch (5 signal+effect update chains) | 0.02ms | 100ms | PASS | stable |
| render_error_handling (5 throw + catch in component) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| render_workflow (10 renderSolid) | 0.05ms | 200ms | PASS |
| signal_reactive_batch (5 signal+effect update chains) | 0.04ms | 200ms | PASS |
| render_error_handling (5 throw + catch in component) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| render_workflow (10 renderSolid) | 254840 B | 0 B | 102400 B | PASS |
| signal_reactive_batch (5 signal+effect update chains) | 237032 B | 0 B | 102400 B | PASS |
| render_error_handling (5 throw + catch in component) | 110664 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### render_workflow (10 renderSolid)

# Perf Report — render_workflow (10 renderSolid).serial

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
| p50 | 0.01ms | 0.01ms | +0.00ms | +3.37% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -7.57% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -2.21% |
| mean | 0.01ms | 0.01ms | +0.00ms | +3.41% |
| min | 0.01ms | 0.01ms | +0.00ms | +6.27% |
| max | 0.02ms | 0.02ms | -0.00ms | -1.18% |
| total | 0.23ms | 0.22ms | +0.01ms | +3.41% |

### signal_reactive_batch (5 signal+effect update chains)

# Perf Report — signal_reactive_batch (5 signal+effect update chains).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.07ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +38.03% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +107.42% |
| p99 | 0.06ms | 0.01ms | +0.05ms | +399.85% |
| mean | 0.01ms | 0.01ms | +0.00ms | +73.90% |
| min | 0.00ms | 0.00ms | -0.00ms | -2.03% |
| max | 0.07ms | 0.01ms | +0.05ms | +446.26% |
| total | 0.19ms | 0.11ms | +0.08ms | +73.90% |

### render_error_handling (5 throw + catch in component)

# Perf Report — render_error_handling (5 throw + catch in component).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -3.06% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -4.29% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +0.62% |
| mean | 0.01ms | 0.01ms | -0.00ms | -3.60% |
| min | 0.01ms | 0.01ms | -0.00ms | -0.01% |
| max | 0.01ms | 0.01ms | +0.00ms | +1.83% |
| total | 0.16ms | 0.17ms | -0.01ms | -3.60% |

