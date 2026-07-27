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
| form_submission_batch (5 invoke with FormData) | 0.02ms | 200ms | PASS |
| action_error_handling (5 throw + catch) | 0.09ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 3872 B | 0 B | 102400 B | yes | PASS |
| form_submission_batch (5 invoke with FormData) | 1528 B | 0 B | 102400 B | yes | PASS |
| action_error_handling (5 throw + catch) | 736 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -3.90% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +13.36% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +6.36% |
| mean | 0.01ms | 0.01ms | +0.00ms | +0.54% |
| min | 0.00ms | 0.00ms | -0.00ms | -1.87% |
| max | 0.01ms | 0.01ms | +0.00ms | +5.36% |
| total | 0.12ms | 0.12ms | +0.00ms | +0.54% |

### form_submission_batch (5 invoke with FormData)

# Perf Report — form_submission_batch (5 invoke with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -2.45% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +30.13% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +14.04% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.81% |
| min | 0.00ms | 0.00ms | -0.00ms | -26.25% |
| max | 0.01ms | 0.01ms | +0.00ms | +10.64% |
| total | 0.09ms | 0.09ms | -0.00ms | -0.81% |

### action_error_handling (5 throw + catch)

# Perf Report — action_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.07ms |
| total | 0.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -0.00% |
| p95 | 0.03ms | 0.02ms | +0.00ms | +10.25% |
| p99 | 0.06ms | 0.03ms | +0.03ms | +136.58% |
| mean | 0.02ms | 0.02ms | +0.00ms | +11.57% |
| min | 0.02ms | 0.02ms | -0.00ms | -2.44% |
| max | 0.07ms | 0.03ms | +0.04ms | +167.72% |
| total | 0.45ms | 0.40ms | +0.05ms | +11.57% |

