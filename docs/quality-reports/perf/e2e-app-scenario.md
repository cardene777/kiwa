# Perf Suite — e2e-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 7.16ms | 300ms | PASS | regressed — gate 無効 (regressionGate=false) |
| concurrent_read_batch (5 GET via Promise.all) | 2.39ms | 300ms | PASS | stable — gate 無効 (regressionGate=false) |
| server_error_handling (5 GET /fail 500 responses) | 6.56ms | 300ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 9.93ms | 600ms | PASS |
| concurrent_read_batch (5 GET via Promise.all) | 1.92ms | 600ms | PASS |
| server_error_handling (5 GET /fail 500 responses) | 8.81ms | 600ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 4376 B | -66771 B | 102400 B | yes | PASS |
| concurrent_read_batch (5 GET via Promise.all) | -20768 B | -25466 B | 102400 B | yes | PASS |
| server_error_handling (5 GET /fail 500 responses) | -105616 B | 25870 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_workflow (POST create + GET read + DELETE cycle x3)

# Perf Report — rest_workflow (POST create + GET read + DELETE cycle x3).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 5.05ms |
| p95 | 7.16ms |
| p99 | 12.73ms |
| mean | 5.14ms |
| stdev | 2.38ms |
| min | 1.89ms |
| max | 14.90ms |
| total | 154.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 5.05ms | 1.25ms | +3.79ms | +302.70% |
| p95 | 7.16ms | 5.23ms | +1.93ms | +36.87% |
| p99 | 12.73ms | 9.95ms | +2.78ms | +27.96% |
| mean | 5.14ms | 1.94ms | +3.20ms | +165.11% |
| min | 1.89ms | 0.61ms | +1.29ms | +211.49% |
| max | 14.90ms | 13.94ms | +0.96ms | +6.90% |
| total | 154.14ms | 387.61ms | -233.47ms | -60.23% |

### concurrent_read_batch (5 GET via Promise.all)

# Perf Report — concurrent_read_batch (5 GET via Promise.all).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.43ms |
| p95 | 2.39ms |
| p99 | 3.61ms |
| mean | 0.77ms |
| stdev | 0.81ms |
| min | 0.38ms |
| max | 3.98ms |
| total | 23.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.43ms | 0.39ms | +0.04ms | +11.37% |
| p95 | 2.39ms | 0.98ms | +1.41ms | +143.12% |
| p99 | 3.61ms | 3.08ms | +0.53ms | +17.37% |
| mean | 0.77ms | 0.51ms | +0.26ms | +49.66% |
| min | 0.38ms | 0.32ms | +0.06ms | +18.57% |
| max | 3.98ms | 3.40ms | +0.58ms | +17.20% |
| total | 23.09ms | 102.83ms | -79.75ms | -77.55% |

### server_error_handling (5 GET /fail 500 responses)

# Perf Report — server_error_handling (5 GET /fail 500 responses).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 2.37ms |
| p95 | 6.56ms |
| p99 | 7.55ms |
| mean | 3.27ms |
| stdev | 2.07ms |
| min | 0.97ms |
| max | 7.93ms |
| total | 98.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 2.37ms | 0.55ms | +1.82ms | +331.95% |
| p95 | 6.56ms | 1.00ms | +5.55ms | +553.72% |
| p99 | 7.55ms | 1.71ms | +5.84ms | +341.89% |
| mean | 3.27ms | 0.60ms | +2.67ms | +443.76% |
| min | 0.97ms | 0.35ms | +0.62ms | +176.31% |
| max | 7.93ms | 2.20ms | +5.73ms | +260.01% |
| total | 98.03ms | 120.18ms | -22.16ms | -18.44% |

