# Perf Suite — a11y-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 20.08ms | 24.63ms | 1200ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |
| violation_report_batch (2 dirty runAxe + reportViolations) | 14.23ms | 16.37ms | 900ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| audit_error_handling (3 invalid-context throw + catch) | 12.00ms | 16.83ms | 100ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 83.74ms | 2400ms | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | 64.12ms | 1800ms | PASS |
| audit_error_handling (3 invalid-context throw + catch) | 55.24ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | -303696 B | 0 B | 102400 B | yes | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | -2131488 B | 15 B | 102400 B | yes | PASS |
| audit_error_handling (3 invalid-context throw + catch) | -138472 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### audit_workflow (3 fixture runAxe cycle)

# Perf Report — audit_workflow (3 fixture runAxe cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 20.08ms |
| p50 | 21.17ms |
| p95 | 24.63ms |
| p99 | 24.96ms |
| mean | 21.62ms |
| stdev | 1.70ms |
| min | 18.58ms |
| max | 25.04ms |
| total | 432.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 20.08ms | 25.70ms | -5.63ms | -21.89% |
| p50 | 21.17ms | 35.32ms | -14.15ms | -40.06% |
| p95 | 24.63ms | 123.96ms | -99.33ms | -80.13% |
| p99 | 24.96ms | 131.12ms | -106.16ms | -80.97% |
| mean | 21.62ms | 54.09ms | -32.47ms | -60.03% |
| min | 18.58ms | 22.21ms | -3.63ms | -16.32% |
| max | 25.04ms | 132.91ms | -107.87ms | -81.16% |
| total | 432.39ms | 1081.80ms | -649.41ms | -60.03% |

### violation_report_batch (2 dirty runAxe + reportViolations)

# Perf Report — violation_report_batch (2 dirty runAxe + reportViolations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 14.23ms |
| p50 | 14.97ms |
| p95 | 16.37ms |
| p99 | 17.28ms |
| mean | 15.17ms |
| stdev | 0.96ms |
| min | 13.98ms |
| max | 17.51ms |
| total | 303.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 14.23ms | 16.57ms | -2.34ms | -14.14% |
| p50 | 14.97ms | 18.35ms | -3.37ms | -18.38% |
| p95 | 16.37ms | 23.78ms | -7.41ms | -31.16% |
| p99 | 17.28ms | 24.53ms | -7.25ms | -29.55% |
| mean | 15.17ms | 19.36ms | -4.19ms | -21.65% |
| min | 13.98ms | 15.86ms | -1.88ms | -11.84% |
| max | 17.51ms | 24.72ms | -7.21ms | -29.17% |
| total | 303.36ms | 387.18ms | -83.83ms | -21.65% |

### audit_error_handling (3 invalid-context throw + catch)

# Perf Report — audit_error_handling (3 invalid-context throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 12.00ms |
| p50 | 13.88ms |
| p95 | 16.83ms |
| p99 | 17.21ms |
| mean | 14.08ms |
| stdev | 2.03ms |
| min | 9.39ms |
| max | 17.30ms |
| total | 281.67ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 12.00ms | 18.67ms | -6.67ms | -35.72% |
| p50 | 13.88ms | 21.23ms | -7.35ms | -34.60% |
| p95 | 16.83ms | 39.98ms | -23.15ms | -57.90% |
| p99 | 17.21ms | 44.57ms | -27.36ms | -61.39% |
| mean | 14.08ms | 23.64ms | -9.55ms | -40.42% |
| min | 9.39ms | 15.30ms | -5.91ms | -38.61% |
| max | 17.30ms | 45.71ms | -28.41ms | -62.16% |
| total | 281.67ms | 472.76ms | -191.09ms | -40.42% |

