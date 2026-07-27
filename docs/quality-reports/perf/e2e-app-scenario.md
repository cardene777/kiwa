# Perf Suite — e2e-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 2.55ms | 300ms | PASS | stable |
| concurrent_read_batch (5 GET via Promise.all) | 0.41ms | 300ms | PASS | stable |
| server_error_handling (5 GET /fail 500 responses) | 0.88ms | 300ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 7.01ms | 600ms | PASS |
| concurrent_read_batch (5 GET via Promise.all) | 1.26ms | 600ms | PASS |
| server_error_handling (5 GET /fail 500 responses) | 1.67ms | 600ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | -2536 B | 6617 B | 102400 B | yes | PASS |
| concurrent_read_batch (5 GET via Promise.all) | -10216 B | 13988 B | 102400 B | yes | PASS |
| server_error_handling (5 GET /fail 500 responses) | -4960 B | 36164 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_workflow (POST create + GET read + DELETE cycle x3)

# Perf Report — rest_workflow (POST create + GET read + DELETE cycle x3).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 1.95ms |
| p95 | 2.55ms |
| p99 | 3.05ms |
| mean | 1.98ms |
| stdev | 0.44ms |
| min | 1.36ms |
| max | 3.25ms |
| total | 59.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 1.95ms | 2.13ms | -0.18ms | -8.36% |
| p95 | 2.55ms | 3.12ms | -0.57ms | -18.35% |
| p99 | 3.05ms | 3.56ms | -0.51ms | -14.39% |
| mean | 1.98ms | 2.13ms | -0.15ms | -7.10% |
| min | 1.36ms | 1.22ms | +0.14ms | +11.46% |
| max | 3.25ms | 3.67ms | -0.42ms | -11.55% |
| total | 59.40ms | 63.94ms | -4.54ms | -7.10% |

### concurrent_read_batch (5 GET via Promise.all)

# Perf Report — concurrent_read_batch (5 GET via Promise.all).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.37ms |
| p95 | 0.41ms |
| p99 | 0.42ms |
| mean | 0.37ms |
| stdev | 0.02ms |
| min | 0.33ms |
| max | 0.42ms |
| total | 11.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.37ms | 0.45ms | -0.08ms | -16.86% |
| p95 | 0.41ms | 0.67ms | -0.26ms | -38.75% |
| p99 | 0.42ms | 0.70ms | -0.29ms | -40.79% |
| mean | 0.37ms | 0.48ms | -0.11ms | -22.38% |
| min | 0.33ms | 0.35ms | -0.01ms | -3.88% |
| max | 0.42ms | 0.72ms | -0.30ms | -41.52% |
| total | 11.16ms | 14.38ms | -3.22ms | -22.38% |

### server_error_handling (5 GET /fail 500 responses)

# Perf Report — server_error_handling (5 GET /fail 500 responses).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.52ms |
| p95 | 0.88ms |
| p99 | 0.94ms |
| mean | 0.56ms |
| stdev | 0.18ms |
| min | 0.35ms |
| max | 0.96ms |
| total | 16.74ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.52ms | 0.38ms | +0.13ms | +35.11% |
| p95 | 0.88ms | 0.69ms | +0.19ms | +27.67% |
| p99 | 0.94ms | 0.81ms | +0.13ms | +16.11% |
| mean | 0.56ms | 0.44ms | +0.12ms | +27.73% |
| min | 0.35ms | 0.35ms | +0.00ms | +0.02% |
| max | 0.96ms | 0.85ms | +0.11ms | +12.42% |
| total | 16.74ms | 13.10ms | +3.63ms | +27.73% |

