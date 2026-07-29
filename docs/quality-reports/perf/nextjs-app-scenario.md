# Perf Suite — nextjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +5973%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| form_submission_batch (5 invoke with FormData) | 0.01ms | 100ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| action_error_handling (5 throw + catch) | 0.10ms | 100ms | PASS | stable (差 0.07ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.04ms | 200ms | PASS |
| form_submission_batch (5 invoke with FormData) | 0.03ms | 200ms | PASS |
| action_error_handling (5 throw + catch) | 0.25ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 5656 B | 0 B | 102400 B | yes | PASS |
| form_submission_batch (5 invoke with FormData) | 608 B | 0 B | 102400 B | yes | PASS |
| action_error_handling (5 throw + catch) | 712 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -3.00% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -1.22% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +12.50% |
| mean | 0.01ms | 0.01ms | +0.00ms | +6.58% |
| min | 0.00ms | 0.00ms | +0.00ms | +1.74% |
| max | 0.01ms | 0.01ms | +0.00ms | +14.70% |
| total | 0.14ms | 0.13ms | +0.01ms | +6.58% |

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
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +30.95% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +41.44% |
| p99 | 0.01ms | 0.01ms | +0.01ms | +89.30% |
| mean | 0.01ms | 0.00ms | +0.00ms | +31.08% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.98% |
| max | 0.01ms | 0.01ms | +0.01ms | +100.02% |
| total | 0.12ms | 0.09ms | +0.03ms | +31.08% |

### action_error_handling (5 throw + catch)

# Perf Report — action_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.10ms |
| p99 | 0.13ms |
| mean | 0.04ms |
| stdev | 0.03ms |
| min | 0.02ms |
| max | 0.14ms |
| total | 0.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +11.26% |
| p95 | 0.10ms | 0.03ms | +0.07ms | +263.17% |
| p99 | 0.13ms | 0.03ms | +0.10ms | +362.45% |
| mean | 0.04ms | 0.02ms | +0.02ms | +89.44% |
| min | 0.02ms | 0.02ms | +0.00ms | +4.87% |
| max | 0.14ms | 0.03ms | +0.11ms | +386.40% |
| total | 0.81ms | 0.43ms | +0.38ms | +89.44% |

