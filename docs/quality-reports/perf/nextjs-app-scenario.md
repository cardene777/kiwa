# Perf Suite — nextjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +5973%) 以上の悪化が必要) |
| form_submission_batch (5 invoke with FormData) | 0.01ms | 100ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) |
| action_error_handling (5 throw + catch) | 0.03ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1817%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.05ms | 200ms | PASS |
| form_submission_batch (5 invoke with FormData) | 0.02ms | 200ms | PASS |
| action_error_handling (5 throw + catch) | 0.09ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 296648 B | 0 B | 102400 B | yes | PASS |
| form_submission_batch (5 invoke with FormData) | 1608 B | 0 B | 102400 B | yes | PASS |
| action_error_handling (5 throw + catch) | 648 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.01ms | 0.01ms | -0.00ms | -27.93% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -11.39% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +8.34% |
| mean | 0.01ms | 0.01ms | -0.00ms | -12.68% |
| min | 0.00ms | 0.00ms | -0.00ms | -8.63% |
| max | 0.01ms | 0.01ms | +0.00ms | +11.50% |
| total | 0.12ms | 0.13ms | -0.02ms | -12.68% |

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
| p50 | 0.01ms | 0.00ms | +0.00ms | +22.38% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +33.27% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +32.58% |
| mean | 0.01ms | 0.00ms | +0.00ms | +19.29% |
| min | 0.00ms | 0.00ms | -0.00ms | -17.47% |
| max | 0.01ms | 0.01ms | +0.00ms | +32.43% |
| total | 0.11ms | 0.09ms | +0.02ms | +19.29% |

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
| p50 | 0.02ms | 0.02ms | -0.00ms | -0.62% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -6.15% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -7.32% |
| mean | 0.02ms | 0.02ms | -0.00ms | -3.13% |
| min | 0.02ms | 0.02ms | -0.00ms | -5.09% |
| max | 0.03ms | 0.03ms | -0.00ms | -7.60% |
| total | 0.42ms | 0.43ms | -0.01ms | -3.13% |

