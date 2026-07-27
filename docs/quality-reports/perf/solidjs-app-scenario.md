# Perf Suite — solidjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| render_workflow (10 renderSolid) | 0.02ms | 100ms | PASS | stable |
| signal_reactive_batch (5 signal+effect update chains) | 0.01ms | 100ms | PASS | stable |
| render_error_handling (5 throw + catch in component) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| render_workflow (10 renderSolid) | 0.05ms | 200ms | PASS |
| signal_reactive_batch (5 signal+effect update chains) | 0.05ms | 200ms | PASS |
| render_error_handling (5 throw + catch in component) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | -1984 B | 0 B | 102400 B | yes | PASS |
| signal_reactive_batch (5 signal+effect update chains) | 1656 B | 0 B | 102400 B | yes | PASS |
| render_error_handling (5 throw + catch in component) | 4408 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### render_workflow (10 renderSolid)

# Perf Report — render_workflow (10 renderSolid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -2.58% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -16.59% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +3.05% |
| mean | 0.01ms | 0.01ms | -0.00ms | -2.31% |
| min | 0.01ms | 0.01ms | +0.00ms | +0.01% |
| max | 0.03ms | 0.03ms | +0.00ms | +7.13% |
| total | 0.26ms | 0.27ms | -0.01ms | -2.31% |

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
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +0.35% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +17.36% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -1.66% |
| mean | 0.01ms | 0.01ms | +0.00ms | +13.34% |
| min | 0.00ms | 0.00ms | +0.00ms | +5.04% |
| max | 0.01ms | 0.01ms | -0.00ms | -4.46% |
| total | 0.13ms | 0.12ms | +0.02ms | +13.34% |

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
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +11.31% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +1.19% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -28.74% |
| mean | 0.01ms | 0.01ms | +0.00ms | +6.16% |
| min | 0.01ms | 0.01ms | +0.00ms | +11.90% |
| max | 0.01ms | 0.01ms | -0.00ms | -33.34% |
| total | 0.18ms | 0.17ms | +0.01ms | +6.16% |

