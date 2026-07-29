# Perf Suite — a11y-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 19.71ms | 27.08ms | 1200ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| violation_report_batch (2 dirty runAxe + reportViolations) | 15.79ms | 18.06ms | 900ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| audit_error_handling (3 invalid-context throw + catch) | 12.57ms | 15.18ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 86.85ms | 2400ms | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | 71.41ms | 1800ms | PASS |
| audit_error_handling (3 invalid-context throw + catch) | 73.33ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | -296800 B | 0 B | 102400 B | yes | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | -2171568 B | 0 B | 102400 B | yes | PASS |
| audit_error_handling (3 invalid-context throw + catch) | -133696 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### audit_workflow (3 fixture runAxe cycle)

# Perf Report — audit_workflow (3 fixture runAxe cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 19.71ms |
| p50 | 22.36ms |
| p95 | 27.08ms |
| p99 | 27.71ms |
| mean | 22.53ms |
| stdev | 2.26ms |
| min | 19.39ms |
| max | 27.87ms |
| total | 450.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 19.71ms | 25.70ms | -5.99ms | -23.31% |
| p50 | 22.36ms | 35.32ms | -12.96ms | -36.70% |
| p95 | 27.08ms | 123.96ms | -96.88ms | -78.15% |
| p99 | 27.71ms | 131.12ms | -103.41ms | -78.87% |
| mean | 22.53ms | 54.09ms | -31.56ms | -58.34% |
| min | 19.39ms | 22.21ms | -2.82ms | -12.71% |
| max | 27.87ms | 132.91ms | -105.04ms | -79.03% |
| total | 450.64ms | 1081.80ms | -631.16ms | -58.34% |

### violation_report_batch (2 dirty runAxe + reportViolations)

# Perf Report — violation_report_batch (2 dirty runAxe + reportViolations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 15.79ms |
| p50 | 16.73ms |
| p95 | 18.06ms |
| p99 | 18.15ms |
| mean | 16.84ms |
| stdev | 0.85ms |
| min | 15.66ms |
| max | 18.17ms |
| total | 336.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 15.79ms | 16.57ms | -0.78ms | -4.74% |
| p50 | 16.73ms | 18.35ms | -1.62ms | -8.80% |
| p95 | 18.06ms | 23.78ms | -5.71ms | -24.03% |
| p99 | 18.15ms | 24.53ms | -6.38ms | -26.03% |
| mean | 16.84ms | 19.36ms | -2.52ms | -13.01% |
| min | 15.66ms | 15.86ms | -0.20ms | -1.26% |
| max | 18.17ms | 24.72ms | -6.55ms | -26.51% |
| total | 336.81ms | 387.18ms | -50.38ms | -13.01% |

### audit_error_handling (3 invalid-context throw + catch)

# Perf Report — audit_error_handling (3 invalid-context throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 12.57ms |
| p50 | 14.03ms |
| p95 | 15.18ms |
| p99 | 15.23ms |
| mean | 13.76ms |
| stdev | 1.03ms |
| min | 11.15ms |
| max | 15.25ms |
| total | 275.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 12.57ms | 18.67ms | -6.10ms | -32.66% |
| p50 | 14.03ms | 21.23ms | -7.20ms | -33.90% |
| p95 | 15.18ms | 39.98ms | -24.79ms | -62.02% |
| p99 | 15.23ms | 44.57ms | -29.33ms | -65.82% |
| mean | 13.76ms | 23.64ms | -9.87ms | -41.77% |
| min | 11.15ms | 15.30ms | -4.16ms | -27.17% |
| max | 15.25ms | 45.71ms | -30.47ms | -66.65% |
| total | 275.30ms | 472.76ms | -197.47ms | -41.77% |

