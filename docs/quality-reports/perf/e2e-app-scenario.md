# Perf Suite — e2e-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 6.09ms | 300ms | PASS | stable |
| concurrent_read_batch (5 GET via Promise.all) | 0.89ms | 300ms | PASS | stable |
| server_error_handling (5 GET /fail 500 responses) | 1.17ms | 300ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 7.74ms | 600ms | PASS |
| concurrent_read_batch (5 GET via Promise.all) | 1.81ms | 600ms | PASS |
| server_error_handling (5 GET /fail 500 responses) | 3.48ms | 600ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (POST create + GET read + DELETE cycle x3) | 48512 B | 10665 B | 102400 B | yes | PASS |
| concurrent_read_batch (5 GET via Promise.all) | -5200 B | 0 B | 102400 B | yes | PASS |
| server_error_handling (5 GET /fail 500 responses) | -760 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_workflow (POST create + GET read + DELETE cycle x3)

# Perf Report — rest_workflow (POST create + GET read + DELETE cycle x3).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 2.32ms |
| p95 | 6.09ms |
| p99 | 6.91ms |
| mean | 2.75ms |
| stdev | 1.36ms |
| min | 1.32ms |
| max | 6.94ms |
| total | 82.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 2.32ms | 1.25ms | +1.07ms | +85.32% |
| p95 | 6.09ms | 5.23ms | +0.86ms | +16.46% |
| p99 | 6.91ms | 9.95ms | -3.05ms | -30.60% |
| mean | 2.75ms | 1.94ms | +0.82ms | +42.08% |
| min | 1.32ms | 0.61ms | +0.71ms | +117.33% |
| max | 6.94ms | 13.94ms | -7.00ms | -50.18% |
| total | 82.61ms | 387.61ms | -305.00ms | -78.69% |

### concurrent_read_batch (5 GET via Promise.all)

# Perf Report — concurrent_read_batch (5 GET via Promise.all).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.39ms |
| p95 | 0.89ms |
| p99 | 1.45ms |
| mean | 0.49ms |
| stdev | 0.27ms |
| min | 0.35ms |
| max | 1.64ms |
| total | 14.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.39ms | 0.39ms | -0.00ms | -0.86% |
| p95 | 0.89ms | 0.98ms | -0.10ms | -9.82% |
| p99 | 1.45ms | 3.08ms | -1.62ms | -52.76% |
| mean | 0.49ms | 0.51ms | -0.02ms | -4.03% |
| min | 0.35ms | 0.32ms | +0.03ms | +8.96% |
| max | 1.64ms | 3.40ms | -1.76ms | -51.65% |
| total | 14.80ms | 102.83ms | -88.03ms | -85.60% |

### server_error_handling (5 GET /fail 500 responses)

# Perf Report — server_error_handling (5 GET /fail 500 responses).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p50 | 0.66ms |
| p95 | 1.17ms |
| p99 | 1.22ms |
| mean | 0.67ms |
| stdev | 0.27ms |
| min | 0.35ms |
| max | 1.23ms |
| total | 20.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.66ms | 0.55ms | +0.11ms | +20.86% |
| p95 | 1.17ms | 1.00ms | +0.17ms | +17.11% |
| p99 | 1.22ms | 1.71ms | -0.48ms | -28.28% |
| mean | 0.67ms | 0.60ms | +0.07ms | +11.85% |
| min | 0.35ms | 0.35ms | +0.00ms | +1.01% |
| max | 1.23ms | 2.20ms | -0.97ms | -44.19% |
| total | 20.16ms | 120.18ms | -100.02ms | -83.22% |

