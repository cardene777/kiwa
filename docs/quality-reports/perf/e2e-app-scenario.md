# Perf Suite — e2e-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 3.52ms | 300ms | PASS | stable |
| concurrent_read_batch (5 GET via Promise.all) | 0.69ms | 300ms | PASS | stable |
| server_error_handling (5 GET /fail 500 responses) | 0.84ms | 300ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 7.75ms | 600ms | PASS |
| concurrent_read_batch (5 GET via Promise.all) | 1.35ms | 600ms | PASS |
| server_error_handling (5 GET /fail 500 responses) | 3.59ms | 600ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 2864 B | -52649 B | 102400 B | yes | PASS |
| concurrent_read_batch (5 GET via Promise.all) | -21264 B | 0 B | 102400 B | yes | PASS |
| server_error_handling (5 GET /fail 500 responses) | -6096 B | 11094 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_workflow (POST create + GET read + DELETE cycle x3)

# Perf Report — rest_workflow (POST create + GET read + DELETE cycle x3).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 1.97ms |
| p95 | 3.52ms |
| p99 | 3.80ms |
| mean | 2.22ms |
| stdev | 0.79ms |
| min | 1.15ms |
| max | 3.88ms |
| total | 66.74ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 1.97ms | 2.13ms | -0.16ms | -7.58% |
| p95 | 3.52ms | 3.12ms | +0.40ms | +12.91% |
| p99 | 3.80ms | 3.56ms | +0.23ms | +6.53% |
| mean | 2.22ms | 2.13ms | +0.09ms | +4.38% |
| min | 1.15ms | 1.22ms | -0.06ms | -5.13% |
| max | 3.88ms | 3.67ms | +0.21ms | +5.66% |
| total | 66.74ms | 63.94ms | +2.80ms | +4.38% |

### concurrent_read_batch (5 GET via Promise.all)

# Perf Report — concurrent_read_batch (5 GET via Promise.all).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.42ms |
| p95 | 0.69ms |
| p99 | 0.81ms |
| mean | 0.46ms |
| stdev | 0.11ms |
| min | 0.35ms |
| max | 0.84ms |
| total | 13.83ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.42ms | 0.45ms | -0.02ms | -5.16% |
| p95 | 0.69ms | 0.67ms | +0.03ms | +3.94% |
| p99 | 0.81ms | 0.70ms | +0.11ms | +15.52% |
| mean | 0.46ms | 0.48ms | -0.02ms | -3.77% |
| min | 0.35ms | 0.35ms | -0.00ms | -0.44% |
| max | 0.84ms | 0.72ms | +0.12ms | +17.28% |
| total | 13.83ms | 14.38ms | -0.54ms | -3.77% |

### server_error_handling (5 GET /fail 500 responses)

# Perf Report — server_error_handling (5 GET /fail 500 responses).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.52ms |
| p95 | 0.84ms |
| p99 | 0.86ms |
| mean | 0.56ms |
| stdev | 0.16ms |
| min | 0.37ms |
| max | 0.86ms |
| total | 16.67ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.52ms | 0.38ms | +0.14ms | +35.31% |
| p95 | 0.84ms | 0.69ms | +0.15ms | +22.05% |
| p99 | 0.86ms | 0.81ms | +0.05ms | +5.63% |
| mean | 0.56ms | 0.44ms | +0.12ms | +27.25% |
| min | 0.37ms | 0.35ms | +0.02ms | +5.79% |
| max | 0.86ms | 0.85ms | +0.01ms | +0.95% |
| total | 16.67ms | 13.10ms | +3.57ms | +27.25% |

