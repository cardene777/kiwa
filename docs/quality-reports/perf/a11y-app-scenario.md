# Perf Suite — a11y-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 41.23ms | 1200ms | PASS | stable — gate 無効 (regressionGate=false) |
| violation_report_batch (2 dirty runAxe + reportViolations) | 58.22ms | 900ms | PASS | stable — gate 無効 (regressionGate=false) |
| audit_error_handling (3 invalid-context throw + catch) | 17.33ms | 100ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 101.58ms | 2400ms | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | 83.30ms | 1800ms | PASS |
| audit_error_handling (3 invalid-context throw + catch) | 75.51ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | -304200 B | 0 B | 102400 B | yes | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | 122416 B | 0 B | 102400 B | yes | PASS |
| audit_error_handling (3 invalid-context throw + catch) | -111736 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### audit_workflow (3 fixture runAxe cycle)

# Perf Report — audit_workflow (3 fixture runAxe cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 28.88ms |
| p95 | 41.23ms |
| p99 | 41.98ms |
| mean | 29.94ms |
| stdev | 6.33ms |
| min | 20.81ms |
| max | 42.17ms |
| total | 598.77ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 28.88ms | 25.28ms | +3.60ms | +14.26% |
| p95 | 41.23ms | 39.77ms | +1.46ms | +3.67% |
| p99 | 41.98ms | 58.55ms | -16.58ms | -28.31% |
| mean | 29.94ms | 28.34ms | +1.60ms | +5.65% |
| min | 20.81ms | 18.12ms | +2.70ms | +14.89% |
| max | 42.17ms | 224.01ms | -181.84ms | -81.18% |
| total | 598.77ms | 3542.03ms | -2943.27ms | -83.10% |

### violation_report_batch (2 dirty runAxe + reportViolations)

# Perf Report — violation_report_batch (2 dirty runAxe + reportViolations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 20.31ms |
| p95 | 58.22ms |
| p99 | 101.31ms |
| mean | 27.72ms |
| stdev | 21.60ms |
| min | 18.13ms |
| max | 112.09ms |
| total | 554.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 20.31ms | 27.39ms | -7.09ms | -25.87% |
| p95 | 58.22ms | 65.73ms | -7.51ms | -11.43% |
| p99 | 101.31ms | 217.12ms | -115.81ms | -53.34% |
| mean | 27.72ms | 36.08ms | -8.36ms | -23.17% |
| min | 18.13ms | 17.17ms | +0.97ms | +5.62% |
| max | 112.09ms | 256.64ms | -144.56ms | -56.33% |
| total | 554.42ms | 4510.27ms | -3955.85ms | -87.71% |

### audit_error_handling (3 invalid-context throw + catch)

# Perf Report — audit_error_handling (3 invalid-context throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 15.34ms |
| p95 | 17.33ms |
| p99 | 17.48ms |
| mean | 15.32ms |
| stdev | 1.19ms |
| min | 12.76ms |
| max | 17.52ms |
| total | 306.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 15.34ms | 18.33ms | -2.99ms | -16.32% |
| p95 | 17.33ms | 34.05ms | -16.72ms | -49.11% |
| p99 | 17.48ms | 54.85ms | -37.37ms | -68.13% |
| mean | 15.32ms | 20.66ms | -5.34ms | -25.86% |
| min | 12.76ms | 11.31ms | +1.44ms | +12.75% |
| max | 17.52ms | 88.83ms | -71.31ms | -80.28% |
| total | 306.38ms | 2582.86ms | -2276.48ms | -88.14% |

