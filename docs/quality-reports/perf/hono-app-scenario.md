# Perf Suite — hono-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.04ms | 100ms | PASS | stable |
| rpc_client_batch (5 rpc calls) | 0.02ms | 100ms | PASS | stable |
| route_error_handling (5 throw + catch) | 0.04ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.59ms | 200ms | PASS |
| rpc_client_batch (5 rpc calls) | 0.08ms | 200ms | PASS |
| route_error_handling (5 throw + catch) | 0.18ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 5776 B | 0 B | 102400 B | yes | PASS |
| rpc_client_batch (5 rpc calls) | 248048 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 throw + catch) | 352 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### route_workflow (10 invokeRoute GET+POST mix)

# Perf Report — route_workflow (10 invokeRoute GET+POST mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.67ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.02ms | +0.01ms | +43.69% |
| p95 | 0.04ms | 0.04ms | +0.00ms | +2.51% |
| p99 | 0.05ms | 0.04ms | +0.01ms | +23.40% |
| mean | 0.03ms | 0.03ms | +0.01ms | +32.10% |
| min | 0.03ms | 0.02ms | +0.01ms | +48.51% |
| max | 0.05ms | 0.04ms | +0.01ms | +27.87% |
| total | 0.67ms | 0.51ms | +0.16ms | +32.10% |

### rpc_client_batch (5 rpc calls)

# Perf Report — rpc_client_batch (5 rpc calls).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.00ms | +18.27% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +10.61% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +15.58% |
| mean | 0.02ms | 0.02ms | +0.00ms | +17.93% |
| min | 0.01ms | 0.01ms | +0.00ms | +9.12% |
| max | 0.02ms | 0.02ms | +0.00ms | +16.67% |
| total | 0.36ms | 0.30ms | +0.05ms | +17.93% |

### route_error_handling (5 throw + catch)

# Perf Report — route_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.04ms |
| stdev | 0.00ms |
| min | 0.04ms |
| max | 0.04ms |
| total | 0.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | +0.00ms | +2.49% |
| p95 | 0.04ms | 0.04ms | -0.00ms | -7.51% |
| p99 | 0.04ms | 0.05ms | -0.01ms | -15.39% |
| mean | 0.04ms | 0.04ms | +0.00ms | +0.75% |
| min | 0.04ms | 0.04ms | +0.00ms | +4.24% |
| max | 0.04ms | 0.05ms | -0.01ms | -17.13% |
| total | 0.80ms | 0.79ms | +0.01ms | +0.75% |

