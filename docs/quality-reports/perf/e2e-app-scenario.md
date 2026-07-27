# Perf Suite — e2e-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 2.56ms | 300ms | PASS | stable |
| concurrent_read_batch (5 GET via Promise.all) | 0.56ms | 300ms | PASS | stable |
| server_error_handling (5 GET /fail 500 responses) | 0.63ms | 300ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 5.61ms | 600ms | PASS |
| concurrent_read_batch (5 GET via Promise.all) | 1.02ms | 600ms | PASS |
| server_error_handling (5 GET /fail 500 responses) | 1.76ms | 600ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | -384 B | 6269 B | 102400 B | yes | PASS |
| concurrent_read_batch (5 GET via Promise.all) | -21712 B | 0 B | 102400 B | yes | PASS |
| server_error_handling (5 GET /fail 500 responses) | -8808 B | 11062 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_workflow (POST create + GET read + DELETE cycle x3)

# Perf Report — rest_workflow (POST create + GET read + DELETE cycle x3).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 1.68ms |
| p95 | 2.56ms |
| p99 | 2.57ms |
| mean | 1.76ms |
| stdev | 0.50ms |
| min | 0.95ms |
| max | 2.57ms |
| total | 52.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 1.68ms | 2.13ms | -0.45ms | -20.99% |
| p95 | 2.56ms | 3.12ms | -0.56ms | -17.81% |
| p99 | 2.57ms | 3.56ms | -0.99ms | -27.82% |
| mean | 1.76ms | 2.13ms | -0.37ms | -17.28% |
| min | 0.95ms | 1.22ms | -0.26ms | -21.66% |
| max | 2.57ms | 3.67ms | -1.10ms | -29.94% |
| total | 52.90ms | 63.94ms | -11.05ms | -17.28% |

### concurrent_read_batch (5 GET via Promise.all)

# Perf Report — concurrent_read_batch (5 GET via Promise.all).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.37ms |
| p95 | 0.56ms |
| p99 | 0.62ms |
| mean | 0.39ms |
| stdev | 0.07ms |
| min | 0.32ms |
| max | 0.64ms |
| total | 11.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.37ms | 0.45ms | -0.08ms | -17.86% |
| p95 | 0.56ms | 0.67ms | -0.11ms | -16.51% |
| p99 | 0.62ms | 0.70ms | -0.09ms | -12.16% |
| mean | 0.39ms | 0.48ms | -0.09ms | -18.19% |
| min | 0.32ms | 0.35ms | -0.03ms | -8.98% |
| max | 0.64ms | 0.72ms | -0.08ms | -11.11% |
| total | 11.76ms | 14.38ms | -2.61ms | -18.19% |

### server_error_handling (5 GET /fail 500 responses)

# Perf Report — server_error_handling (5 GET /fail 500 responses).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.40ms |
| p95 | 0.63ms |
| p99 | 0.73ms |
| mean | 0.44ms |
| stdev | 0.11ms |
| min | 0.34ms |
| max | 0.77ms |
| total | 13.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.40ms | 0.38ms | +0.01ms | +3.73% |
| p95 | 0.63ms | 0.69ms | -0.05ms | -7.69% |
| p99 | 0.73ms | 0.81ms | -0.08ms | -9.84% |
| mean | 0.44ms | 0.44ms | +0.00ms | +0.16% |
| min | 0.34ms | 0.35ms | -0.00ms | -0.61% |
| max | 0.77ms | 0.85ms | -0.08ms | -9.77% |
| total | 13.12ms | 13.10ms | +0.02ms | +0.16% |

