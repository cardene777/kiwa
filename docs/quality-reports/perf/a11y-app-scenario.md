# Perf Suite — a11y-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 20.34ms | 33.30ms | 1200ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| violation_report_batch (2 dirty runAxe + reportViolations) | 15.10ms | 18.78ms | 900ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| audit_error_handling (3 invalid-context throw + catch) | 11.80ms | 15.49ms | 100ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 106.20ms | 2400ms | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | 81.58ms | 1800ms | PASS |
| audit_error_handling (3 invalid-context throw + catch) | 55.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | -207472 B | 0 B | 102400 B | yes | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | -43216 B | 0 B | 102400 B | yes | PASS |
| audit_error_handling (3 invalid-context throw + catch) | -58184 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### audit_workflow (3 fixture runAxe cycle)

# Perf Report — audit_workflow (3 fixture runAxe cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 20.34ms |
| p50 | 22.91ms |
| p95 | 33.30ms |
| p99 | 40.78ms |
| mean | 24.53ms |
| stdev | 5.37ms |
| min | 18.35ms |
| max | 42.65ms |
| total | 490.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 20.34ms | 25.70ms | -5.36ms | -20.87% |
| p50 | 22.91ms | 35.32ms | -12.41ms | -35.12% |
| p95 | 33.30ms | 123.96ms | -90.66ms | -73.14% |
| p99 | 40.78ms | 131.12ms | -90.34ms | -68.90% |
| mean | 24.53ms | 54.09ms | -29.56ms | -54.65% |
| min | 18.35ms | 22.21ms | -3.86ms | -17.36% |
| max | 42.65ms | 132.91ms | -90.26ms | -67.91% |
| total | 490.62ms | 1081.80ms | -591.18ms | -54.65% |

### violation_report_batch (2 dirty runAxe + reportViolations)

# Perf Report — violation_report_batch (2 dirty runAxe + reportViolations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 15.10ms |
| p50 | 16.85ms |
| p95 | 18.78ms |
| p99 | 19.99ms |
| mean | 17.02ms |
| stdev | 1.32ms |
| min | 15.02ms |
| max | 20.30ms |
| total | 340.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 15.10ms | 16.57ms | -1.47ms | -8.87% |
| p50 | 16.85ms | 18.35ms | -1.49ms | -8.15% |
| p95 | 18.78ms | 23.78ms | -5.00ms | -21.03% |
| p99 | 19.99ms | 24.53ms | -4.54ms | -18.50% |
| mean | 17.02ms | 19.36ms | -2.34ms | -12.06% |
| min | 15.02ms | 15.86ms | -0.84ms | -5.29% |
| max | 20.30ms | 24.72ms | -4.42ms | -17.90% |
| total | 340.48ms | 387.18ms | -46.71ms | -12.06% |

### audit_error_handling (3 invalid-context throw + catch)

# Perf Report — audit_error_handling (3 invalid-context throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 11.80ms |
| p50 | 13.67ms |
| p95 | 15.49ms |
| p99 | 16.78ms |
| mean | 13.63ms |
| stdev | 1.48ms |
| min | 10.45ms |
| max | 17.11ms |
| total | 272.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 11.80ms | 18.67ms | -6.86ms | -36.76% |
| p50 | 13.67ms | 21.23ms | -7.56ms | -35.59% |
| p95 | 15.49ms | 39.98ms | -24.49ms | -61.26% |
| p99 | 16.78ms | 44.57ms | -27.78ms | -62.34% |
| mean | 13.63ms | 23.64ms | -10.01ms | -42.34% |
| min | 10.45ms | 15.30ms | -4.85ms | -31.72% |
| max | 17.11ms | 45.71ms | -28.60ms | -62.58% |
| total | 272.57ms | 472.76ms | -200.19ms | -42.34% |

