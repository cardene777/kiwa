# Perf Suite — e2e-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 2.46ms | 300ms | PASS | stable |
| concurrent_read_batch (5 GET via Promise.all) | 0.42ms | 300ms | PASS | stable |
| server_error_handling (5 GET /fail 500 responses) | 0.49ms | 300ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 5.10ms | 600ms | PASS |
| concurrent_read_batch (5 GET via Promise.all) | 2.50ms | 600ms | PASS |
| server_error_handling (5 GET /fail 500 responses) | 1.44ms | 600ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 4609872 B | 20523 B | 102400 B | PASS |
| concurrent_read_batch (5 GET via Promise.all) | 11425248 B | 38192 B | 102400 B | PASS |
| server_error_handling (5 GET /fail 500 responses) | -8974224 B | -38200 B | 102400 B | PASS |

## Detailed serial reports

### rest_workflow (POST create + GET read + DELETE cycle x3)

# Perf Report — rest_workflow (POST create + GET read + DELETE cycle x3).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 1.75ms |
| p95 | 2.46ms |
| p99 | 2.83ms |
| mean | 1.80ms |
| stdev | 0.45ms |
| min | 0.97ms |
| max | 2.94ms |
| total | 53.97ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 1.75ms | 1.86ms | -0.10ms | -5.56% |
| p95 | 2.46ms | 2.56ms | -0.09ms | -3.59% |
| p99 | 2.83ms | 2.75ms | +0.08ms | +2.90% |
| mean | 1.80ms | 1.87ms | -0.07ms | -3.74% |
| min | 0.97ms | 1.31ms | -0.33ms | -25.42% |
| max | 2.94ms | 2.79ms | +0.15ms | +5.25% |
| total | 53.97ms | 56.07ms | -2.10ms | -3.74% |

### concurrent_read_batch (5 GET via Promise.all)

# Perf Report — concurrent_read_batch (5 GET via Promise.all).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.29ms |
| p95 | 0.42ms |
| p99 | 0.74ms |
| mean | 0.32ms |
| stdev | 0.11ms |
| min | 0.26ms |
| max | 0.86ms |
| total | 9.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.29ms | 0.29ms | -0.00ms | -0.77% |
| p95 | 0.42ms | 0.62ms | -0.20ms | -32.22% |
| p99 | 0.74ms | 1.07ms | -0.33ms | -31.11% |
| mean | 0.32ms | 0.35ms | -0.03ms | -7.99% |
| min | 0.26ms | 0.27ms | -0.01ms | -2.91% |
| max | 0.86ms | 1.22ms | -0.36ms | -29.37% |
| total | 9.55ms | 10.38ms | -0.83ms | -7.99% |

### server_error_handling (5 GET /fail 500 responses)

# Perf Report — server_error_handling (5 GET /fail 500 responses).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.32ms |
| p95 | 0.49ms |
| p99 | 0.65ms |
| mean | 0.34ms |
| stdev | 0.09ms |
| min | 0.27ms |
| max | 0.70ms |
| total | 10.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.32ms | 0.36ms | -0.04ms | -10.20% |
| p95 | 0.49ms | 0.49ms | -0.00ms | -0.31% |
| p99 | 0.65ms | 1.23ms | -0.59ms | -47.64% |
| mean | 0.34ms | 0.41ms | -0.06ms | -15.83% |
| min | 0.27ms | 0.31ms | -0.04ms | -13.13% |
| max | 0.70ms | 1.53ms | -0.83ms | -54.35% |
| total | 10.27ms | 12.20ms | -1.93ms | -15.83% |

