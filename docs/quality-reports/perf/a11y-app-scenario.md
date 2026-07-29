# Perf Suite — a11y-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限はこの 2 倍 = 0.00050ms。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | gate | regression |
|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 19.11ms | 22.46ms | 1200ms | PASS | improved — gate 無効 (regressionGate=false) |
| violation_report_batch (2 dirty runAxe + reportViolations) | 14.51ms | 16.08ms | 900ms | PASS | stable — gate 無効 (regressionGate=false) |
| audit_error_handling (3 invalid-context throw + catch) | 11.79ms | 14.15ms | 100ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 84.65ms | 2400ms | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | 67.35ms | 1800ms | PASS |
| audit_error_handling (3 invalid-context throw + catch) | 53.98ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | -304232 B | 0 B | 102400 B | yes | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | -57752 B | 0 B | 102400 B | yes | PASS |
| audit_error_handling (3 invalid-context throw + catch) | -157240 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### audit_workflow (3 fixture runAxe cycle)

# Perf Report — audit_workflow (3 fixture runAxe cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 19.11ms |
| p50 | 20.41ms |
| p95 | 22.46ms |
| p99 | 23.42ms |
| mean | 20.52ms |
| stdev | 1.30ms |
| min | 18.73ms |
| max | 23.65ms |
| total | 410.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 19.11ms | 25.70ms | -6.59ms | -25.65% |
| p50 | 20.41ms | 35.32ms | -14.91ms | -42.21% |
| p95 | 22.46ms | 123.96ms | -101.50ms | -81.88% |
| p99 | 23.42ms | 131.12ms | -107.70ms | -82.14% |
| mean | 20.52ms | 54.09ms | -33.57ms | -62.07% |
| min | 18.73ms | 22.21ms | -3.48ms | -15.67% |
| max | 23.65ms | 132.91ms | -109.26ms | -82.20% |
| total | 410.31ms | 1081.80ms | -671.49ms | -62.07% |

### violation_report_batch (2 dirty runAxe + reportViolations)

# Perf Report — violation_report_batch (2 dirty runAxe + reportViolations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 14.51ms |
| p50 | 15.38ms |
| p95 | 16.08ms |
| p99 | 16.68ms |
| mean | 15.28ms |
| stdev | 0.83ms |
| min | 13.46ms |
| max | 16.83ms |
| total | 305.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 14.51ms | 16.57ms | -2.06ms | -12.44% |
| p50 | 15.38ms | 18.35ms | -2.97ms | -16.19% |
| p95 | 16.08ms | 23.78ms | -7.69ms | -32.36% |
| p99 | 16.68ms | 24.53ms | -7.85ms | -31.99% |
| mean | 15.28ms | 19.36ms | -4.08ms | -21.06% |
| min | 13.46ms | 15.86ms | -2.40ms | -15.15% |
| max | 16.83ms | 24.72ms | -7.89ms | -31.90% |
| total | 305.63ms | 387.18ms | -81.56ms | -21.06% |

### audit_error_handling (3 invalid-context throw + catch)

# Perf Report — audit_error_handling (3 invalid-context throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 11.79ms |
| p50 | 12.61ms |
| p95 | 14.15ms |
| p99 | 14.15ms |
| mean | 12.53ms |
| stdev | 0.93ms |
| min | 10.46ms |
| max | 14.16ms |
| total | 250.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 11.79ms | 18.67ms | -6.88ms | -36.84% |
| p50 | 12.61ms | 21.23ms | -8.62ms | -40.62% |
| p95 | 14.15ms | 39.98ms | -25.83ms | -64.61% |
| p99 | 14.15ms | 44.57ms | -30.41ms | -68.24% |
| mean | 12.53ms | 23.64ms | -11.11ms | -47.01% |
| min | 10.46ms | 15.30ms | -4.84ms | -31.64% |
| max | 14.16ms | 45.71ms | -31.56ms | -69.03% |
| total | 250.51ms | 472.76ms | -222.25ms | -47.01% |

