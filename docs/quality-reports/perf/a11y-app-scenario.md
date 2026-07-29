# Perf Suite — a11y-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 18.57ms | 23.68ms | 1200ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |
| violation_report_batch (2 dirty runAxe + reportViolations) | 14.59ms | 18.38ms | 900ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| audit_error_handling (3 invalid-context throw + catch) | 11.88ms | 17.88ms | 100ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 81.00ms | 2400ms | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | 62.75ms | 1800ms | PASS |
| audit_error_handling (3 invalid-context throw + catch) | 62.46ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | -303704 B | 0 B | 102400 B | yes | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | -21096 B | 0 B | 102400 B | yes | PASS |
| audit_error_handling (3 invalid-context throw + catch) | -129720 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### audit_workflow (3 fixture runAxe cycle)

# Perf Report — audit_workflow (3 fixture runAxe cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 18.57ms |
| p50 | 21.04ms |
| p95 | 23.68ms |
| p99 | 23.70ms |
| mean | 20.90ms |
| stdev | 1.84ms |
| min | 18.33ms |
| max | 23.71ms |
| total | 417.91ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 18.57ms | 25.70ms | -7.13ms | -27.75% |
| p50 | 21.04ms | 35.32ms | -14.27ms | -40.42% |
| p95 | 23.68ms | 123.96ms | -100.28ms | -80.90% |
| p99 | 23.70ms | 131.12ms | -107.42ms | -81.92% |
| mean | 20.90ms | 54.09ms | -33.19ms | -61.37% |
| min | 18.33ms | 22.21ms | -3.88ms | -17.46% |
| max | 23.71ms | 132.91ms | -109.20ms | -82.16% |
| total | 417.91ms | 1081.80ms | -663.89ms | -61.37% |

### violation_report_batch (2 dirty runAxe + reportViolations)

# Perf Report — violation_report_batch (2 dirty runAxe + reportViolations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 14.59ms |
| p50 | 16.33ms |
| p95 | 18.38ms |
| p99 | 19.87ms |
| mean | 16.48ms |
| stdev | 1.56ms |
| min | 14.10ms |
| max | 20.24ms |
| total | 329.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 14.59ms | 16.57ms | -1.99ms | -11.99% |
| p50 | 16.33ms | 18.35ms | -2.01ms | -10.98% |
| p95 | 18.38ms | 23.78ms | -5.39ms | -22.68% |
| p99 | 19.87ms | 24.53ms | -4.66ms | -19.00% |
| mean | 16.48ms | 19.36ms | -2.88ms | -14.87% |
| min | 14.10ms | 15.86ms | -1.76ms | -11.08% |
| max | 20.24ms | 24.72ms | -4.48ms | -18.11% |
| total | 329.60ms | 387.18ms | -57.59ms | -14.87% |

### audit_error_handling (3 invalid-context throw + catch)

# Perf Report — audit_error_handling (3 invalid-context throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 11.88ms |
| p50 | 13.44ms |
| p95 | 17.88ms |
| p99 | 20.42ms |
| mean | 14.02ms |
| stdev | 2.23ms |
| min | 11.79ms |
| max | 21.05ms |
| total | 280.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 11.88ms | 18.67ms | -6.79ms | -36.36% |
| p50 | 13.44ms | 21.23ms | -7.79ms | -36.70% |
| p95 | 17.88ms | 39.98ms | -22.10ms | -55.28% |
| p99 | 20.42ms | 44.57ms | -24.15ms | -54.19% |
| mean | 14.02ms | 23.64ms | -9.61ms | -40.67% |
| min | 11.79ms | 15.30ms | -3.52ms | -22.97% |
| max | 21.05ms | 45.71ms | -24.66ms | -53.95% |
| total | 280.49ms | 472.76ms | -192.27ms | -40.67% |

