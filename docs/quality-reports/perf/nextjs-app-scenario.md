# Perf Suite — nextjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.01ms | 100ms | PASS | stable |
| form_submission_batch (5 invoke with FormData) | 0.02ms | 100ms | PASS | stable |
| action_error_handling (5 throw + catch) | 0.03ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.04ms | 200ms | PASS |
| form_submission_batch (5 invoke with FormData) | 0.10ms | 200ms | PASS |
| action_error_handling (5 throw + catch) | 0.26ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 576992 B | 0 B | 102400 B | yes | PASS |
| form_submission_batch (5 invoke with FormData) | 360 B | 0 B | 102400 B | yes | PASS |
| action_error_handling (5 throw + catch) | 640 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### server_action_workflow (10 invokeServerAction)

# Perf Report — server_action_workflow (10 invokeServerAction).serial

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
| p50 | 0.01ms | 0.00ms | +0.00ms | +4.32% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +4.87% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -0.17% |
| mean | 0.01ms | 0.01ms | +0.00ms | +6.21% |
| min | 0.00ms | 0.00ms | +0.00ms | +6.49% |
| max | 0.01ms | 0.01ms | -0.00ms | -0.89% |
| total | 0.12ms | 0.12ms | +0.01ms | +6.21% |

### form_submission_batch (5 invoke with FormData)

# Perf Report — form_submission_batch (5 invoke with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.10ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.11ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.01ms | +149.02% |
| p95 | 0.02ms | 0.00ms | +0.02ms | +346.47% |
| p99 | 0.10ms | 0.01ms | +0.09ms | +1590.98% |
| mean | 0.02ms | 0.00ms | +0.01ms | +277.90% |
| min | 0.01ms | 0.00ms | +0.01ms | +132.34% |
| max | 0.11ms | 0.01ms | +0.11ms | +1853.91% |
| total | 0.33ms | 0.09ms | +0.24ms | +277.90% |

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
| total | 0.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +13.56% |
| p95 | 0.03ms | 0.02ms | +0.00ms | +14.17% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +16.02% |
| mean | 0.02ms | 0.02ms | +0.00ms | +14.32% |
| min | 0.02ms | 0.02ms | +0.00ms | +13.30% |
| max | 0.03ms | 0.03ms | +0.00ms | +16.48% |
| total | 0.46ms | 0.40ms | +0.06ms | +14.32% |

