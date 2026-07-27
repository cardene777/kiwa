# Perf Suite — nextjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.01ms | 100ms | PASS | stable |
| form_submission_batch (5 invoke with FormData) | 0.01ms | 100ms | PASS | stable |
| action_error_handling (5 throw + catch) | 0.03ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.03ms | 200ms | PASS |
| form_submission_batch (5 invoke with FormData) | 0.05ms | 200ms | PASS |
| action_error_handling (5 throw + catch) | 0.09ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 1038520 B | 0 B | 102400 B | PASS |
| form_submission_batch (5 invoke with FormData) | 328760 B | 0 B | 102400 B | PASS |
| action_error_handling (5 throw + catch) | 376128 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### server_action_workflow (10 invokeServerAction)

# Perf Report — server_action_workflow (10 invokeServerAction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
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
| p50 | 0.00ms | 0.00ms | +0.00ms | +7.68% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +0.46% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -33.28% |
| mean | 0.01ms | 0.01ms | -0.00ms | -3.82% |
| min | 0.00ms | 0.00ms | +0.00ms | +0.91% |
| max | 0.01ms | 0.02ms | -0.01ms | -36.16% |
| total | 0.12ms | 0.12ms | -0.00ms | -3.82% |

### form_submission_batch (5 invoke with FormData)

# Perf Report — form_submission_batch (5 invoke with FormData).serial

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +26.15% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +22.83% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +37.73% |
| mean | 0.01ms | 0.00ms | +0.00ms | +29.07% |
| min | 0.00ms | 0.00ms | +0.00ms | +28.38% |
| max | 0.01ms | 0.01ms | +0.00ms | +40.43% |
| total | 0.11ms | 0.08ms | +0.02ms | +29.07% |

### action_error_handling (5 throw + catch)

# Perf Report — action_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -0.31% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +4.13% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +1.56% |
| mean | 0.02ms | 0.02ms | +0.00ms | +0.67% |
| min | 0.02ms | 0.02ms | -0.00ms | -4.73% |
| max | 0.03ms | 0.03ms | +0.00ms | +0.95% |
| total | 0.42ms | 0.42ms | +0.00ms | +0.67% |

