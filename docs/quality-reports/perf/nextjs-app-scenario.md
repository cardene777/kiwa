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
| server_action_workflow (10 invokeServerAction) | 0.05ms | 200ms | PASS |
| form_submission_batch (5 invoke with FormData) | 0.03ms | 200ms | PASS |
| action_error_handling (5 throw + catch) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 19264 B | 0 B | 102400 B | yes | PASS |
| form_submission_batch (5 invoke with FormData) | 1792 B | 0 B | 102400 B | yes | PASS |
| action_error_handling (5 throw + catch) | 832 B | 0 B | 102400 B | yes | PASS |

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
| min | 0.01ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +47.61% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +10.36% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +10.67% |
| mean | 0.01ms | 0.01ms | +0.00ms | +26.17% |
| min | 0.01ms | 0.00ms | +0.00ms | +13.89% |
| max | 0.02ms | 0.01ms | +0.00ms | +10.71% |
| total | 0.15ms | 0.12ms | +0.03ms | +26.17% |

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
| min | 0.01ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +37.26% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +33.11% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +33.88% |
| mean | 0.01ms | 0.00ms | +0.00ms | +38.19% |
| min | 0.01ms | 0.00ms | +0.00ms | +26.25% |
| max | 0.01ms | 0.01ms | +0.00ms | +34.04% |
| total | 0.12ms | 0.09ms | +0.03ms | +38.19% |

### action_error_handling (5 throw + catch)

# Perf Report — action_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +12.47% |
| p95 | 0.03ms | 0.02ms | +0.00ms | +16.83% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +43.51% |
| mean | 0.02ms | 0.02ms | +0.00ms | +15.14% |
| min | 0.02ms | 0.02ms | +0.00ms | +11.08% |
| max | 0.04ms | 0.03ms | +0.01ms | +50.09% |
| total | 0.46ms | 0.40ms | +0.06ms | +15.14% |

