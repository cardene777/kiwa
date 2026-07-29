# Perf Suite — a11y-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 19.09ms | 23.13ms | 1200ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |
| violation_report_batch (2 dirty runAxe + reportViolations) | 14.85ms | 18.00ms | 900ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| audit_error_handling (3 invalid-context throw + catch) | 13.19ms | 18.65ms | 100ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 87.69ms | 2400ms | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | 63.18ms | 1800ms | PASS |
| audit_error_handling (3 invalid-context throw + catch) | 55.81ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | -182416 B | 0 B | 102400 B | yes | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | -2036400 B | 0 B | 102400 B | yes | PASS |
| audit_error_handling (3 invalid-context throw + catch) | -118216 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### audit_workflow (3 fixture runAxe cycle)

# Perf Report — audit_workflow (3 fixture runAxe cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 19.09ms |
| p50 | 20.34ms |
| p95 | 23.13ms |
| p99 | 23.75ms |
| mean | 20.30ms |
| stdev | 1.48ms |
| min | 17.14ms |
| max | 23.90ms |
| total | 406.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 19.09ms | 25.70ms | -6.61ms | -25.72% |
| p50 | 20.34ms | 35.32ms | -14.98ms | -42.40% |
| p95 | 23.13ms | 123.96ms | -100.83ms | -81.34% |
| p99 | 23.75ms | 131.12ms | -107.37ms | -81.89% |
| mean | 20.30ms | 54.09ms | -33.79ms | -62.47% |
| min | 17.14ms | 22.21ms | -5.07ms | -22.83% |
| max | 23.90ms | 132.91ms | -109.01ms | -82.02% |
| total | 406.05ms | 1081.80ms | -675.76ms | -62.47% |

### violation_report_batch (2 dirty runAxe + reportViolations)

# Perf Report — violation_report_batch (2 dirty runAxe + reportViolations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 14.85ms |
| p50 | 15.85ms |
| p95 | 18.00ms |
| p99 | 19.54ms |
| mean | 16.08ms |
| stdev | 1.27ms |
| min | 14.31ms |
| max | 19.93ms |
| total | 321.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 14.85ms | 16.57ms | -1.72ms | -10.38% |
| p50 | 15.85ms | 18.35ms | -2.49ms | -13.58% |
| p95 | 18.00ms | 23.78ms | -5.77ms | -24.28% |
| p99 | 19.54ms | 24.53ms | -4.99ms | -20.33% |
| mean | 16.08ms | 19.36ms | -3.28ms | -16.92% |
| min | 14.31ms | 15.86ms | -1.55ms | -9.76% |
| max | 19.93ms | 24.72ms | -4.79ms | -19.38% |
| total | 321.68ms | 387.18ms | -65.50ms | -16.92% |

### audit_error_handling (3 invalid-context throw + catch)

# Perf Report — audit_error_handling (3 invalid-context throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 13.19ms |
| p50 | 15.02ms |
| p95 | 18.65ms |
| p99 | 19.12ms |
| mean | 15.42ms |
| stdev | 2.09ms |
| min | 12.42ms |
| max | 19.23ms |
| total | 308.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 13.19ms | 18.67ms | -5.47ms | -29.32% |
| p50 | 15.02ms | 21.23ms | -6.21ms | -29.24% |
| p95 | 18.65ms | 39.98ms | -21.32ms | -53.34% |
| p99 | 19.12ms | 44.57ms | -25.45ms | -57.10% |
| mean | 15.42ms | 23.64ms | -8.22ms | -34.76% |
| min | 12.42ms | 15.30ms | -2.88ms | -18.83% |
| max | 19.23ms | 45.71ms | -26.48ms | -57.93% |
| total | 308.45ms | 472.76ms | -164.31ms | -34.76% |

