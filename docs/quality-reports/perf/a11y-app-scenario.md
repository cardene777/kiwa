# Perf Suite — a11y-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 19.38ms | 26.35ms | 1200ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| violation_report_batch (2 dirty runAxe + reportViolations) | 14.54ms | 18.22ms | 900ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| audit_error_handling (3 invalid-context throw + catch) | 10.99ms | 13.71ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 79.45ms | 2400ms | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | 67.82ms | 1800ms | PASS |
| audit_error_handling (3 invalid-context throw + catch) | 52.75ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | -320752 B | 0 B | 102400 B | yes | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | -2057968 B | 0 B | 102400 B | yes | PASS |
| audit_error_handling (3 invalid-context throw + catch) | -126168 B | 40 B | 102400 B | yes | PASS |

## Detailed serial reports

### audit_workflow (3 fixture runAxe cycle)

# Perf Report — audit_workflow (3 fixture runAxe cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 19.38ms |
| p50 | 21.39ms |
| p95 | 26.35ms |
| p99 | 28.74ms |
| mean | 21.86ms |
| stdev | 2.67ms |
| min | 18.58ms |
| max | 29.34ms |
| total | 437.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 19.38ms | 25.70ms | -6.32ms | -24.59% |
| p50 | 21.39ms | 35.32ms | -13.93ms | -39.45% |
| p95 | 26.35ms | 123.96ms | -97.61ms | -78.74% |
| p99 | 28.74ms | 131.12ms | -102.38ms | -78.08% |
| mean | 21.86ms | 54.09ms | -32.23ms | -59.59% |
| min | 18.58ms | 22.21ms | -3.63ms | -16.33% |
| max | 29.34ms | 132.91ms | -103.57ms | -77.92% |
| total | 437.16ms | 1081.80ms | -644.64ms | -59.59% |

### violation_report_batch (2 dirty runAxe + reportViolations)

# Perf Report — violation_report_batch (2 dirty runAxe + reportViolations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 14.54ms |
| p50 | 15.94ms |
| p95 | 18.22ms |
| p99 | 19.78ms |
| mean | 16.20ms |
| stdev | 1.49ms |
| min | 14.10ms |
| max | 20.17ms |
| total | 324.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 14.54ms | 16.57ms | -2.04ms | -12.29% |
| p50 | 15.94ms | 18.35ms | -2.40ms | -13.10% |
| p95 | 18.22ms | 23.78ms | -5.56ms | -23.37% |
| p99 | 19.78ms | 24.53ms | -4.75ms | -19.37% |
| mean | 16.20ms | 19.36ms | -3.15ms | -16.30% |
| min | 14.10ms | 15.86ms | -1.76ms | -11.07% |
| max | 20.17ms | 24.72ms | -4.55ms | -18.41% |
| total | 324.09ms | 387.18ms | -63.09ms | -16.30% |

### audit_error_handling (3 invalid-context throw + catch)

# Perf Report — audit_error_handling (3 invalid-context throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 10.99ms |
| p50 | 13.13ms |
| p95 | 13.71ms |
| p99 | 14.06ms |
| mean | 12.72ms |
| stdev | 1.03ms |
| min | 10.64ms |
| max | 14.15ms |
| total | 254.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 10.99ms | 18.67ms | -7.68ms | -41.15% |
| p50 | 13.13ms | 21.23ms | -8.10ms | -38.18% |
| p95 | 13.71ms | 39.98ms | -26.26ms | -65.70% |
| p99 | 14.06ms | 44.57ms | -30.50ms | -68.45% |
| mean | 12.72ms | 23.64ms | -10.92ms | -46.18% |
| min | 10.64ms | 15.30ms | -4.66ms | -30.46% |
| max | 14.15ms | 45.71ms | -31.57ms | -69.05% |
| total | 254.44ms | 472.76ms | -218.32ms | -46.18% |

